import { authFetch } from "./auth";

export interface WaiterOrderItemRow {
  id: number;
  waiter_order_id: number;
  qty: number;
  product_id?: number | null;
  variation_id?: number | null;
  name?: string | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
}

export interface WaiterOrderLine {
  rowId: number | null;
  productId: number | null;
  variationId: number | null;
  name: string;
  desiredQty: number;
}

export interface WaiterOrderSyncResult {
  updated: number;
  deleted: number;
}

export interface WaiterOrderSnapshot {
  waiterOrderId: number | null;
  items: WaiterOrderItemRow[];
}

interface WaiterOrderApiRaw {
  status?: boolean | string;
  success?: boolean | string;
  message?: string;
  msg?: string;
  data?: unknown;
}

function isFailed(data: ApiPayload | null): boolean {
  if (!data) return false;
  return data.status === false || data.success === false;
}

type ApiPayload = WaiterOrderApiRaw & Record<string, unknown>;

function toNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickNum(
  source: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const n = toNum(source[key]);
    if (n !== null) return n;
  }
  return null;
}

function pickString(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const v = source[key];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return null;
}

const ROW_ID_KEYS = [
  "waiter_order_item_id",
  "order_item_id",
  "item_id",
  "sell_line_id",
  "id",
];
const QTY_KEYS = ["qty", "quantity"];
const WAITER_ORDER_ID_KEYS = ["waiter_order_id", "waiterOrderId"];
const ROW_CONTAINER_KEYS = [
  "items",
  "waiter_order_items",
  "order_items",
  "sell_lines",
  "lines",
  "kot_items",
];
const NESTED_KEYS = ["data", "waiter_order", "order", "kot"];

function toRow(
  raw: unknown,
  fallbackWaiterOrderId: number | null,
): WaiterOrderItemRow | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const id = pickNum(r, ROW_ID_KEYS);
  const qty = pickNum(r, QTY_KEYS);
  const waiterOrderId =
    pickNum(r, WAITER_ORDER_ID_KEYS) ?? fallbackWaiterOrderId;
  if (id === null || qty === null || waiterOrderId === null) return null;
  return {
    id,
    waiter_order_id: waiterOrderId,
    qty,
    product_id: pickNum(r, ["product_id", "productId"]),
    variation_id: pickNum(r, ["variation_id", "variationId"]),
    name: pickString(r, ["name", "product_name", "item_name", "display_name"]),
    unitPrice: pickNum(r, [
      "unit_price",
      "unit_price_inc_tax",
      "price",
      "unitPrice",
    ]),
    totalPrice: pickNum(r, [
      "total_price",
      "line_total",
      "total",
      "totalPrice",
    ]),
  };
}

function collectRows(
  node: unknown,
  fallbackWaiterOrderId: number | null,
  out: WaiterOrderItemRow[],
  depth = 0,
): void {
  if (depth > 6 || node === null || node === undefined) return;
  if (Array.isArray(node)) {
    for (const el of node)
      collectRows(el, fallbackWaiterOrderId, out, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;

  let recursed = false;
  for (const key of ROW_CONTAINER_KEYS) {
    if (Array.isArray(obj[key])) {
      recursed = true;
      collectRows(obj[key], fallbackWaiterOrderId, out, depth + 1);
    }
  }
  if (recursed) return;

  for (const key of NESTED_KEYS) {
    if (obj[key] && typeof obj[key] === "object") {
      collectRows(obj[key], fallbackWaiterOrderId, out, depth + 1);
      return;
    }
  }

  const row = toRow(obj, fallbackWaiterOrderId);
  if (row) out.push(row);
}

function findWaiterOrderId(node: unknown, depth = 0): number | null {
  if (depth > 6 || node === null || node === undefined) return null;
  if (Array.isArray(node)) {
    for (const el of node) {
      const found = findWaiterOrderId(el, depth + 1);
      if (found !== null) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;

  const direct = pickNum(obj, WAITER_ORDER_ID_KEYS);
  if (direct !== null) return direct;

  const nested = obj.waiter_order;
  if (nested && typeof nested === "object") {
    const n = pickNum(nested as Record<string, unknown>, [
      "waiter_order_id",
      "id",
    ]);
    if (n !== null) return n;
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const found = findWaiterOrderId(value, depth + 1);
      if (found !== null) return found;
    }
  }
  return null;
}

export function extractWaiterOrderSnapshot(
  payload: unknown,
  fallbackWaiterOrderId: number | null = null,
): WaiterOrderSnapshot {
  const waiterOrderId = findWaiterOrderId(payload) ?? fallbackWaiterOrderId;
  const items: WaiterOrderItemRow[] = [];
  collectRows(payload, waiterOrderId, items);
  return { waiterOrderId, items };
}

function parseJson(raw: string): ApiPayload | null {
  if (raw.trim().length === 0) return null;
  try {
    return JSON.parse(raw) as ApiPayload;
  } catch {
    return null;
  }
}

function failureMessage(
  status: number,
  data: ApiPayload | null,
  raw: string,
  action: string,
): string {
  const message =
    typeof data?.message === "string" && data.message.trim() !== ""
      ? data.message.trim()
      : typeof data?.msg === "string" && data.msg.trim() !== ""
        ? data.msg.trim()
        : "";
  if (message) return message;

  if (status === 500 && /RoomBookingController/.test(raw)) {
    return (
      "The API route exists but RoomBookingController is missing on the server. " +
      "Deploy the controller (or fix its `use` import in routes/api.php) and retry."
    );
  }
  if (status === 405) {
    return `The API rejected the request method (HTTP 405) while trying to ${action}. Expected PUT.`;
  }
  if (status === 401) {
    return "Your session has expired. Sign in again and retry.";
  }
  if (status === 404) {
    return `The API endpoint was not found (HTTP 404) while trying to ${action}.`;
  }
  return `Failed to ${action} (server returned HTTP ${status}).`;
}

export async function fetchWaiterOrder(
  token: string,
  waiterOrderId: number,
): Promise<WaiterOrderSnapshot> {
  const res = await authFetch(`/waiter-orders/${waiterOrderId}`, token);
  const raw = await res.text().catch(() => "");
  const data = parseJson(raw);
  if (!res.ok || data?.status === false) {
    throw new Error(
      failureMessage(res.status, data, raw, "load the waiter order"),
    );
  }
  return extractWaiterOrderSnapshot(data, waiterOrderId);
}

export async function fetchWaiterOrderItemsByBooking(
  token: string,
  bookingId: number,
): Promise<WaiterOrderSnapshot> {
  const res = await authFetch(
    `/room-booking/${bookingId}/get_waiter-order-items`,
    token,
  );
  const raw = await res.text().catch(() => "");
  const data = parseJson(raw);
  if (!res.ok || isFailed(data)) {
    throw new Error(
      failureMessage(res.status, data, raw, "load the order items"),
    );
  }
  return extractWaiterOrderSnapshot(data);
}

export async function replaceWaiterOrderItems(
  token: string,
  bookingId: number,
  rows: WaiterOrderItemRow[],
): Promise<void> {
  const items = rows.map((row) => ({
    id: row.id,
    waiter_order_id: row.waiter_order_id,
    qty: row.qty,
  }));

  const res = await authFetch(
    `/room-booking/${bookingId}/update_waiter-order-items`,
    token,
    {
      method: "PUT",
      body: JSON.stringify({ items }),
    },
  );

  const raw = await res.text().catch(() => "");
  const data = parseJson(raw);
  if (!res.ok || isFailed(data)) {
    throw new Error(
      failureMessage(res.status, data, raw, "update the order items"),
    );
  }
}

function matchRow(
  line: WaiterOrderLine,
  rows: WaiterOrderItemRow[],
  used: Set<number>,
): WaiterOrderItemRow | null {
  const candidates = rows.filter((row) => !used.has(row.id));

  if (line.productId !== null) {
    const hit = candidates.find((row) => row.product_id === line.productId);
    if (hit) return hit;
  }
  if (line.variationId !== null) {
    const hit = candidates.find((row) => row.variation_id === line.variationId);
    if (hit) return hit;
  }
  const name = line.name.trim().toLowerCase();
  if (name) {
    const hit = candidates.find(
      (row) => (row.name ?? "").trim().toLowerCase() === name,
    );
    if (hit) return hit;
  }
  return null;
}

export async function syncWaiterOrderItems(
  token: string,
  bookingId: number,
  waiterOrderId: number | null,
  lines: WaiterOrderLine[],
): Promise<WaiterOrderSyncResult> {
  const survivors = lines.filter((line) => line.desiredQty > 0);
  const deleted = lines.length - survivors.length;

  if (survivors.length === 0) {
    if (lines.length === 0) return { updated: 0, deleted: 0 };
    await replaceWaiterOrderItems(token, bookingId, []);
    return { updated: 0, deleted };
  }

  if (waiterOrderId === null) {
    throw new Error(
      "Cannot update items: the API did not return a waiter_order_id for this booking. " +
        "Ask the backend to include it in /kot/details (or via /waiter-orders/{id}).",
    );
  }

  const resolved: WaiterOrderLine[] = survivors.map((line) => ({ ...line }));
  const used = new Set(
    resolved
      .filter((line) => line.rowId !== null)
      .map((line) => line.rowId as number),
  );

  if (resolved.some((line) => line.rowId === null)) {
    const snapshot = await fetchWaiterOrderItemsByBooking(
      token,
      bookingId,
    ).catch(() => null);
    if (snapshot) {
      for (const line of resolved) {
        if (line.rowId !== null) continue;
        const hit = matchRow(line, snapshot.items, used);
        if (hit) {
          line.rowId = hit.id;
          used.add(hit.id);
        }
      }
    }
  }

  const unaddressable = resolved.filter((line) => line.rowId === null);
  if (unaddressable.length > 0) {
    const names = unaddressable
      .map((line) => line.name || "unnamed item")
      .join(", ");
    throw new Error(
      `Cannot update ${names}: the API did not return an item id for ${
        unaddressable.length === 1 ? "it" : "them"
      }. ` +
        "Editing and deleting need the waiter order item id, so it has to come from /kot/details or /waiter-orders/{id}.",
    );
  }

  await replaceWaiterOrderItems(
    token,
    bookingId,
    resolved.map((line) => ({
      id: line.rowId as number,
      waiter_order_id: waiterOrderId,
      qty: line.desiredQty,
    })),
  );

  return { updated: resolved.length, deleted };
}
