import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { GaryMascot } from "@/components/GaryMascot";
import { getComp, COMPETITIONS } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";
import { CreditCard, Lock, ShieldCheck, Share2 } from "lucide-react";

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
  const { slug, qty = 5 } = Route.useSearch();
  const comp = slug ? getComp(slug) : COMPETITIONS[0];
  const [done, setDone] = useState(false);

  if (!comp) return null;
  const subtotal = comp.pricePerTicket * qty;

  if (done) return <SuccessScreen compTitle={comp.title} qty={qty} />;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12 w-full grid gap-8 md:grid-cols-5">
        <form
          className="md:col-span-3 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <div>
            <h1 className="font-display text-3xl font-black">Right then, checkout.</h1>
            <p className="text-muted-foreground mt-1">You're seconds away from being in the draw.</p>
          </div>

          <fieldset className="rounded-2xl bg-white border-2 border-ink/5 p-5 space-y-4">
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

          <fieldset className="rounded-2xl bg-white border-2 border-ink/5 p-5 space-y-4">
            <legend className="px-2 font-display text-lg font-bold flex items-center gap-2">
              <Lock className="h-4 w-4" /> Payment
            </legend>
            <div className="rounded-xl bg-cream border-2 border-ink/10 p-4 text-sm text-muted-foreground">
              <CreditCard className="inline h-4 w-4 mr-1.5" />
              Stripe payment form goes here (wired in Phase 2 — no real card charged today).
            </div>
          </fieldset>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required className="mt-1 h-4 w-4 accent-clover" />
            <span>I've read the <Link to="/terms" className="underline">T&Cs</Link>, I'm 18+, and I know I can enter free by post if I want.</span>
          </label>

          <Button type="submit" variant="gold" size="xl" className="w-full">
            Pay {gbp(subtotal)} — I'm feeling lucky
          </Button>
          <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout. Skill question passed.
          </div>
        </form>

        <aside className="md:col-span-2">
          <div className="rounded-2xl bg-white border-2 border-ink/5 p-5 sticky top-24">
            <h2 className="font-display text-lg font-bold">Your order</h2>
            <div className="mt-4 flex gap-3">
              <img src={comp.image} alt="" width={72} height={72} className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-clover/70">{comp.category}</div>
                <div className="font-display text-sm truncate">{comp.title}</div>
                <div className="text-xs text-muted-foreground">{qty} × {gbp(comp.pricePerTicket)}</div>
              </div>
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold">{gbp(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Fees</dt><dd className="font-semibold">{gbp(0)}</dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-2 mt-2">
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

function Input({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-bold uppercase tracking-widest text-ink/60">{label}</span>
      <input
        {...props}
        className="mt-1 w-full h-11 rounded-xl border-2 border-ink/10 bg-cream px-3 font-semibold focus:outline-none focus:border-clover"
      />
    </label>
  );
}

function SuccessScreen({ compTitle, qty }: { compTitle: string; qty: number }) {
  const numbers = Array.from({ length: qty }, () => Math.floor(Math.random() * 15000) + 1);
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-16 w-full text-center relative overflow-hidden">
        <Confetti />
        <GaryMascot className="mx-auto w-40 h-40" />
        <h1 className="mt-6 font-display text-4xl md:text-5xl font-black">You're in the draw,<br/><span className="text-clover">you lucky git.</span></h1>
        <p className="mt-3 text-muted-foreground text-lg">Payment confirmed. Skill question passed. Numbers assigned.</p>
        <div className="mt-8 rounded-2xl bg-white border-2 border-ink/5 p-6 text-left shadow-[var(--shadow-card)]">
          <div className="text-xs font-bold uppercase tracking-widest text-clover">Your entry</div>
          <div className="font-display text-xl font-black mt-1">{compTitle}</div>
          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2">Your ticket numbers</div>
            <div className="flex flex-wrap gap-1.5">
              {numbers.map((n, i) => (
                <span key={i} className="rounded-lg bg-gold/20 border-2 border-gold px-2.5 py-1 font-bold text-sm tabular-nums">
                  #{n.toString().padStart(5, "0")}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button variant="gold" size="lg"><Share2 className="h-4 w-4" /> Tell the group chat</Button>
          <Button asChild variant="cream" size="lg"><Link to="/">Back to comps</Link></Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Confetti() {
  const bits = Array.from({ length: 40 });
  const colors = ["#F5B700", "#0F5132", "#FF3D81", "#1A1A1A"];
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {bits.map((_, i) => (
        <span
          key={i}
          className="absolute h-2 w-2 rounded-sm"
          style={{
            left: `${(i * 7) % 100}%`,
            top: `-10px`,
            background: colors[i % colors.length],
            animation: `confettiFall ${1.5 + (i % 5) * 0.3}s ease-in ${i * 0.05}s forwards`,
          }}
        />
      ))}
    </div>
  );
}