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
  status?: boolean;
  message?: string;
  data?: unknown;
}

export async function storeKotOrder(
  token: string,
  payload: KotStorePayload,
): Promise<unknown> {
  const res = await authFetch("/kot/store", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  let data: KotStoreApiRaw | null = null;
  try {
    data = (await res.json()) as KotStoreApiRaw;
  } catch {
    throw new Error(`Failed to store KOT (server returned ${res.status}).`);
  }
  if (!res.ok || data?.status === false) {
    throw new Error(data?.message || `Failed to store KOT (${res.status}).`);
  }
  return data?.data ?? data;
}
