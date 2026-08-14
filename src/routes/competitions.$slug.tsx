import { createFileRoute, notFound, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ticket, Shuffle, Shield, PoundSterling, CheckCircle2, Info, Loader2, AlertTriangle } from "lucide-react";
import { SkillWarning } from "@/components/SkillWarning";
import { SiteNav } from "@/components/SiteNav";
import { DrawBoardForCompetition } from "@/components/DrawBoard";
import { GuaranteePanel } from "@/components/GuaranteePanel";
import { OddsStamp, SoldCounter } from "@/components/TicketOdds";
import { SiteFooter } from "@/components/SiteFooter";
import { Countdown } from "@/components/Countdown";
import { CompCard } from "@/components/CompCard";
import { Button } from "@/components/ui/button";
import { PrizeGallery } from "@/components/PrizeImage";
import { gbp, shortNumber, pickLoadingQuip } from "@/lib/format";
import { LuckyMark } from "@/components/GaryMascot";
import { CouponGrid } from "@/components/CouponGrid";
import { Odometer } from "@/components/Odometer";
import { NearMiss } from "@/components/NearMiss";
import { PickHeatmap } from "@/components/PickHeatmap";
import { RevealedAnswer } from "@/components/RevealedAnswer";
import { competitionResultQuery } from "@/lib/results-api";
import { lifecycleOf, formatDrawTime } from "@/lib/site-stats";
import { ExampleBanner, isDemo } from "@/lib/demo";
import { usePlayBlock } from "@/hooks/use-play-block";
import {
  competitionQueryOptions,
  allCompetitionsQueryOptions,
  explainReservationFailure,
  newReservationToken,
  reserveLuckyDip,
  reserveNumbers,
  type DbCompetition,
} from "@/lib/competitions-api";

/** Retired slugs → the live page they should land on. Permanent redirects. */
const LEGACY_SLUGS: Record<string, string> = {
  "audi-rs3-25k-cash": "audi-rs3-45k-cash",
};

export const Route = createFileRoute("/competitions/$slug")({
  loader: async ({ params, context }) => {
    // Old URLs we've published in the past still have to land somewhere sensible.
    const legacy = LEGACY_SLUGS[params.slug];
    if (legacy) throw redirect({ to: "/competitions/$slug", params: { slug: legacy } });
    const data = await context.queryClient.ensureQueryData(competitionQueryOptions(params.slug));
    if (!data) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Enter now — Lucky Git Comps" },
      { name: "description", content: "Pick your tickets, join the draw. Auto-drawn on close." },
      { property: "og:title", content: "Enter now — Lucky Git Comps" },
    ],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-24 text-center flex-1">
        <LuckyMark className="mx-auto h-16 w-16" />
        <h1 className="mt-4 font-display text-4xl font-black">That comp's gone.</h1>
        <p className="mt-2 text-muted-foreground">This page has done one. Try the comps.</p>
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
  const { data: allComps = [] } = useQuery(allCompetitionsQueryOptions);

  const [qty, setQty] = useState(5);
  const [picker, setPicker] = useState<"lucky" | "manual">("lucky");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [availableLeft, setAvailableLeft] = useState<number | null>(null);
  const [soldOut, setSoldOut] = useState(false);
  const [reservingQuip, setReservingQuip] = useState(pickLoadingQuip());
  const queryClient = useQueryClient();
  const { data: result } = useQuery(competitionResultQuery(slug));

  const phase = lifecycleOf({ endsAt: c.endsAt, status: c.status, drawId: result?.drawId });
  const isLive = phase === "live";
  const play = usePlayBlock();

  const takenSet = useMemo(() => new Set(c.takenNumbers), [c.takenNumbers]);
  const soldTotal = c.totalTickets - c.ticketsAvailable;
  const pct = Math.round((soldTotal / c.totalTickets) * 100);

  const displayNumbers = picker === "manual" ? picked.size : qty;

  const related = allComps.filter((x) => x.slug !== c.slug).slice(0, 3);

  const toggleNumber = (n: number) => {
    setPicker("manual");
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else if (next.size < Math.min(c.maxPerPerson, c.ticketsAvailable)) next.add(n);
      return next;
    });
  };

  const handleReserve = async () => {
    setReserveError(null);
    setAvailableLeft(null);
    setSoldOut(false);
    setReservingQuip(pickLoadingQuip());
    setReserving(true);
    try {
      const token = newReservationToken();
      const numbers =
        picker === "lucky"
          ? await reserveLuckyDip(c.slug, qty, token)
          : await reserveNumbers(c.slug, [...picked], token);

      sessionStorage.setItem(
        "lgc:reservation",
        JSON.stringify({
          token,
          slug: c.slug,
          numbers,
          expires: Date.now() + 15 * 60_000,
        }),
      );
      window.dispatchEvent(new Event("lgc:basket-change"));

      navigate({ to: "/checkout", search: { slug: c.slug, qty: numbers.length } });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Reservation failed.";
      const requested = picker === "lucky" ? qty : picked.size;
      const { message, availability } = await explainReservationFailure(c.slug, requested, raw);
      setReserveError(message);
      if (availability) {
        setAvailableLeft(availability.available);
        setSoldOut(availability.available === 0 || availability.closed);
        if (picker === "lucky" && availability.available > 0 && availability.available < qty) {
          setQty(availability.available);
        }
      }
      // Refresh grid so taken numbers reflect what just went.
      queryClient.invalidateQueries({ queryKey: ["competition", c.slug] });
      setReserving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10 w-full pb-28 md:pb-10">
        <div className="text-xs font-semibold text-muted-foreground mb-4">
          <Link to="/competitions" className="hover:text-clover">All comps</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{c.category}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{c.title}</span>
        </div>

        {/* The Draw Board — headline act once the comp is closed or drawn. */}
        {phase !== "live" && (
          <div className="mb-8">
            <DrawBoardForCompetition slug={c.slug} />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="relative">
              <PrizeGallery
                hero={c.image}
                supporting={c.supportingImages}
                title={c.title}
                eyebrow={c.category}
              />
              {c.hot && (
                <span className="absolute top-3 left-3 z-10 rounded-sm bg-urgent text-urgent-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">Hot</span>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-widest text-clover">{c.category}</div>
            <h1 className="mt-1 font-display font-black leading-[1.05] break-words hyphens-auto text-[clamp(1.55rem,5.5vw,2.5rem)]">{c.title}</h1>
            <p className="mt-2 text-muted-foreground">{c.subtitle}</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="rounded-xl bg-background border-2 border-border px-4 py-2">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Ticket</div>
                <div className="font-display font-black text-2xl leading-none">{gbp(c.pricePerTicket)}</div>
              </div>
              <Countdown target={c.endsAt} />
            </div>

            {/* Odds and the exact count — stamped, above the fold, every time. */}
            <div className="mt-4">
              <OddsStamp total={c.totalTickets} />
              <div className="mt-3">
                <SoldCounter
                  sold={c.totalTickets - c.ticketsAvailable}
                  total={c.totalTickets}
                  strapline
                />
              </div>
            </div>

            {isDemo(c) && (
              <div className="mt-4">
                <ExampleBanner />
              </div>
            )}

            <div className="mt-5">
              <div className="flex justify-between text-sm font-mono tabular-nums mb-1.5">
                <span>{shortNumber(soldTotal)} / {shortNumber(c.totalTickets)} sold</span>
                <span className="text-clover">{pct}%</span>
              </div>
              <div className="h-[2px] rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-clover to-gold" style={{ width: `${pct}%` }} />
              </div>

            </div>

            {isLive ? (
              <>
            <div className="mt-6 rounded-2xl bg-card border-2 border-border p-4">
              <div className="mb-4"><SkillWarning compact /></div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => { setPicker("lucky"); setReserveError(null); }}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold border-2 flex items-center justify-center gap-1.5 ${picker === "lucky" ? "bg-clover text-cream border-clover" : "bg-background border-border"}`}
                >
                  <Shuffle className="h-4 w-4" /> Lucky Dip
                </button>
                <button
                  onClick={() => { setPicker("manual"); setReserveError(null); }}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold border-2 flex items-center justify-center gap-1.5 ${picker === "manual" ? "bg-clover text-cream border-clover" : "bg-background border-border"}`}
                >
                  <Ticket className="h-4 w-4" /> Pick numbers
                </button>
              </div>

              {picker === "lucky" ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">How many tickets?</label>
                  <div className="mt-2 flex items-center gap-3">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-11 w-11 rounded-xl border-2 border-border bg-background font-bold text-lg">−</button>
                    <input
                      type="number"
                      value={qty}
                      min={1}
                      max={Math.min(c.maxPerPerson, c.ticketsAvailable)}
                      onChange={(e) => setQty(Math.max(1, Math.min(c.maxPerPerson, c.ticketsAvailable, +e.target.value || 1)))}
                      className="flex-1 h-11 rounded-xl border-2 border-border bg-background text-center font-display font-black text-xl tabular-nums"
                    />
                    <button onClick={() => setQty(Math.min(c.maxPerPerson, c.ticketsAvailable, qty + 1))} className="h-11 w-11 rounded-xl border-2 border-border bg-background font-bold text-lg">+</button>
                  </div>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {[1, 5, 10, 25, 50, 100, c.maxPerPerson]
                      .filter((n, i, arr) => n <= c.ticketsAvailable && n <= c.maxPerPerson && arr.indexOf(n) === i)
                      .map((n) => (
                      <button key={n} onClick={() => setQty(n)} className="rounded-lg px-2.5 py-1 text-xs font-bold bg-background border border-border hover:border-clover">
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground font-mono tabular-nums">
                    {c.ticketsAvailable.toLocaleString()} tickets available
                  </div>
                </div>
              ) : null}

              {/* The pool, always on show. Sold numbers X'd off in biro. */}
              <div className="mt-4 pt-4 border-t border-dashed border-border">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  The coupon — tap a number, or type them in.
                </div>
                <CouponGrid
                  total={c.totalTickets}
                  sold={takenSet}
                  picked={picked}
                  onToggle={toggleNumber}
                />
                {picked.size > 0 && (
                  <button onClick={() => setPicked(new Set())} className="mt-2 text-xs font-mono underline text-muted-foreground">
                    clear selection
                  </button>
                )}
              </div>

              {reserveError && (
                <div className="mt-3 rounded-lg border-2 border-urgent/40 bg-urgent/10 p-3 text-xs text-urgent">
                  <div className="flex items-start gap-2 font-bold">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{reserveError}</span>
                  </div>
                  {availableLeft !== null && !soldOut && (
                    <div className="mt-1 pl-6 font-mono text-[11px] tabular-nums text-urgent/80">
                      {availableLeft} of {c.totalTickets} tickets left
                    </div>
                  )}
                  {soldOut && (
                    <div className="mt-1 pl-6 font-mono text-[11px] tabular-nums text-urgent/80">
                      Gone. You snooze, you lose.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Total</div>
                  <div className="font-display font-black text-3xl leading-none tabular-nums">
                    <Odometer value={c.pricePerTicket * displayNumbers} format={gbp} />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono tabular-nums">{displayNumbers} ticket{displayNumbers === 1 ? "" : "s"}</div>
                </div>
                <Button variant="gold" size="xl" onClick={handleReserve} disabled={displayNumbers === 0 || reserving || soldOut || play.blocked}>
                  {reserving ? <><Loader2 className="h-4 w-4 animate-spin" /> {reservingQuip}</> : "Go on then"}
                </Button>
              </div>

              <p className="mt-3 text-[12px] leading-snug text-muted-foreground">
                Draws automatically when the timer hits zero, from correct entries only.
              </p>

              {/* Free route: findable, deliberately not a button of equal weight. */}
              <div className="mt-3 text-[12px] leading-snug">
                <span className="text-muted-foreground">Prefer not to pay? </span>
                <Link to="/free-entry" className="underline font-semibold">
                  Enter free by post or email →
                </Link>
                <div className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                  {c.freeSlotsClaimed >= c.freeEntrySlots
                    ? "Free entry: fully claimed for this competition."
                    : `Free spots: ${c.freeSlotsClaimed} of ${c.freeEntrySlots} claimed`}
                </div>
                {(c.postalCutoffAt || c.emailCutoffAt) && (
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {c.postalCutoffAt && <>Postal cut-off {new Date(c.postalCutoffAt).toLocaleDateString("en-GB")}. </>}
                    {c.emailCutoffAt && <>Email cut-off {new Date(c.emailCutoffAt).toLocaleDateString("en-GB")}.</>}
                  </div>
                )}
              </div>

              {play.message && (
                <div
                  role="status"
                  className="mt-3 rounded-md border-2 border-[color:var(--color-ink-red)] bg-[var(--color-paper-raised)] p-3 text-[13px] font-semibold"
                >
                  {play.message}{" "}
                  <Link to="/responsible-play" className="underline">Responsible play</Link>
                </div>
              )}

              <div className="mt-4 pt-4 border-t-2 border-dashed border-border text-[11px] text-muted-foreground">
                <Link to="/how-entry-works" className="underline">How entry works</Link>{" "}
                — this is a prize competition of skill under Section 14 of the Gambling Act 2005.
              </div>
            </div>

            {/* Sample skill question — so the no-refund rule is understood before checkout. */}
            <SkillStub />
              </>
            ) : (
              <ClosedPanel comp={c} phase={phase} result={result ?? null} />
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-clover" /> Verifiable RNG draw</div>
              <div className="flex items-center gap-2">
                <PoundSterling className="h-4 w-4 text-clover" />
                <span>
                  Cash alt: {gbp(c.cashAlternative)}
                </span>
              </div>
              <div className="flex items-center gap-2"><Ticket className="h-4 w-4 text-clover" /> Max {c.maxPerPerson} per person</div>
              <div className="flex items-center gap-2"><Info className="h-4 w-4 text-clover" /> Auto-drawn on close</div>
            </div>
          </div>
        </div>

        {/* Pre-draw board — the flaps are blank until the timer runs out. */}
        {phase === "live" && (
          <section className="mt-10">
            <DrawBoardForCompetition slug={c.slug} />
          </section>
        )}

        {/* Post-close only: personal result, then the pick board. */}
        {result && (
          <section className="mt-10">
            {result.soldNumbers.length === 0 ? (
              <div className="border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] p-4">
                <p className="font-display uppercase text-lg leading-tight">
                  Nobody entered. Not one of you. We're not angry, just disappointed.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  This one closed with an empty coupon, so the void-comp process in the{" "}
                  <Link to="/terms" className="underline">T&amp;Cs</Link> applies.
                </p>
              </div>
            ) : (
              <>
                <NearMiss slug={c.slug} competitionTitle={c.title} />
                <PickHeatmap result={result} />
                <RevealedAnswer slug={c.slug} />
              </>
            )}
          </section>
        )}

        <section id="rules" className="mt-12 grid gap-8 lg:grid-cols-3 scroll-mt-32">
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl font-black">What you're playing for</h2>
            <p className="mt-3 text-foreground/80 leading-relaxed">{c.description}</p>

            <h3 className="mt-8 font-display text-xl font-black">Rules for this competition</h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> Closing: <b>{new Date(c.endsAt).toLocaleString("en-GB")}</b> — or when sold out.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> Maximum entries per person: <b>{c.maxPerPerson}</b>.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> Total pool: <b>{c.totalTickets}</b> tickets — one ticket is 1 in {c.totalTickets}.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> A correct skill answer is required to qualify. Wrong answer, no entry, no refund.</li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" />
                <span>
                  Cash alternative: <b>{gbp(c.cashAlternative)}</b>.
                </span>
              </li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> Winner automatically drawn and announced within 24h of close.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-clover mt-0.5 shrink-0" /> UK entrants only, 18+. <Link to="/terms" className="underline">T&Cs apply</Link>.</li>
            </ul>
          </div>
          <aside className="space-y-5">
            <GuaranteePanel compact />
            <div className="rounded-2xl bg-gold/10 border-2 border-gold/40 p-5">
            <h3 className="font-display text-lg font-black">How the draw goes off</h3>
            <p className="mt-2 text-sm text-foreground/80">Winners are picked automatically the moment the timer hits zero (or the last ticket sells). Provably random, verified, and published on the Winners Wall.</p>
            <Link to="/winners" className="mt-3 inline-block font-bold text-clover underline">See recent winners →</Link>
            </div>
          </aside>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-black">More on the go</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <CompCard key={r.slug} c={r} />)}
          </div>
        </section>
      </main>

      {/* Mobile sticky basket bar — live comps only. */}
      {isLive && (
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t-2 border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] px-4 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.16em] font-bold text-muted-foreground">Total</div>
          <div className="font-display font-black text-xl leading-none tabular-nums">
            {gbp(c.pricePerTicket * displayNumbers)}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground tabular-nums">
            {displayNumbers} ticket{displayNumbers === 1 ? "" : "s"}
          </div>
        </div>
        <Button variant="gold" size="lg" onClick={handleReserve} disabled={displayNumbers === 0 || reserving || soldOut || play.blocked}>
          {reserving ? <><Loader2 className="h-4 w-4 animate-spin" /> {reservingQuip}</> : "Go on then"}
        </Button>
      </div>
      )}

      <SiteFooter />
    </div>
  );
}

/**
 * Closed / drawn state. Replaces the buy flow: the comp URL stays alive
 * forever, it just stops selling and starts reporting.
 */
function ClosedPanel({
  comp,
  phase,
  result,
}: {
  comp: DbCompetition;
  phase: "drawing" | "drawn" | "live";
  result: { winningNumber: number | null; drawId: string | null; drawnAt: string | null; winnerDisplayName: string | null; soldNumbers: number[] } | null;
}) {
  const drawn = phase === "drawn" && result?.winningNumber != null;
  const soldSet = new Set(result?.soldNumbers ?? []);
  return (
    <div className="mt-6 border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
      <div className={"px-3 py-1.5 font-display uppercase tracking-[0.16em] text-[11px] text-[var(--color-paper)] " + (drawn ? "bg-[var(--color-ink-grey)]" : "bg-[var(--color-ink-blue)]")}>
        {drawn ? "Drawn" : `Closed — drawing ${formatDrawTime(comp.endsAt)}`}
      </div>
      <div className="p-4">
        {drawn ? (
          <>
            <div className="label text-[9px]">Winning number</div>
            <div className="font-display text-5xl leading-none tabular-nums">
              {result!.winningNumber}
              <span className="text-base text-muted-foreground"> / {comp.totalTickets}</span>
            </div>
            <p className="mt-2 font-mono text-[12px] text-muted-foreground">
              {result!.winnerDisplayName ? <>Winner: <b className="text-foreground">{result!.winnerDisplayName}</b> · </> : null}
              Drawn {formatDrawTime(result!.drawnAt)}
            </p>

            <div className="mt-4">
              <div className="label text-[9px] mb-2">The coupon, as it fell</div>
              <CouponGrid
                total={comp.totalTickets}
                sold={soldSet}
                picked={new Set([result!.winningNumber as number])}
                onToggle={() => {}}
              />
            </div>

            {result!.drawId && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/draws/$id/verify"
                  params={{ id: result!.drawId }}
                  className="inline-flex items-center gap-1.5 bg-[var(--color-ink-blue)] text-[var(--color-paper)] px-3 py-2 font-display uppercase tracking-[0.14em] text-[11px] hover:bg-[var(--color-ink-black)]"
                >
                  <Shield className="h-3.5 w-3.5" /> Verify this draw
                </Link>
                <Link
                  to="/results"
                  className="inline-flex items-center gap-1.5 border-2 border-[var(--color-ink-black)] bg-[var(--color-paper)] px-3 py-2 font-display uppercase tracking-[0.14em] text-[11px] hover:bg-[var(--color-ink-yellow)]"
                >
                  All results
                </Link>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="font-display uppercase text-xl leading-tight">
              Entries are closed on this one.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              The automatic draw runs off the sealed seed — nothing left for anyone to fiddle.
              Hold tight, the result lands here and on{" "}
              <Link to="/results" className="underline">results</Link>.
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-blue)]">
              Closed {formatDrawTime(comp.endsAt)} · {comp.totalTickets - comp.ticketsAvailable} of {comp.totalTickets} tickets went
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Sample skill question, styled as a coupon stub. Sets the expectation that a
 * wrong answer means the tickets don't enter — before any money changes hands.
 */
function SkillStub() {
  return (
    <div className="mt-4 border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
      <div className="bg-[var(--color-ink-blue)] text-[var(--color-paper)] px-3 py-1.5 font-display uppercase tracking-[0.16em] text-[11px]">
        The question will look like this
      </div>
      <div className="p-3">
        <p className="font-mono text-[13px] text-foreground">
          Example: <b>What is 14 + 9?</b>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block border border-dashed border-[var(--color-ink-black)] px-6 py-1.5 font-mono text-sm text-muted-foreground">
            your answer
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Numbers only
          </span>
        </div>
        <p className="mt-3 font-mono text-[11px] leading-snug text-[var(--color-ink-red)]">
          Get it wrong and your tickets don't enter the draw. No refund. That's the
          rule, and it's the same rule for everyone.
        </p>
      </div>
    </div>
  );
}
