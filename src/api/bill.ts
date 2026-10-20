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

  const rawBody = await res.text().catch(() => "");

  let data: (CloseBillResponse & BillApiRaw) | null = null;
  if (rawBody.trim().length > 0) {
    try {
      data = JSON.parse(rawBody) as CloseBillResponse & BillApiRaw;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new Error(
      data?.message ||
        `Failed to close the bill (server returned ${res.status}).`,
    );
  }

  if (!data) {
    if (rawBody.trim().length === 0) return {};

    const snippet = rawBody.trim().slice(0, 120).replace(/\s+/g, " ");
    throw new Error(
      `Server returned an unexpected response instead of a bill (HTTP ${res.status}): ${snippet}`,
    );
  }

  if ((data as BillApiRaw).status === false) {
    throw new Error(
      data.message || `Failed to close the bill (${res.status}).`,
    );
  }
  return data as CloseBillResponse;
}

export async function closeTable(
  token: string,
  bookingId: number,
  payload?: CloseBillPayload,
): Promise<CloseBillResponse> {
  try {
    return await closeTableBill(token, bookingId, payload);
  } catch (e) {
    if (isAlreadyBilled(e)) {
      console.log(`[bill] booking ${bookingId} was already billed`);
      return {};
    }
    throw e;
  }
}

function isAlreadyBilled(e: unknown): boolean {
  return e instanceof Error && /already billed/i.test(e.message);
}
