/** Applies a verified payment event to the database. Idempotent by event id. */
import type { WebhookEvent } from "./providers.server";

export async function applyPaymentEvent(provider: string, ev: WebhookEvent) {
  if (ev.type === "ignored" || !ev.orderId) return { handled: false as const };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (ev.type === "payment_succeeded") {
    const { data, error } = await supabaseAdmin.rpc("mark_order_paid", {
      p_order_id: ev.orderId,
      p_provider: provider,
      p_event_id: ev.eventId,
      p_provider_ref: ev.providerRef,
    });
    if (error) throw new Error(error.message);
    return { handled: true as const, result: data };
  }

  const { data, error } = await supabaseAdmin.rpc("fail_order", {
    p_order_id: ev.orderId,
    p_reason: "payment failed or expired at the provider",
  });
  if (error) throw new Error(error.message);
  return { handled: true as const, result: data };
}
