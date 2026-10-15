import { authFetch } from "./auth";

export interface Product {
  product_id: number;
  product_name: string;
  business_id: number;
  variation_id: number;
  unit_price_inc_tax: string;
  sku_no: string;
  category_id: number;
  sub_category_id: number;
}

interface ProductsApiRaw {
  status?: boolean;
  message?: string;
  business_id?: number;
  data?: Product[];
}

export async function fetchProducts(token: string): Promise<Product[]> {
  const res = await authFetch("/products", token);
  let data: ProductsApiRaw | null = null;
  try {
    data = (await res.json()) as ProductsApiRaw;
  } catch {
    throw new Error(`Failed to load products (server returned ${res.status}).`);
  }
  if (!res.ok || data?.status === false) {
    throw new Error(data?.message || `Failed to load products (${res.status}).`);
  }
  return data?.data ?? [];
}

/** Unit price as whole rupees — API sends strings like "100.0000". */
export function productPrice(p: Product): number {
  const n = parseFloat(p.unit_price_inc_tax);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
