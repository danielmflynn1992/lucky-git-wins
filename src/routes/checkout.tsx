import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import terryImg from "@/assets/terry-panel.png.asset.json";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { allCompetitionsQueryOptions } from "@/lib/competitions-api";
import { gbp, moneySlang } from "@/lib/format";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { SkillWarning } from "@/components/SkillWarning";
import { SkillQuestionStep } from "@/components/SkillQuestionStep";
import { EntryStampSequence } from "@/components/EntryStampSequence";
import { formatDrawTime } from "@/lib/site-stats";
import { hashSeed } from "@/lib/terry-verdicts";

interface Reservation {
  token: string;
  slug: string;
  numbers: number[];
  expires: number;
}

const searchSchema = z.object({
  slug: z.string().optional(),
  qty: z.coerce.number().int().positive().max(1000).optional(),
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

/** Never a blank page: Terry, a line, and a way back to the stall. */
function EmptyBasket() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-xl px-4 py-16 w-full flex-1 text-center">
        <img
          src={terryImg.url}
          alt="Terry, empty-handed"
          width={180}
          height={180}
          className="mx-auto h-40 w-auto object-contain"
        />
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
          Nothing in the basket, sunshine.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Terry can't sell you thin air. Pick some numbers and come back.
        </p>
        <Button asChild variant="gold" size="lg" className="mt-6">
          <Link to="/competitions">Go and have a look</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}

function CheckoutInner() {
  const { slug, qty = 5 } = Route.useSearch();
  const { data: comps = [] } = useQuery(allCompetitionsQueryOptions);
  const comp = (slug ? comps.find((c) => c.slug === slug) : comps[0]) ?? null;
  const [done, setDone] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [answer, setAnswer] = useState<{ isCorrect: boolean; orderRef: string } | null>(null);
  // Explicit, separate age/residency confirmation — required before payment.
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);

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

  if (!comp) return <EmptyBasket />;
  const effectiveQty = reservation?.numbers.length ?? qty;
  const subtotal = comp.pricePerTicket * effectiveQty;

  if (done) {
    const nums = reservation?.numbers ?? [];
    const ref = "LG-" + (hashSeed((reservation?.token ?? "") + nums.join(",")) % 900000 + 100000);
    return (
      <SuccessScreen
        compTitle={comp.title}
        numbers={nums}
        entryRef={ref}
        drawLine={`Drawn ${formatDrawTime(comp.endsAt)}.`}
      />
    );
  }

  if (!reservation) {
    return <EmptyBasket />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12 w-full grid gap-8 md:grid-cols-5">
        <form
          className="md:col-span-3 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
            sessionStorage.removeItem("lgc:reservation");
            window.dispatchEvent(new Event("lgc:basket-change"));
          }}
        >
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
              <Input label="First name" required placeholder="Gary" />
              <Input label="Last name" required placeholder="McClover" />
              <Input label="Email" type="email" required className="sm:col-span-2" placeholder="you@somewhere.co.uk" />
              <Input label="Mobile" type="tel" required className="sm:col-span-2" placeholder="07…" />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-clover" />
              <span>Create a free account so I can see my entries next time. (Optional.)</span>
            </label>
          </fieldset>

          <fieldset className="rounded-2xl bg-card border-2 border-border p-5 space-y-4">
            <legend className="px-2 font-display text-lg font-bold flex items-center gap-2">
              <Lock className="h-4 w-4" /> Payment
            </legend>
            <div className="rounded-xl bg-background border-2 border-border p-4 text-sm text-muted-foreground">
              <CreditCard className="inline h-4 w-4 mr-1.5" />
              Stripe payment form goes here (wired in Phase 2 — no real card charged today).
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
            <span className="font-semibold">
              I confirm I am 18 or over and a UK resident.
            </span>
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

          <Button
            type="submit"
            variant="gold"
            size="xl"
            className="w-full"
            disabled={!answer || !ageConfirmed || !termsConfirmed}
          >
            {!answer
              ? "Answer the skill question to continue"
              : !ageConfirmed
                ? "Confirm you're 18+ to continue"
                : !termsConfirmed
                  ? "Tick the T&Cs box to continue"
                  : `Sort me out — ${gbp(subtotal)}`}
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
              {moneySlang(subtotal) && (
                <div className="flex justify-end -mt-1 font-mono text-[10px] text-[var(--color-ink-blue)]">
                  {moneySlang(subtotal)}
                </div>
              )}
            </dl>
          </div>
        </aside>
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