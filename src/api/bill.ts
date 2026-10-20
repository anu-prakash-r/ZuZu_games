import { authFetch } from "./auth";

export interface CloseBillPayload {
  payment_method?: string;
  discount?: number;
  note?: string | null;
  [key: string]: unknown;
}

interface BillApiRaw {
  status?: boolean | string;
  message?: string;
  data?: unknown;
}

export interface CloseBillResponse {
  [key: string]: unknown;
}

export async function closeTableBill(
  token: string,
  orderId: number | string,
  payload?: CloseBillPayload,
): Promise<CloseBillResponse> {
  const res = await authFetch(`/order/${orderId}/bill`, token, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });

  let data: (CloseBillResponse & BillApiRaw) | null = null;
  try {
    data = (await res.json()) as CloseBillResponse & BillApiRaw;
  } catch {
    throw new Error(
      `Failed to close the bill (server returned ${res.status}).`,
    );
  }

  const failed = (data as BillApiRaw | null)?.status === false;
  if (!res.ok || failed) {
    throw new Error(
      data?.message || `Failed to close the bill (${res.status}).`,
    );
  }
  return data as CloseBillResponse;
}
