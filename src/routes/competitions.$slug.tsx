import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Ticket, Shuffle, Shield, PoundSterling, CheckCircle2, Info } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Countdown } from "@/components/Countdown";
import { CompCard } from "@/components/CompCard";
import { Button } from "@/components/ui/button";
import { getComp, COMPETITIONS } from "@/lib/mock-comps";
import { gbp, shortNumber } from "@/lib/format";

export const Route = createFileRoute("/competitions/$slug")({
  loader: ({ params }) => {
    const comp = getComp(params.slug);
    if (!comp) throw notFound();
    return { comp };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Competition not found" }, { name: "robots", content: "noindex" }] };
    const c = loaderData.comp;
    return {
      meta: [
        { title: `${c.title} — Lucky Git Comps` },
        { name: "description", content: `${c.subtitle} Tickets from ${gbp(c.pricePerTicket)}. Free postal entry available.` },
        { property: "og:title", content: `${c.title} — Lucky Git Comps` },
        { property: "og:description", content: c.subtitle },
      ],
    };
  },
  component: CompDetail,
});

function CompDetail() {
  const { comp: c } = Route.useLoaderData();
  const [qty, setQty] = useState(5);
  const [picker, setPicker] = useState<"lucky" | "manual">("lucky");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [skillOpen, setSkillOpen] = useState(false);
  const [answered, setAnswered] = useState<number | null>(null);

  const pct = Math.round((c.ticketsSold / c.totalTickets) * 100);
  const odds = Math.round(c.totalTickets / Math.max(1, c.ticketsSold || 1));
  const total = c.pricePerTicket * qty;

  // fake "taken" numbers
  const takenNumbers = useMemo(() => {
    const s = new Set<number>();
    let seed = c.slug.length * 7;
    for (let i = 0; i < c.ticketsSold; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      s.add((seed % c.totalTickets) + 1);
    }
    return s;
  }, [c]);

  const related = COMPETITIONS.filter((x) => x.slug !== c.slug).slice(0, 3);

  const canProceed = answered === c.skillQuestion.correct;
  const displayNumbers = picker === "manual" ? picked.size : qty;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10 w-full">
        <div className="text-xs font-semibold text-muted-foreground mb-4">
          <Link to="/" className="hover:text-clover">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{c.category}</span>
          <span className="mx-2">/</span>
          <span className="text-ink">{c.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Gallery */}
          <div className="lg:col-span-3">
            <div className="relative rounded-3xl overflow-hidden bg-white border-2 border-ink/5 shadow-[var(--shadow-card)]">
              <img src={c.image} alt={c.title} width={1280} height={960} className="w-full aspect-[4/3] object-cover" />
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {c.hot && <span className="sticker-tilt-l bg-hot text-hot-foreground px-3 py-1.5 rounded-lg font-black uppercase text-sm shadow-[var(--shadow-sticker)]">🔥 Hot</span>}
                {c.instantWin && <span className="sticker-tilt-r bg-gold text-gold-foreground px-3 py-1.5 rounded-lg font-black uppercase text-sm shadow-[var(--shadow-sticker)]">⚡ Instant Wins Inside</span>}
              </div>
            </div>
          </div>

          {/* Buy panel */}
          <div className="lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-widest text-clover">{c.category}</div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl font-black">{c.title}</h1>
            <p className="mt-2 text-muted-foreground">{c.subtitle}</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="rounded-xl bg-cream border-2 border-ink px-4 py-2">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Ticket</div>
                <div className="font-display font-black text-2xl leading-none">{gbp(c.pricePerTicket)}</div>
              </div>
              <Countdown target={c.endsAt} />
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-sm font-semibold mb-1.5">
                <span>{shortNumber(c.ticketsSold)} of {shortNumber(c.totalTickets)} tickets sold</span>
                <span className="text-clover">{pct}%</span>
              </div>
              <div className="h-3 rounded-full bg-secondary overflow-hidden">
                <div className="h-full shimmer rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Current odds: <b className="text-ink">1 in {odds.toLocaleString()}</b></div>
            </div>

            {/* Picker */}
            <div className="mt-6 rounded-2xl bg-white border-2 border-ink/5 p-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setPicker("lucky")}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold border-2 flex items-center justify-center gap-1.5 ${picker === "lucky" ? "bg-clover text-cream border-clover" : "bg-cream border-ink/10"}`}
                >
                  <Shuffle className="h-4 w-4" /> Lucky Dip
                </button>
                <button
                  onClick={() => setPicker("manual")}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold border-2 flex items-center justify-center gap-1.5 ${picker === "manual" ? "bg-clover text-cream border-clover" : "bg-cream border-ink/10"}`}
                >
                  <Ticket className="h-4 w-4" /> Pick numbers
                </button>
              </div>

              {picker === "lucky" ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink/60">How many tickets?</label>
                  <div className="mt-2 flex items-center gap-3">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-11 w-11 rounded-xl border-2 border-ink/10 bg-cream font-bold text-lg">−</button>
                    <input
                      type="number"
                      value={qty}
                      min={1}
                      max={c.maxPerPerson}
                      onChange={(e) => setQty(Math.max(1, Math.min(c.maxPerPerson, +e.target.value || 1)))}
                      className="flex-1 h-11 rounded-xl border-2 border-ink/10 bg-cream text-center font-display font-black text-xl"
                    />
                    <button onClick={() => setQty(Math.min(c.maxPerPerson, qty + 1))} className="h-11 w-11 rounded-xl border-2 border-ink/10 bg-cream font-bold text-lg">+</button>
                  </div>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {[1, 5, 10, 25, 50].map((n) => (
                      <button key={n} onClick={() => setQty(n)} className="rounded-lg px-2.5 py-1 text-xs font-bold bg-cream border border-ink/10 hover:border-clover">
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-2">Tap to pick your numbers</div>
                  <div className="max-h-56 overflow-y-auto rounded-xl border-2 border-ink/10 p-2 bg-cream grid grid-cols-8 gap-1">
                    {Array.from({ length: Math.min(120, c.totalTickets) }, (_, i) => i + 1).map((n) => {
                      const taken = takenNumbers.has(n);
                      const isPicked = picked.has(n);
                      return (
                        <button
                          key={n}
                          disabled={taken}
                          onClick={() => {
                            const next = new Set(picked);
                            next.has(n) ? next.delete(n) : next.add(n);
                            setPicked(next);
                          }}
                          className={`text-[10px] font-bold aspect-square rounded ${
                            taken ? "bg-ink/10 text-ink/30 line-through cursor-not-allowed" :
                            isPicked ? "bg-gold text-gold-foreground ring-2 ring-ink" :
                            "bg-white hover:bg-clover/10"
                          }`}
                        >{n}</button>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Showing first 120 numbers. {picked.size} selected.</div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-ink/10 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest font-bold text-ink/60">Total</div>
                  <div className="font-display font-black text-3xl leading-none">{gbp(c.pricePerTicket * displayNumbers)}</div>
                  <div className="text-xs text-muted-foreground">{displayNumbers} ticket{displayNumbers === 1 ? "" : "s"}</div>
                </div>
                <Button variant="gold" size="xl" onClick={() => setSkillOpen(true)} disabled={displayNumbers === 0}>
                  Enter now
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-clover" /> Live streamed draw</div>
              <div className="flex items-center gap-2"><PoundSterling className="h-4 w-4 text-clover" /> Cash alt: {gbp(c.cashAlternative)}</div>
              <div className="flex items-center gap-2"><Ticket className="h-4 w-4 text-clover" /> Max {c.maxPerPerson} per person</div>
              <div className="flex items-center gap-2"><Info className="h-4 w-4 text-clover" /> <Link to="/free-postal-entry" className="underline font-semibold">Free entry route</Link></div>
            </div>
          </div>
        </div>

        {/* Description + T&Cs */}
        <section className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl font-black">About this prize</h2>
            <p className="mt-3 text-ink/80 leading-relaxed">{c.description}</p>

            <h3 className="mt-8 font-display text-xl font-black">The important bits</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink/80">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> Closing date: <b>{new Date(c.endsAt).toLocaleString("en-GB")}</b> — or when sold out, whichever comes first.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> Cash alternative: <b>{gbp(c.cashAlternative)}</b> — take the cash instead, no questions asked.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> Winner announced live on our stream within 24h of close.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> UK entrants only, 18+. Full <Link to="/terms" className="underline">T&Cs apply</Link>.</li>
            </ul>
          </div>
          <aside className="rounded-2xl bg-gold/10 border-2 border-gold/40 p-5">
            <h3 className="font-display text-lg font-black">Free postal entry</h3>
            <p className="mt-2 text-sm text-ink/80">
              You can enter every competition for free by post. Same odds, same draw, no purchase required.
            </p>
            <Link to="/free-postal-entry" className="mt-3 inline-block font-bold text-clover underline">How to enter by post →</Link>
          </aside>
        </section>

        {/* Related */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-black">More on the go</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <CompCard key={r.slug} c={r} />)}
          </div>
        </section>
      </main>

      {/* Skill question modal */}
      {skillOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setSkillOpen(false)}>
          <div className="bg-cream rounded-3xl border-2 border-ink w-full max-w-md p-6 shadow-2xl rise-in" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs font-bold uppercase tracking-widest text-clover">Skill question</div>
            <h3 className="mt-1 font-display text-2xl font-black">{c.skillQuestion.q}</h3>
            <p className="text-xs text-muted-foreground mt-1">(UK law requires this. Sorry not sorry.)</p>
            <div className="mt-4 space-y-2">
              {c.skillQuestion.options.map((opt: string, i: number) => (
                <button
                  key={opt}
                  onClick={() => setAnswered(i)}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3 font-semibold transition-colors ${
                    answered === i
                      ? (i === c.skillQuestion.correct ? "border-clover bg-clover/10" : "border-hot bg-hot/10")
                      : "border-ink/10 bg-white hover:border-clover/40"
                  }`}
                >
                  {String.fromCharCode(65 + i)}. {opt}
                </button>
              ))}
            </div>
            {answered !== null && (
              <div className={`mt-3 text-sm font-bold ${canProceed ? "text-clover" : "text-hot"}`}>
                {canProceed ? "Nice one. Onwards." : "Not quite — have another go."}
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <Button variant="cream" onClick={() => setSkillOpen(false)} className="flex-1">Cancel</Button>
              <Button asChild variant="gold" size="lg" disabled={!canProceed} className="flex-1">
                <Link to="/checkout" search={{ slug: c.slug, qty: displayNumbers }}>To checkout</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}