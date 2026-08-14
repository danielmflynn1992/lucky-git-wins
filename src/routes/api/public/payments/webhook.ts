import { createFileRoute } from "@tanstack/react-router";

/**
 * Payment provider webhook. The provider adapter verifies the signature; this
 * route never trusts the body until it has. Same event twice is a no-op.
 */
export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        try {
          const { getPaymentProvider } = await import("@/lib/payments/providers.server");
          const { applyPaymentEvent } = await import("@/lib/payments/process.server");
          const provider = getPaymentProvider();
          const event = await provider.verifyWebhook(raw, request.headers);
          const out = await applyPaymentEvent(provider.id, event);
          return Response.json({ ok: true, ...out });
        } catch (e) {
          const message = e instanceof Error ? e.message : "webhook failed";
          console.error("[payments/webhook]", message);
          const unauthorized = /signature|not configured|Malformed/i.test(message);
          return Response.json({ ok: false, error: message }, { status: unauthorized ? 401 : 400 });
        }
      },
    },
  },
});
