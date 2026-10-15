import * as SecureStore from "expo-secure-store";
import TcpSocket from "react-native-tcp-socket";

const STORAGE_KEY = "zuzu_printers_config";

let memoryCache: PrinterConfig | null = null;

export interface PrinterConfig {
  kotIp: string;
  billingIp: string;
  port: number;
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  kotIp: "192.168.1.150",
  billingIp: "192.168.1.200",
  port: 9100,
};

export async function loadPrinterConfig(): Promise<PrinterConfig> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return memoryCache ?? DEFAULT_PRINTER_CONFIG;
    const parsed = JSON.parse(raw);
    const config = {
      kotIp:
        typeof parsed.kotIp === "string"
          ? parsed.kotIp
          : DEFAULT_PRINTER_CONFIG.kotIp,
      billingIp:
        typeof parsed.billingIp === "string"
          ? parsed.billingIp
          : DEFAULT_PRINTER_CONFIG.billingIp,
      port:
        typeof parsed.port === "number"
          ? parsed.port
          : DEFAULT_PRINTER_CONFIG.port,
    };
    memoryCache = config;
    return config;
  } catch {
    return memoryCache ?? DEFAULT_PRINTER_CONFIG;
  }
}

export async function savePrinterConfig(config: PrinterConfig): Promise<void> {
  memoryCache = config;
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Could not persist printer config", e);
  }
}

export function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

const ESC = "\x1B";
const GS = "\x1D";
const LF = "\n";

const COLS = 32;

export function toAscii(text: string): string {
  return text
    .replace(/₹/g, "Rs ")
    .replace(/[^\x20-\x7E\n]/g, "")
    .slice(0, 500);
}

const init = () => `${ESC}@`;
const alignCenter = () => `${ESC}a\x01`;
const alignLeft = () => `${ESC}a\x00`;
const alignRight = () => `${ESC}a\x02`;
const boldOn = () => `${ESC}E\x01`;
const boldOff = () => `${ESC}E\x00`;
const doubleSizeOn = () => `${GS}!\x11`;
const doubleSizeOff = () => `${GS}!\x00`;
const cut = () => `${LF}${LF}${LF}${GS}V\x00`;

const hr = () => "-".repeat(COLS) + LF;

function centered(text: string): string {
  const clean = toAscii(text).slice(0, COLS);
  const pad = Math.max(0, Math.floor((COLS - clean.length) / 2));
  return " ".repeat(pad) + clean + LF;
}

function row(left: string, right: string): string {
  const r = toAscii(right).slice(0, COLS);
  const maxLeft = Math.max(0, COLS - r.length - 1);
  const l = toAscii(left).slice(0, maxLeft);
  return l + " ".repeat(COLS - l.length - r.length) + r + LF;
}

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
}

function formatDateTime(when: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())} ` +
    `${pad(when.getHours())}:${pad(when.getMinutes())}`
  );
}

export interface SendOptions {
  host: string;
  port?: number;
  data: string;
  timeoutMs?: number;
}

export function sendToPrinter({
  host,
  port = 9100,
  data,
  timeoutMs = 6000,
}: SendOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let client: any = null;

    const finish = (err?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        client?.destroy();
      } catch {}
      if (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } else {
        resolve();
      }
    };

    const timer = setTimeout(() => {
      finish(
        new Error(
          `Could not reach printer at ${host}:${port}. Check the IP and that the phone is on the same WiFi network.`,
        ),
      );
    }, timeoutMs);

    try {
      client = TcpSocket.createConnection({ host, port }, () => {
        try {
          client.write(data);

          setTimeout(() => finish(), 800);
        } catch (e) {
          finish(e);
        }
      });
      client.on("error", (e: unknown) => finish(e));
      client.on("timeout", () =>
        finish(new Error(`Connection to ${host}:${port} timed out.`)),
      );
    } catch (e) {
      finish(e);
    }
  });
}

export async function printTestPage(
  host: string,
  label: string,
  port = 9100,
): Promise<void> {
  const out =
    init() +
    alignCenter() +
    doubleSizeOn() +
    "ZuZu Games Cafe" +
    LF +
    doubleSizeOff() +
    boldOn() +
    `${label} Printer` +
    LF +
    boldOff() +
    `IP: ${host}` +
    LF +
    formatDateTime() +
    LF +
    alignLeft() +
    hr() +
    row("Cold Coffee x2", "Rs 240") +
    row("Cheese Pizza x1", "Rs 280") +
    hr() +
    row("TOTAL", "Rs 520") +
    hr() +
    alignCenter() +
    "Test print OK" +
    LF +
    cut();
  await sendToPrinter({ host, port, data: out });
}

export interface KotTicket {
  table: string;
  orderId: string;
  items: ReceiptItem[];
  note?: string;
}

export async function printKotTicket(
  host: string,
  ticket: KotTicket,
  port = 9100,
): Promise<void> {
  let out =
    init() +
    alignCenter() +
    doubleSizeOn() +
    "KOT" +
    LF +
    doubleSizeOff() +
    boldOn() +
    `Table ${toAscii(ticket.table)}` +
    LF +
    boldOff() +
    `Order ${toAscii(ticket.orderId)}` +
    LF +
    formatDateTime() +
    LF +
    alignLeft() +
    hr();
  for (const item of ticket.items) {
    out += row(`${item.qty}x ${item.name}`, "");
  }
  if (ticket.note) {
    out += hr() + `Note: ${toAscii(ticket.note)}` + LF;
  }
  out += hr() + cut();
  await sendToPrinter({ host, port, data: out });
}

export interface BillTicket {
  table: string;
  orderId: string;
  items: ReceiptItem[];
}

export async function printBill(
  host: string,
  ticket: BillTicket,
  port = 9100,
): Promise<void> {
  const total = ticket.items.reduce((s, i) => s + i.qty * i.price, 0);
  let out =
    init() +
    alignCenter() +
    doubleSizeOn() +
    "ZuZu Games Cafe" +
    LF +
    doubleSizeOff() +
    `Table ${toAscii(ticket.table)}  Order ${toAscii(ticket.orderId)}` +
    LF +
    formatDateTime() +
    LF +
    alignLeft() +
    hr();
  for (const item of ticket.items) {
    out += row(`${item.qty}x ${item.name}`, `Rs ${item.qty * item.price}`);
  }
  out += hr() + boldOn() + row("TOTAL", `Rs ${total}`) + boldOff() + hr();
  out += alignCenter() + "Thank you, visit again!" + LF + cut();
  await sendToPrinter({ host, port, data: out });
}
