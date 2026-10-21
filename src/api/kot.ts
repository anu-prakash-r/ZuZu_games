import { authFetch } from "./auth";

export interface KotProductLine {
  product_id: number;
  variation_id: number;
  quantity: number;
  unit_price: number;
  unit_price_inc_tax: number;
  item_tax: number;
  tax_id: number | null;
  sell_line_note: string | null;
}

export interface KotStorePayload {
  location_id: number;
  res_table_id: number;
  booking_id: number | null;
  contact_id: number | null;
  res_waiter_id: number | null;
  order_type: string;
  chair_no: string;
  staff_note: string | null;
  types_of_service_id: number | null;
  products: KotProductLine[];
}

interface KotStoreApiRaw {
  status?: boolean | string;
  message?: string;
  data?: unknown;
}

export interface KotResponseItem {
  product_id: number;
  variation_id: number;
  name: string;
  qty: number;
  unit_price: number;
  unit_price_inc_tax: number;
  total_price: number;
  note: string | null;
}

export interface KotResponseKot {
  invoice_no: string;
  table_name: string;
  date: string;
  time: string;
  service_type: string;
  items: KotResponseItem[];
}

export interface KotStoreResponse {
  waiter_order_id: number;
  token_no: string;
  is_new_order: boolean;
  business_id: number;
  location_id: number;
  table_id: number;
  table_name: string;
  contact_id: number | null;
  booking_id: number | null;
  status: string;
  kot_amount: number;
  order_total: number;
  print_kot: boolean;
  print_invoice: boolean;
  kot_printer: string | null;
  kot_printer_port: number | null;
  kot: KotResponseKot | null;
}

export interface KotDetailsItem {
  name: string;
  qty: number;
  unitPrice: number | null;
  totalPrice: number | null;
  note: string | null;
  productId: number | null;
  variationId: number | null;
  rowId: number | null;
}

export interface KotDetailsBundle {
  items: KotDetailsItem[];
  waiterOrderId: number | null;
}

interface KotDetailsApiRaw {
  status?: boolean | string;
  message?: string;
  data?: unknown;
}

function toNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function firstString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function normalizeKotLine(raw: unknown): KotDetailsItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const nested = ["variation", "product", "item"].reduce<Record<
    string,
    unknown
  > | null>(
    (acc, key) =>
      acc ??
      (r[key] && typeof r[key] === "object"
        ? (r[key] as Record<string, unknown>)
        : null),
    null,
  );
  const name = firstString(
    r.name,
    r.product_name,
    r.item_name,
    r.display_name,
    nested?.name,
    nested?.product_name,
  );
  const qty = toNum(r.qty) ?? toNum(r.quantity) ?? 0;
  const unitPrice =
    toNum(r.unit_price) ??
    toNum(r.price) ??
    toNum(r.unit_price_inc_tax) ??
    toNum(nested?.unit_price) ??
    toNum(nested?.price);
  const totalPrice =
    toNum(r.total_price) ?? toNum(r.line_total) ?? toNum(r.total);
  const note = firstString(
    r.note,
    r.sell_line_note,
    r.item_note,
    r.kot_note,
    nested?.note,
  );
  const productId =
    toNum(r.product_id) ??
    toNum(r.productId) ??
    toNum(nested?.product_id) ??
    toNum(nested?.id);
  const variationId =
    toNum(r.variation_id) ??
    toNum(r.variationId) ??
    toNum(nested?.variation_id);
  const rawRowId =
    toNum(r.waiter_order_item_id) ??
    toNum(r.order_item_id) ??
    toNum(r.item_id) ??
    toNum(r.sell_line_id) ??
    toNum(r.id);
  const rowId = rawRowId !== null && rawRowId !== productId ? rawRowId : null;
  if (!name && qty <= 0) return null;
  return {
    name: name ?? "Item",
    qty,
    unitPrice,
    totalPrice,
    note,
    productId,
    variationId,
    rowId,
  };
}

const WAITER_ORDER_ID_KEYS = ["waiter_order_id", "waiterOrderId"];

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

  for (const key of WAITER_ORDER_ID_KEYS) {
    const n = toNum(obj[key]);
    if (n !== null) return n;
  }

  const nested = obj.waiter_order;
  if (nested && typeof nested === "object") {
    const n =
      toNum((nested as Record<string, unknown>).waiter_order_id) ??
      toNum((nested as Record<string, unknown>).id);
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

const KOT_NESTED_KEYS = [
  "items",
  "kot_items",
  "products",
  "sell_lines",
  "order_items",
  "lines",
  "kots",
];

function collectKotItems(
  node: unknown,
  out: KotDetailsItem[],
  depth = 0,
): void {
  if (depth > 5 || node === null || node === undefined) return;

  if (Array.isArray(node)) {
    for (const el of node) {
      const isContainer =
        el !== null &&
        typeof el === "object" &&
        KOT_NESTED_KEYS.some((k) => k in (el as object));
      if (isContainer) {
        collectKotItems(el, out, depth + 1);
      } else {
        const line = normalizeKotLine(el);
        if (line) out.push(line);
      }
    }
    return;
  }

  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  let matched = false;
  for (const key of KOT_NESTED_KEYS) {
    if (key in obj) {
      matched = true;
      collectKotItems(obj[key], out, depth + 1);
    }
  }
  if (!matched) {
    if ("data" in obj) collectKotItems(obj.data, out, depth + 1);
    else {
      const line = normalizeKotLine(obj);
      if (line) out.push(line);
    }
  }
}

/**
 * Lenient extractor for `/kot/details` — the endpoint's exact shape is not
 * typed yet, so look for order lines under the common wrappers.
 */
export function extractKotDetailsItems(payload: unknown): KotDetailsItem[] {
  const out: KotDetailsItem[] = [];
  collectKotItems(payload, out);
  return out;
}

/** Same payload, plus the parent `waiter_order_id` the items belong to. */
export function extractKotDetailsBundle(payload: unknown): KotDetailsBundle {
  return {
    items: extractKotDetailsItems(payload),
    waiterOrderId: findWaiterOrderId(payload),
  };
}

async function fetchKotDetailsPayload(
  token: string,
  tableId: number,
  bookingId: number,
): Promise<unknown> {
  const res = await authFetch(
    `/kot/details?table_id=${tableId}&booking_id=${bookingId}`,
    token,
  );
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Failed to load KOT details (server returned ${res.status}).`,
    );
  }
  const raw = data as KotDetailsApiRaw | null;
  if (!res.ok || raw?.status === false) {
    throw new Error(
      raw?.message || `Failed to load KOT details (${res.status}).`,
    );
  }
  return data;
}

/** GET `/kot/details?table_id=<id>&booking_id=<id>` — food details for a room. */
export async function fetchKotDetails(
  token: string,
  tableId: number,
  bookingId: number,
): Promise<KotDetailsItem[]> {
  const data = await fetchKotDetailsPayload(token, tableId, bookingId);
  return extractKotDetailsItems(data);
}

/** Same request, keeping the order id alongside the lines. */
export async function fetchKotDetailsBundle(
  token: string,
  tableId: number,
  bookingId: number,
): Promise<KotDetailsBundle> {
  const data = await fetchKotDetailsPayload(token, tableId, bookingId);
  return extractKotDetailsBundle(data);
}

export async function storeKotOrder(
  token: string,
  payload: KotStorePayload,
): Promise<KotStoreResponse> {
  const res = await authFetch("/kot/store", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  let data: (KotStoreResponse & KotStoreApiRaw) | null = null;
  try {
    data = (await res.json()) as KotStoreResponse & KotStoreApiRaw;
  } catch {
    throw new Error(`Failed to store KOT (server returned ${res.status}).`);
  }
  const failed = (data as KotStoreApiRaw | null)?.status === false;
  if (!res.ok || failed) {
    throw new Error(data?.message || `Failed to store KOT (${res.status}).`);
  }
  return data as KotStoreResponse;
}
