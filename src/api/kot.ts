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
