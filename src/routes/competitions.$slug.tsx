import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Ticket, Shuffle, Shield, PoundSterling, Info, Loader2, AlertTriangle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Countdown } from "@/components/Countdown";
import { CompCard } from "@/components/CompCard";
import { Button } from "@/components/ui/button";
import { SkillQuestionModal } from "@/components/SkillQuestionModal";
import { COMPETITIONS } from "@/lib/mock-comps";
import { gbp, shortNumber } from "@/lib/format";
import {
  competitionQueryOptions,
  newReservationToken,
  reserveLuckyDip,
  reserveNumbers,
  type DbCompetition,
} from "@/lib/competitions-api";

export const Route = createFileRoute("/competitions/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(competitionQueryOptions(params.slug));
    if (!data) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Enter now — Lucky Git Comps" },
      { name: "description", content: "Pick your tickets, answer the skill question, in the draw. Auto-drawn on close." },
      { property: "og:title", content: "Enter now — Lucky Git Comps" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-24 text-center flex-1">
        <h1 className="font-display text-4xl font-black">That comp's gone.</h1>
        <p className="mt-2 text-muted-foreground">Try one that's live.</p>
        <Button asChild variant="gold" size="lg" className="mt-6"><Link to="/">Back to live comps</Link></Button>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-24 text-center flex-1">
        <h1 className="font-display text-3xl font-black">Something went sideways.</h1>
        <p className="mt-2 text-muted-foreground text-sm">{error.message}</p>
      </main>
      <SiteFooter />
    </div>
  ),
  component: CompDetail,
});

function CompDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(competitionQueryOptions(slug));
  const c = data as DbCompetition;

  const [qty, setQty] = useState(5);
  const [picker, setPicker] = useState<"lucky" | "manual">("lucky");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [skillOpen, setSkillOpen] = useState(false);
  const [answered, setAnswered] = useState<number | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  const takenSet = useMemo(() => new Set(c.takenNumbers), [c.takenNumbers]);
  const soldTotal = c.totalTickets - c.ticketsAvailable;
  const pct = Math.round((soldTotal / c.totalTickets) * 100);
  const odds = Math.max(1, Math.round(c.totalTickets / Math.max(1, soldTotal)));

  const canProceed = answered !== null && answered === c.skillQuestion.correct;
  const displayNumbers = picker === "manual" ? picked.size : qty;

  const [numberPage, setNumberPage] = useState(0);
  const PAGE_SIZE = 120;
  const pageCount = Math.ceil(c.totalTickets / PAGE_SIZE);
  const startNum = numberPage * PAGE_SIZE + 1;
  const endNum = Math.min(c.totalTickets, startNum + PAGE_SIZE - 1);

  const related = COMPETITIONS.filter((x) => x.slug !== c.slug).slice(0, 3);

  const openSkillModal = () => {
    setReserveError(null);
    setAnswered(null);
    setSkillOpen(true);
  };

  const handleReserve = async () => {
    if (answered === null || !canProceed) {
      setReserveError("Answer the skill question correctly to continue.");
      return;
    }
    setReserveError(null);
    setReserving(true);
    try {
      const token = newReservationToken();
      const numbers =
        picker === "lucky"
          ? await reserveLuckyDip(c.slug, qty, token, answered)
          : await reserveNumbers(c.slug, [...picked], token, answered);

      sessionStorage.setItem(
        "lgc:reservation",
        JSON.stringify({
          token,
          slug: c.slug,
          numbers,
          skillAnswer: answered,
          skillQuestion: c.skillQuestion.q,
          skillAnswerText: c.skillQuestion.options[answered],
          expires: Date.now() + 15 * 60_000,
        }),
      );

      navigate({ to: "/checkout", search: { slug: c.slug, qty: numbers.length } });
    } catch (err) {
      setReserveError(err instanceof Error ? err.message : "Reservation failed.");
      setReserving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10 w-full">
        <div className="text-xs font-semibold text-muted-foreground mb-4">
          <Link to="/" className="hover:text-clover">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{c.category}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{c.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="relative rounded-3xl overflow-hidden bg-card border-2 border-white/5">
              <img src={c.image} alt={c.title} width={1280} height={960} className="w-full aspect-[4/3] object-cover" />
              <div className="absolute top-4 left-4 flex gap-1.5">
                {c.hot && <span className="rounded-sm bg-hot text-hot-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">Hot</span>}
                {c.instantWin && <span className="rounded-sm bg-gold text-gold-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">Instant wins inside</span>}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-widest text-clover">{c.category}</div>
            <h1 className="mt-1 font-display text-3xl md:text-4xl font-black">{c.title}</h1>
            <p className="mt-2 text-muted-foreground">{c.subtitle}</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="rounded-xl bg-background border-2 border-white/10 px-4 py-2">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Ticket</div>
                <div className="font-display font-black text-2xl leading-none">{gbp(c.pricePerTicket)}</div>
              </div>
              <Countdown target={c.endsAt} />
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-sm font-mono tabular-nums mb-1.5">
                <span>{shortNumber(soldTotal)} / {shortNumber(c.totalTickets)} sold</span>
                <span className="text-clover">{pct}%</span>
              </div>
              <div className="h-[2px] rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-clover to-gold" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground font-mono tabular-nums">Odds 1 : {odds.toLocaleString()}</div>
            </div>

            <div className="mt-6 rounded-2xl bg-card border-2 border-white/5 p-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setPicker("lucky"); setReserveError(null); }}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold border-2 flex items-center justify-center gap-1.5 ${picker === "lucky" ? "bg-clover text-cream border-clover" : "bg-background border-white/10"}`}
                >
                  <Shuffle className="h-4 w-4" /> Lucky Dip
                </button>
                <button
                  onClick={() => { setPicker("manual"); setReserveError(null); }}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold border-2 flex items-center justify-center gap-1.5 ${picker === "manual" ? "bg-clover text-cream border-clover" : "bg-background border-white/10"}`}
                >
                  <Ticket className="h-4 w-4" /> Pick numbers
                </button>
              </div>

              {picker === "lucky" ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground/60">How many tickets?</label>
                  <div className="mt-2 flex items-center gap-3">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-11 w-11 rounded-xl border-2 border-white/10 bg-background font-bold text-lg">−</button>
                    <input
                      type="number"
                      value={qty}
                      min={1}
                      max={Math.min(c.maxPerPerson, c.ticketsAvailable)}
                      onChange={(e) => setQty(Math.max(1, Math.min(c.maxPerPerson, c.ticketsAvailable, +e.target.value || 1)))}
                      className="flex-1 h-11 rounded-xl border-2 border-white/10 bg-background text-center font-display font-black text-xl tabular-nums"
                    />
                    <button onClick={() => setQty(Math.min(c.maxPerPerson, c.ticketsAvailable, qty + 1))} className="h-11 w-11 rounded-xl border-2 border-white/10 bg-background font-bold text-lg">+</button>
                  </div>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {[1, 5, 10, 25, 50].filter((n) => n <= c.ticketsAvailable).map((n) => (
                      <button key={n} onClick={() => setQty(n)} className="rounded-lg px-2.5 py-1 text-xs font-bold bg-background border border-white/10 hover:border-clover">
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground font-mono tabular-nums">
                    {c.ticketsAvailable.toLocaleString()} tickets available
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-foreground/60">Tap to pick</div>
                    <div className="flex items-center gap-1 text-xs font-mono tabular-nums">
                      <button disabled={numberPage === 0} onClick={() => setNumberPage((p) => Math.max(0, p - 1))} className="px-2 py-1 rounded border border-white/10 disabled:opacity-30">←</button>
                      <span className="px-2">{startNum}–{endNum}</span>
                      <button disabled={numberPage >= pageCount - 1} onClick={() => setNumberPage((p) => Math.min(pageCount - 1, p + 1))} className="px-2 py-1 rounded border border-white/10 disabled:opacity-30">→</button>
                    </div>
                  </div>
                  <div className="rounded-xl border-2 border-white/10 p-2 bg-background grid grid-cols-10 gap-1">
                    {Array.from({ length: endNum - startNum + 1 }, (_, i) => startNum + i).map((n) => {
                      const taken = takenSet.has(n);
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
                          className={`text-[10px] font-mono tabular-nums aspect-square rounded ${
                            taken ? "bg-white/5 text-foreground/20 line-through cursor-not-allowed" :
                            isPicked ? "bg-clover text-ink ring-1 ring-clover" :
                            "bg-card hover:bg-clover/10"
                          }`}
                        >{n}</button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground font-mono tabular-nums">
                    <span>{picked.size} selected</span>
                    {picked.size > 0 && <button onClick={() => setPicked(new Set())} className="underline">clear</button>}
                  </div>
                </div>
              )}

              {reserveError && !skillOpen && (
                <div className="mt-3 flex items-start gap-2 text-xs text-hot bg-hot/10 border border-hot/30 rounded-lg p-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{reserveError}</span>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-foreground/60">Total</div>
                  <div className="font-display font-black text-3xl leading-none tabular-nums">{gbp(c.pricePerTicket * displayNumbers)}</div>
                  <div className="text-xs text-muted-foreground font-mono tabular-nums">{displayNumbers} ticket{displayNumbers === 1 ? "" : "s"}</div>
                </div>
                <Button variant="gold" size="xl" onClick={openSkillModal} disabled={displayNumbers === 0 || reserving}>
                  Enter now
                </Button>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground text-center">
                A skill question is required before checkout. UK law innit.
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-clover" /> Live streamed draw</div>
              <div className="flex items-center gap-2"><PoundSterling className="h-4 w-4 text-clover" /> Cash alt: {gbp(c.cashAlternative)}</div>
              <div className="flex items-center gap-2"><Ticket className="h-4 w-4 text-clover" /> Max {c.maxPerPerson} per person</div>
              <div className="flex items-center gap-2"><Info className="h-4 w-4 text-clover" /> Auto-drawn on close</div>
            </div>
          </div>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl font-black">About this prize</h2>
            <p className="mt-3 text-foreground/80 leading-relaxed">{c.description}</p>

            <h3 className="mt-8 font-display text-xl font-black">The important bits</h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> Closing: <b>{new Date(c.endsAt).toLocaleString("en-GB")}</b> — or when sold out.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> Cash alternative: <b>{gbp(c.cashAlternative)}</b>.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> Winner automatically drawn and announced within 24h of close.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> UK entrants only, 18+. <Link to="/terms" className="underline">T&Cs apply</Link>.</li>
            </ul>
          </div>
          <aside className="rounded-2xl bg-gold/10 border-2 border-gold/40 p-5">
            <h3 className="font-display text-lg font-black">Automatic draw</h3>
            <p className="mt-2 text-sm text-foreground/80">Winners are picked automatically the moment the timer hits zero (or the last ticket sells). Provably random, verified, and published on the Winners Wall.</p>
            <Link to="/winners" className="mt-3 inline-block font-bold text-clover underline">See recent winners →</Link>
          </aside>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-black">More on the go</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <CompCard key={r.slug} c={r} />)}
          </div>
        </section>
      </main>

      {skillOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => !reserving && setSkillOpen(false)}
        >
          <div className="bg-background rounded-3xl border-2 border-white/10 w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs font-bold uppercase tracking-widest text-clover">Skill question · required</div>
            <h3 className="mt-1 font-display text-2xl font-black">{c.skillQuestion.q}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You must answer correctly to reserve tickets — your answer is recorded with your order.
            </p>
            <div className="mt-4 space-y-2">
              {c.skillQuestion.options.map((opt, i) => {
                const chosen = answered === i;
                const wrong = chosen && i !== c.skillQuestion.correct;
                const right = chosen && i === c.skillQuestion.correct;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswered(i)}
                    disabled={reserving}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 font-semibold transition-colors flex items-center justify-between ${
                      right ? "border-clover bg-clover/10" :
                      wrong ? "border-hot bg-hot/10" :
                      "border-white/10 bg-card hover:border-clover/40"
                    }`}
                  >
                    <span>{String.fromCharCode(65 + i)}. {opt}</span>
                    {right && <CheckCircle2 className="h-4 w-4 text-clover" />}
                    {wrong && <AlertTriangle className="h-4 w-4 text-hot" />}
                  </button>
                );
              })}
            </div>
            {answered !== null && (
              <div className={`mt-3 text-sm font-bold ${canProceed ? "text-clover" : "text-hot"}`}>
                {canProceed ? "Correct. You can continue." : "Not quite — pick another answer."}
              </div>
            )}
            {reserveError && (
              <div className="mt-3 text-xs text-hot flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{reserveError}</span>
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <Button variant="cream" onClick={() => setSkillOpen(false)} className="flex-1" disabled={reserving}>Cancel</Button>
              <Button
                variant="gold"
                size="lg"
                disabled={!canProceed || reserving}
                onClick={handleReserve}
                className="flex-1"
              >
                {reserving ? <><Loader2 className="h-4 w-4 animate-spin" /> Locking tickets…</> : "Reserve & checkout"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
