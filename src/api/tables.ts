import { authFetch } from "./auth";

export interface TableBooking {
  id: number;
  table_id: number;
  head_count: number;
  contact_id: number | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  active_table_id: number | null;
  note: string | null;
  contact_name: string | null;
  contact_mobile: string | null;
  extra_persons: unknown[];
  extra_head_count: number;
  total_head_count: number;
}

export interface ApiTable {
  id: number;
  name: string;
  chair_count: number;
  description: string | null;
  location_id: number | null;
  booking: TableBooking | null;
}

interface TablesApiRaw {
  status?: boolean;
  message?: string;
  data?: {
    location_id?: number | null;
    tables?: ApiTable[];
  };
}

export async function fetchTables(token: string): Promise<ApiTable[]> {
  const res = await authFetch("/tables", token);
  let data: TablesApiRaw | null = null;
  try {
    data = (await res.json()) as TablesApiRaw;
  } catch {
    throw new Error(`Failed to load tables (server returned ${res.status}).`);
  }
  if (!res.ok || data?.status === false) {
    throw new Error(data?.message || `Failed to load tables (${res.status}).`);
  }
  return data?.data?.tables ?? [];
}
