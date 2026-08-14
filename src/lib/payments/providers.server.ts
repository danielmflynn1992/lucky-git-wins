/**
 * Provider-agnostic payment adapter.
 *
 * Today: Stripe TEST MODE (when STRIPE_SECRET_KEY is present) or a simulated
 * provider for rehearsals. Tomorrow: Cashflows — add an adapter that satisfies
 * `PaymentProvider` and register it in `getPaymentProvider()`. Nothing outside
 * this file knows which provider is live.
 */
import { createHmac, timingSafeEqual } from "crypto";

export interface CheckoutInput {
  orderId: string;
  amountPence: number;
  currency: string;
  description: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}

export interface WebhookEvent {
  eventId: string;
  type: "payment_succeeded" | "payment_failed" | "ignored";
  orderId: string | null;
  providerRef: string | null;
}

export interface PaymentProvider {
  id: string;
  /** True when real card details are collected by the provider. */
  external: boolean;
  createCheckout(input: CheckoutInput): Promise<{ redirectUrl: string | null; providerRef: string | null }>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookEvent>;
}

/* ------------------------------- Stripe (test) ---------------------------- */

function stripeKey(): string | null {
  const k = process.env["STRIPE_SECRET_KEY"];
  return k && k.trim() ? k.trim() : null;
}

const stripeProvider: PaymentProvider = {
  id: "stripe_test",
  external: true,
  async createCheckout(input) {
    const key = stripeKey();
    if (!key) throw new Error("Stripe is not configured");
    if (!key.startsWith("sk_test_")) {
      // Hard stop: this build is rehearsal-only by design.
      throw new Error("Refusing to use a live Stripe key — test mode only.");
    }
    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", input.successUrl);
    body.set("cancel_url", input.cancelUrl);
    body.set("client_reference_id", input.orderId);
    body.set("metadata[order_id]", input.orderId);
    body.set("payment_intent_data[metadata][order_id]", input.orderId);
    if (input.email) body.set("customer_email", input.email);
    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", input.currency.toLowerCase());
    body.set("line_items[0][price_data][unit_amount]", String(input.amountPence));
    body.set("line_items[0][price_data][product_data][name]", input.description.slice(0, 120));

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Stripe ${res.status}: ${text.slice(0, 300)}`);
    const json = JSON.parse(text) as { id: string; url: string };
    return { redirectUrl: json.url, providerRef: json.id };
  },
  async verifyWebhook(rawBody, headers) {
    const secret = process.env["STRIPE_WEBHOOK_SECRET"];
    const sigHeader = headers.get("stripe-signature") ?? "";
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");

    const parts = Object.fromEntries(
      sigHeader.split(",").map((p) => {
        const i = p.indexOf("=");
        return [p.slice(0, i), p.slice(i + 1)];
      }),
    ) as Record<string, string>;
    const t = parts["t"];
    const v1 = parts["v1"];
    if (!t || !v1) throw new Error("Malformed Stripe signature header");

    const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid Stripe signature");

    const event = JSON.parse(rawBody) as {
      id: string;
      type: string;
      data: { object: Record<string, unknown> };
    };
    const obj = event.data.object as {
      id?: string;
      client_reference_id?: string;
      metadata?: Record<string, string>;
    };
    const orderId = obj.metadata?.["order_id"] ?? obj.client_reference_id ?? null;
    const type: WebhookEvent["type"] =
      event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded"
        ? "payment_succeeded"
        : event.type === "payment_intent.payment_failed" ||
            event.type === "checkout.session.expired" ||
            event.type === "checkout.session.async_payment_failed"
          ? "payment_failed"
          : "ignored";
    return { eventId: event.id, type, orderId, providerRef: obj.id ?? null };
  },
};

/* ------------------------------ Simulated --------------------------------- */

/**
 * No card, no network. Used only while no payment provider is configured so the
 * full order -> paid -> draw lifecycle can be rehearsed. It still travels the
 * real webhook + idempotency path.
 */
const simulatedProvider: PaymentProvider = {
  id: "simulated",
  external: false,
  async createCheckout(input) {
    return { redirectUrl: null, providerRef: `sim_${input.orderId}` };
  },
  async verifyWebhook(rawBody) {
    const body = JSON.parse(rawBody) as { event_id?: string; order_id?: string; outcome?: string };
    if (!body.order_id) throw new Error("order_id is required");
    return {
      eventId: body.event_id ?? `sim_${body.order_id}`,
      type: body.outcome === "failed" ? "payment_failed" : "payment_succeeded",
      orderId: body.order_id,
      providerRef: `sim_${body.order_id}`,
    };
  },
};

export function getPaymentProvider(): PaymentProvider {
  return stripeKey() ? stripeProvider : simulatedProvider;
}
