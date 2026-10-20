import { authFetch } from "./auth";

export interface WaiterOrderItemInput {
  id: number;
  waiter_order_id: number;
  qty: number;
}

export interface WaiterOrderItemsPayload {
  items: WaiterOrderItemInput[];
}

interface WaiterOrderItemsApiRaw {
  status?: boolean | string;
  message?: string;
  data?: unknown;
}

export interface WaiterOrderItemsResponse {
  [key: string]: unknown;
}

export async function fetchWaiterOrderItems(
  token: string,
  bookingId: number,
): Promise<WaiterOrderItemsResponse> {
  const res = await authFetch(
    `/room-booking/${bookingId}/waiter-order-items`,
    token,
    {
      method: "GET",
    },
  );

  let data: (WaiterOrderItemsResponse & WaiterOrderItemsApiRaw) | null = null;
  try {
    data = (await res.json()) as WaiterOrderItemsResponse &
      WaiterOrderItemsApiRaw;
  } catch {
    throw new Error(
      `Failed to load waiter order items (server returned ${res.status}).`,
    );
  }

  const failed = (data as WaiterOrderItemsApiRaw | null)?.status === false;
  if (!res.ok || failed) {
    throw new Error(
      data?.message || `Failed to load waiter order items (${res.status}).`,
    );
  }
  return data as WaiterOrderItemsResponse;
}

export async function storeWaiterOrderItems(
  token: string,
  bookingId: number,
  payload: WaiterOrderItemsPayload,
): Promise<WaiterOrderItemsResponse> {
  const res = await authFetch(
    `/room-booking/${bookingId}/waiter-order-items`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  let data: (WaiterOrderItemsResponse & WaiterOrderItemsApiRaw) | null = null;
  try {
    data = (await res.json()) as WaiterOrderItemsResponse &
      WaiterOrderItemsApiRaw;
  } catch {
    throw new Error(
      `Failed to store waiter order items (server returned ${res.status}).`,
    );
  }

  const failed = (data as WaiterOrderItemsApiRaw | null)?.status === false;
  if (!res.ok || failed) {
    throw new Error(
      data?.message || `Failed to store waiter order items (${res.status}).`,
    );
  }
  return data as WaiterOrderItemsResponse;
}
