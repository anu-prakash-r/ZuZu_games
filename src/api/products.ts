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
    throw new Error(
      data?.message || `Failed to load products (${res.status}).`,
    );
  }
  return data?.data ?? [];
}

/** Unit price as whole rupees — API sends strings like "100.0000". */
export function productPrice(p: Product): number {
  const n = parseFloat(p.unit_price_inc_tax);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export interface Category {
  id?: number;
  category_id?: number;
  name: string;
  short_code?: string;
  description?: string;
  parent_id?: number;
  slug?: string | null;
}

interface CategoriesApiRaw {
  status?: boolean;
  message?: string;
  data?: unknown;
}

function unwrapCategoryList(raw: unknown): Category[] {
  if (Array.isArray(raw)) return raw as Category[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["categories", "data", "result", "list"]) {
      if (Array.isArray(obj[key])) return obj[key] as Category[];
    }
  }
  return [];
}

export async function fetchCategories(token: string): Promise<Category[]> {
  const res = await authFetch("/categories", token);
  let data: CategoriesApiRaw | null = null;
  try {
    data = (await res.json()) as CategoriesApiRaw;
  } catch {
    throw new Error(
      `Failed to load categories (server returned ${res.status}).`,
    );
  }
  if (!res.ok || data?.status === false) {
    throw new Error(
      data?.message || `Failed to load categories (${res.status}).`,
    );
  }
  return unwrapCategoryList(data?.data).map((c) => ({
    ...c,
    id: c.category_id ?? c.id,
  }));
}
