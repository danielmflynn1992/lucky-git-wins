import { supabase } from "@/integrations/supabase/client";

export interface PendingOrder {
  order_id: string;
  order_ref: string;
  amount_pence: number;
  quantity: number;
  status: string;
}

export interface OrderStatus {
  status: "pending_payment" | "paid" | "failed" | "expired";
  order_ref: string;
  paid_at: string | null;
  failure_reason: string | null;
  numbers: number[];
  is_qualifying: boolean;
}

/**
 * Creates (or refreshes) the pending order for this reservation. Guests supply
 * name/email; signed-in buyers must have a display name — the server enforces it.
 */
export async function createPendingOrder(input: {
  reservationToken: string;
  name: string;
  email: string;
  phone?: string;
  displayName?: string;
  town?: string;
}): Promise<PendingOrder> {
  const { data, error } = await supabase.rpc("create_pending_order", {
    p_reservation_token: input.reservationToken,
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone ?? "",
    p_display_name: input.displayName ?? null,
    p_town: input.town ?? "",
  });
  if (error) throw new Error(error.message);
  return data as unknown as PendingOrder;
}

export async function fetchOrderStatus(orderId: string): Promise<OrderStatus> {
  const { data, error } = await supabase.rpc("order_status", { p_order_id: orderId });
  if (error) throw new Error(error.message);
  return data as unknown as OrderStatus;
}

/** Poll until the order leaves pending_payment (or we give up). */
export async function waitForPaidOrder(orderId: string, timeoutMs = 90_000): Promise<OrderStatus> {
  const deadline = Date.now() + timeoutMs;
  let last: OrderStatus | null = null;
  while (Date.now() < deadline) {
    last = await fetchOrderStatus(orderId);
    if (last.status !== "pending_payment") return last;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return last ?? { status: "pending_payment", order_ref: "", paid_at: null, failure_reason: "timed out", numbers: [], is_qualifying: false };
}
