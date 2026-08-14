import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { allCompetitionsQueryOptions } from "@/lib/competitions-api";
import { gbp } from "@/lib/format";
import { CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { SkillWarning } from "@/components/SkillWarning";
import { EmptyBasketScene } from "@/components/EmptyBasketScene";
import { SkillQuestionStep } from "@/components/SkillQuestionStep";
import { EntryStampSequence } from "@/components/EntryStampSequence";
import { formatDrawTime } from "@/lib/site-stats";
import { checkPurchaseAllowed, limitBlockMessage } from "@/lib/account-api";
import { createPendingOrder, fetchOrderStatus, waitForPaidOrder, withTimeout, type OrderStatus } from "@/lib/checkout-api";
import { confirmSimulatedPayment, getPaymentMode, startPayment } from "@/lib/checkout.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { capture } from "@/lib/client-error-monitor";

/** Hard ceiling on any single payment-setup step. */
const STEP_TIMEOUT_MS = 15_000;

function newRef() {
  return "TILL-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

interface Reservation {
  token: string;
  slug: string;
  numbers: number[];
  expires: number;
}

const searchSchema = z.object({
  slug: z.string().optional(),
  qty: z.coerce.number().int().positive().max(1000).optional(),
  order: z.string().uuid().optional(),
  paid: z.coerce.number().optional(),
  cancelled: z.coerce.number().optional(),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Checkout — Lucky Git Comps" },
      { name: "description", content: "Secure ticket checkout for Lucky Git Comps." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  return <CheckoutInner />;
}

/** Never a blank page: Terry on his break, and a way back to the stall. */
function EmptyBasket() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-xl px-4 py-16 w-full flex-1">
        <EmptyBasketScene />
      </main>
      <SiteFooter />
    </div>
  );
}

function CheckoutInner() {
  const { slug, qty = 5, order: returnedOrderId } = Route.useSearch();
  const { data: comps = [] } = useQuery(allCompetitionsQueryOptions);
  const comp = (slug ? comps.find((c) => c.slug === slug) : comps[0]) ?? null;
  const { user } = useAuth();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [answer, setAnswer] = useState<{ isCorrect: boolean; orderRef: string } | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [limitBlock, setLimitBlock] = useState<string | null>(null);
  const [payState, setPayState] = useState<"idle" | "creating" | "paying" | "waiting">("idle");
  const [payError, setPayError] = useState<string | null>(null);
  const [errorRef, setErrorRef] = useState<string | null>(null);
  const [paidOrder, setPaidOrder] = useState<OrderStatus | null>(null);

  // Buyer details.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [town, setTown] = useState("");

  const { data: mode } = useQuery({
    queryKey: ["payment-mode"],
    queryFn: () => getPaymentMode(),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lgc:reservation");
      if (!raw) return;
      const r = JSON.parse(raw) as Reservation;
      if (r.expires < Date.now()) {
        sessionStorage.removeItem("lgc:reservation");
        window.dispatchEvent(new Event("lgc:basket-change"));
        return;
      }
      if (slug && r.slug !== slug) return;
      setReservation(r);
    } catch {
      // ignore malformed reservation
    }
  }, [slug]);

  // Signed-in buyers: prefill from profile; a display name is required.
  useEffect(() => {
    if (!user) return;
    setEmail((e) => e || user.email || "");
    supabase
      .from("profiles")
      .select("display_name, town")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName((d) => d || data.display_name || "");
        if (data?.town) setTown((t) => t || data.town || "");
      });
  }, [user]);

  const clearBasket = useCallback(() => {
    sessionStorage.removeItem("lgc:reservation");
    window.dispatchEvent(new Event("lgc:basket-change"));
  }, []);

  // Returned from a hosted payment page — never show ENTERED until the order
  // itself says paid.
  const settled = useRef(false);

  /** One place that turns any checkout failure into a visible, logged state. */
  const failCheckout = useCallback(
    (stage: string, err: unknown, ctx: Record<string, unknown>) => {
      const ref = newRef();
      const message = err instanceof Error ? err.message : String(err);
      setErrorRef(ref);
      setPayError(
        "Something's jammed at the till. Nothing's been taken — try again, or contact support quoting this reference.",
      );
      capture("checkout_failure", `[${stage}] ${message}`, {
        severity: "error",
        stack: err instanceof Error ? err.stack : undefined,
        extra: { ref, stage, ...ctx },
      });
      setPayState("idle");
    },
    [],
  );

  useEffect(() => {
    if (!returnedOrderId || settled.current) return;
    settled.current = true;
    setPayState("waiting");
    fetchOrderStatus(returnedOrderId)
      .then((s) => (s.status === "pending_payment" ? waitForPaidOrder(returnedOrderId) : s))
      .then((s) => {
        if (s.status === "paid") {
          setPaidOrder(s);
          clearBasket();
        } else {
          setPayError(s.failure_reason || "That payment didn't complete. Nothing has been charged.");
          setErrorRef(null);
        }
      })
      .catch((e) => failCheckout("confirm_return", e, { orderId: returnedOrderId }))
      .finally(() => setPayState("idle"));
  }, [returnedOrderId, clearBasket, failCheckout]);

  if (paidOrder && comp) {
    return (
      <SuccessScreen
        compTitle={comp.title}
        numbers={paidOrder.numbers}
        entryRef={"LG-" + paidOrder.order_ref.slice(0, 8).toUpperCase()}
        drawLine={`Drawn ${formatDrawTime(comp.endsAt)}.`}
      />
    );
  }

  if (!comp) return <EmptyBasket />;

  if (!reservation) {
    if (payState === "waiting") return <ConfirmingScreen />;
    return <EmptyBasket />;
  }

  const effectiveQty = reservation.numbers.length ?? qty;
  const subtotal = comp.pricePerTicket * effectiveQty;
  const busy = payState !== "idle";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    setErrorRef(null);

    if (user && !displayName.trim()) {
      setPayError("Add the name you'd like shown if you win (e.g. Dave R.).");
      return;
    }

    setPayState("creating");
    const payload = {
      slug: reservation.slug,
      reservationToken: reservation.token,
      quantity: effectiveQty,
      amountPence: Math.round(subtotal * 100),
      signedIn: !!user,
      hasDisplayName: !!displayName.trim(),
    };
    try {
      try {
        const verdict = await withTimeout(
          checkPurchaseAllowed(Math.round(subtotal * 100)),
          STEP_TIMEOUT_MS,
          "Spend-limit check",
        );
        const msg = limitBlockMessage(verdict);
        if (msg) {
          setLimitBlock(msg);
          setPayState("idle");
          return;
        }
        setLimitBlock(null);
      } catch {
        setLimitBlock(null);
      }

      const pending = await withTimeout(
        createPendingOrder({
          reservationToken: reservation.token,
          name,
          email,
          phone,
          displayName: displayName.trim() || undefined,
          town: town.trim() || undefined,
        }),
        STEP_TIMEOUT_MS,
        "Creating your order",
      );

      setPayState("paying");
      const started = await withTimeout(
        startPayment({ data: { orderId: pending.order_id, origin: window.location.origin } }),
        STEP_TIMEOUT_MS,
        "Setting up payment",
      );

      if (started.redirectUrl) {
        window.location.href = started.redirectUrl;
        return;
      }

      // No external provider configured (rehearsal mode): settle, then wait for
      // the order itself to flip to paid before anything says ENTERED.
      if (!started.alreadyPaid) {
        await withTimeout(
          confirmSimulatedPayment({ data: { orderId: pending.order_id } }),
          STEP_TIMEOUT_MS,
          "Settling payment",
        );
      }
      setPayState("waiting");
      const status = await waitForPaidOrder(pending.order_id, 30_000);
      if (status.status !== "paid") {
        setPayError(status.failure_reason || "Payment didn't complete. Your tickets have been released.");
        setPayState("idle");
        return;
      }
      setPaidOrder(status);
      clearBasket();
    } catch (err) {
      failCheckout("submit", err, payload);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12 w-full grid gap-8 md:grid-cols-5">
        <form className="md:col-span-3 space-y-6" onSubmit={submit}>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Right then, checkout.</h1>
            <p className="text-muted-foreground mt-1">
              Answer the skill question, then card details. That's the lot.
            </p>
          </div>

          <SkillWarning />

          <SkillQuestionStep
            slug={reservation.slug}
            reservationToken={reservation.token}
            onResult={setAnswer}
          />

          <fieldset className="rounded-2xl bg-card border-2 border-border p-5 space-y-4">
            <legend className="px-2 font-display text-lg font-bold">Your details</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Full name"
                required
                placeholder="Gary McClover"
                className="sm:col-span-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                required
                className="sm:col-span-2"
                placeholder="you@somewhere.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Mobile"
                type="tel"
                required
                className="sm:col-span-2"
                placeholder="07…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Winner display name"
                required={!!user}
                placeholder="Dave R."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Input
                label="Town (optional)"
                placeholder="Romford"
                value={town}
                onChange={(e) => setTown(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              If you win, we publish the display name and town only — never your email address.
              Leave it blank and you'll appear as "Ticket #N holder".
            </p>
          </fieldset>

          <fieldset className="rounded-2xl bg-card border-2 border-border p-5 space-y-4">
            <legend className="px-2 font-display text-lg font-bold flex items-center gap-2">
              <Lock className="h-4 w-4" /> Payment
            </legend>
            <div className="rounded-xl bg-background border-2 border-border p-4 text-sm text-muted-foreground">
              <CreditCard className="inline h-4 w-4 mr-1.5" />
              {mode?.external
                ? "You'll be taken to our secure card page to pay (test mode — use a test card)."
                : "No payment provider is connected yet, so this checkout settles in rehearsal mode. No card is charged."}
            </div>
          </fieldset>

          <label className="flex items-start gap-2 text-sm border-2 border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] p-3">
            <input
              type="checkbox"
              required
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-clover"
            />
            <span className="font-semibold">I confirm I am 18 or over and a UK resident.</span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              required
              checked={termsConfirmed}
              onChange={(e) => setTermsConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-clover"
            />
            <span>
              I've read the <Link to="/terms" className="underline">T&amp;Cs</Link>, I confirm I'm 18+ and
              I understand that tickets from an incorrect answer are not entered in the draw.
            </span>
          </label>

          {limitBlock && (
            <div
              role="alert"
              className="rounded-md border-2 border-[color:var(--color-ink-red)] bg-[var(--color-paper-raised)] p-4 text-sm font-semibold"
            >
              {limitBlock} <Link to="/account" className="underline">Manage your limits</Link>
            </div>
          )}

          {payError && (
            <div
              role="alert"
              className="rounded-md border-2 border-[color:var(--color-ink-red)] bg-[var(--color-paper-raised)] p-4 text-sm font-semibold"
            >
              {payError}
              {errorRef && (
                <div className="mt-2 font-mono text-xs font-normal">
                  Reference: {errorRef} · <Link to="/contact" className="underline">Contact support</Link>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="gold"
            size="xl"
            className="w-full"
            disabled={!answer || !ageConfirmed || !termsConfirmed || busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {payState === "waiting" ? "Confirming your payment…" : "Setting up payment…"}
              </>
            ) : !answer ? (
              "Answer the skill question to continue"
            ) : !ageConfirmed ? (
              "Confirm you're 18+ to continue"
            ) : !termsConfirmed ? (
              "Tick the T&Cs box to continue"
            ) : (
              `Sort me out — ${gbp(subtotal)}`
            )}
          </Button>
          {answer && (
            <div className="rounded-md border-2 border-border bg-card p-3 text-xs text-muted-foreground">
              Your answer is recorded and sealed until the draw. If it's wrong, those tickets are
              non-qualifying — payment still completes either way.
            </div>
          )}
          <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout.
          </div>
        </form>

        <aside className="md:col-span-2">
          <div className="rounded-2xl bg-card border-2 border-border p-5 sticky top-24">
            <h2 className="font-display text-lg font-bold">Your order</h2>
            <div className="mt-4 flex gap-3">
              <img src={comp.image} alt="" width={72} height={72} className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-clover/70">{comp.category}</div>
                <div className="font-display text-sm truncate">{comp.title}</div>
                <div className="text-xs text-muted-foreground">{effectiveQty} × {gbp(comp.pricePerTicket)}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-2">Reserved ticket numbers</div>
              <div className="flex flex-wrap gap-1">
                {reservation.numbers.slice(0, 40).map((n) => (
                  <span key={n} className="rounded bg-ink text-cream px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
                    {n.toString().padStart(4, "0")}
                  </span>
                ))}
                {reservation.numbers.length > 40 && (
                  <span className="text-[10px] text-muted-foreground font-mono">+{reservation.numbers.length - 40} more</span>
                )}
              </div>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold">{gbp(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Fees</dt><dd className="font-semibold">{gbp(0)}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <dt className="font-display font-bold">Total</dt>
                <dd className="font-display font-black text-2xl leading-none">{gbp(subtotal)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}

function ConfirmingScreen() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-xl px-4 py-24 w-full flex-1 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <h1 className="mt-4 font-display text-2xl font-bold">Confirming your payment…</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Hold on. We only stamp your entry once the payment has actually cleared.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Input({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        {...props}
        className="mt-1 w-full h-11 rounded-xl border-2 border-border bg-background px-3 font-semibold focus:outline-none focus:border-clover"
      />
    </label>
  );
}

function SuccessScreen({
  compTitle,
  numbers,
  entryRef,
  drawLine,
}: {
  compTitle: string;
  numbers: number[];
  entryRef: string;
  drawLine: string;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-10 md:py-16 w-full">
        <EntryStampSequence
          compTitle={compTitle}
          numbers={numbers}
          entryRef={entryRef}
          drawLine={drawLine}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
