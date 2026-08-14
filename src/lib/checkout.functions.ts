import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Which provider is live, so the UI can render the right payment step. */
export const getPaymentMode = createServerFn({ method: "GET" }).handler(async () => {
  const { getPaymentProvider } = await import("@/lib/payments/providers.server");
  const p = getPaymentProvider();
  return { provider: p.id, external: p.external };
});

/**
 * Starts payment for an existing pending order. The amount is read from the
 * database — never from the browser.
 */
export const startPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ orderId: z.string().uuid(), origin: z.string().url() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getPaymentProvider } = await import("@/lib/payments/providers.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, amount_pence, contact_email, competition_id, competitions(title)")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found");
    if (order.status === "paid") return { provider: "n/a", redirectUrl: null, alreadyPaid: true };
    if (order.status !== "pending_payment") throw new Error(`Order is ${order.status}`);

    const provider = getPaymentProvider();
    const title = (order.competitions as { title?: string } | null)?.title ?? "Competition entry";
    const out = await provider.createCheckout({
      orderId: order.id,
      amountPence: order.amount_pence,
      currency: "gbp",
      description: `Lucky Git Comps — ${title}`,
      email: order.contact_email,
      successUrl: `${data.origin}/checkout?order=${order.id}&paid=1`,
      cancelUrl: `${data.origin}/checkout?order=${order.id}&cancelled=1`,
    });
    return { provider: provider.id, redirectUrl: out.redirectUrl, alreadyPaid: false };
  });

/**
 * Rehearsal-only settlement. Refuses to run whenever a real provider is
 * configured, so it can never become a way to get free tickets.
 */
export const confirmSimulatedPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { getPaymentProvider } = await import("@/lib/payments/providers.server");
    const provider = getPaymentProvider();
    if (provider.external) throw new Error("A payment provider is configured — use the real checkout.");
    const { applyPaymentEvent } = await import("@/lib/payments/process.server");
    const event = await provider.verifyWebhook(JSON.stringify({ order_id: data.orderId }), new Headers());
    await applyPaymentEvent(provider.id, event);
    return { ok: true };
  });
