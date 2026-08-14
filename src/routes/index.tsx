import { TerrysTip } from "@/components/TerrysTip";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Ticket, Shield, Radio, MessageSquareHeart, Dices, Handshake, Headset, ListOrdered } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { DrawBoardForDraw } from "@/components/DrawBoard";
import { SiteFooter } from "@/components/SiteFooter";
import { CompCard } from "@/components/CompCard";
import { CompRow } from "@/components/CompRow";
import { ViewToggle } from "@/routes/competitions.index";
import { Countdown } from "@/components/Countdown";
import { Lockup } from "@/components/Logo";
import { Marker } from "@/components/Marker";
import { Perforation } from "@/components/Perforation";
import type { Category } from "@/lib/mock-comps";
import { allCompetitionsQueryOptions } from "@/lib/competitions-api";
import { NewsletterSlip } from "@/components/NewsletterSlip";
import { WinnerCard } from "@/components/WinnerCard";
import { winnersQuery, realOnly } from "@/lib/winners-api";
import { useSiteStats, formatCloseDate, pinDrawingFirst, lifecycleOf, formatDrawTime } from "@/lib/site-stats";
import { drawnCompetitionsQuery } from "@/lib/results-api";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { gbp } from "@/lib/format";
import { DRAW_AND_PAY_LINE, DRAW_DELAYED_LINE, DRAW_DELAY_GRACE_MS } from "@/lib/promises";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(allCompetitionsQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Lucky Git Comps — Win Cars, Cash & Tech in the UK" },
      { name: "description", content: "UK prize competitions with verified winners and automatic random draws. Cars, tech, cash and holidays from £1." },
      { property: "og:title", content: "Lucky Git Comps — Win Cars, Cash & Tech in the UK" },
      { property: "og:description", content: "UK prize competitions with verified winners and automatic random draws. Cars, tech, cash and holidays from £1." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: COMPETITIONS } = useSuspenseQuery(allCompetitionsQueryOptions);
  const CATEGORIES = useMemo(
    () => [...new Set(COMPETITIONS.map((c) => c.category))],
    [COMPETITIONS],
  );
  const openComps = COMPETITIONS.filter((c) => lifecycleOf(c) === "live");
  const hotOnes = openComps.filter((c) => c.hot);
  const hero = (hotOnes.length ? hotOnes : openComps).slice(0, 3);
  const [active, setActive] = useState(0);
  const [cat, setCat] = useState<Category | "All">("All");
  const [sort, setSort] = useState<"ending" | "popular" | "price">("ending");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [openWinnerId, setOpenWinnerId] = useState<string | null>(null);
  const { data: allWinners = [] } = useQuery(winnersQuery);
  const winners = realOnly(allWinners);
  const stats = useSiteStats();
  const { data: drawnComps = [] } = useQuery(drawnCompetitionsQuery);
  const lastDrawn = drawnComps[0] ?? null;
  // Closed, past the grace period, and still no draw record. We say so.
  const delayedDraws = stats.closed.filter(
    (c) => Date.now() - new Date(c.endsAt).getTime() > DRAW_DELAY_GRACE_MS,
  );

  const filtered = useMemo(() => {
    let list = cat === "All" ? COMPETITIONS : COMPETITIONS.filter((c) => c.category === cat);
    list = [...list];
    if (sort === "ending") list.sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt));
    if (sort === "popular") list.sort((a, b) => b.ticketsSold / b.totalTickets - a.ticketsSold / a.totalTickets);
    if (sort === "price") list.sort((a, b) => a.pricePerTicket - b.pricePerTicket);
    return pinDrawingFirst(list);
  }, [cat, sort, COMPETITIONS]);

  // Filters, sorting and the grid/list toggle only earn their keep once
  // there's a proper shelf to sort. Below four live comps we show a single
  // featured layout instead. Controls return automatically at 4+.
  const showControls = openComps.length >= 4;

  const featured = hero[active] ?? hero[0];
  const featuredPct = featured
    ? Math.round((featured.ticketsSold / featured.totalTickets) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />

      {/* HERO — pools-coupon masthead */}
      <section className="halftone relative overflow-hidden rule-heavy border-b-[3px] border-[var(--color-ink-black)]">
        <div className="mx-auto max-w-7xl px-4 pt-2 pb-8 md:pt-4 md:pb-12">
          <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h1
              className="misreg font-display uppercase leading-[0.9] tracking-[0.01em] text-foreground"
            >
              Real odds.<br />
              Automatic draws.
            </h1>
            <p className="mt-5 text-muted-foreground text-base md:text-lg leading-[1.55] max-w-[34ch]">
              <Marker><span className="text-foreground font-bold">Might as well be you.</span></Marker> Cars, cash, tech and holidays. Every ticket counted, every draw published. No smoke, no mirrors, no bloke pulling names out of a hat in a back room.
            </p>

            {/* Featured comp mini card */}
            {featured && (
            <div className="mt-6 rounded-lg bg-card border border-border text-foreground p-4 max-w-md shadow-md">
              <div className="flex gap-3">
                <div className="prize-treatment shrink-0 h-20 w-20">
                  <img src={featured.image} alt="" width={320} height={320} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">{featured.category}</div>
                  <div className="font-display text-base font-bold leading-tight truncate">{featured.title}</div>
                  <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full shimmer" style={{ width: `${featuredPct}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] font-mono tabular-nums flex justify-between">
                    <span className="text-muted-foreground">{featured.ticketsSold.toLocaleString()} / {featured.totalTickets.toLocaleString()}</span>
                    <span className="text-clover font-bold">{featuredPct}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">From</div>
                  <div className="font-display font-black text-2xl leading-none tabular-nums">{gbp(featured.pricePerTicket)}</div>
                </div>
                <Countdown target={featured.endsAt} compact />
                <Button asChild variant="git" size="lg" className="ml-auto">
                  <Link to="/competitions/$slug" params={{ slug: featured.slug }}>
                    Enter Now <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            )}

            <div className="mt-5 flex gap-1.5">
              {hero.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Show featured ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${i === active ? "w-8 bg-clover" : "w-4 bg-border"}`}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="git" size="lg">
                <Link to="/competitions">See what's live →</Link>
              </Button>
              <Link
                to="/odds"
                className="inline-flex h-11 items-center justify-center border-2 border-[var(--color-ink-blue)] bg-[var(--color-paper)] px-6 text-[15px] font-body font-bold uppercase tracking-[0.14em] text-[var(--color-ink-blue)] transition-colors hover:bg-[var(--color-ink-yellow)]"
              >
                Best odds now
              </Link>
            </div>
          </div>

          {/* Live stats panel — honest numbers only. Hidden until at least
              one draw has been published, so nothing on the site claims
              100% of anything before we've done any of it. */}
          <div className="relative hidden md:block">
            <div className="caption-micro">Platform stats · Live</div>
            <dl className="ledger mt-2">
              <LedgerRow label="Prizes on the table" value={gbp(stats.prizesOnTable)} tone="red" />
              <LedgerRow label="Comps running" value={stats.compsLive.toString().padStart(2, "0")} />
              <LedgerRow label="Tickets flogged" value={stats.ticketsSold.toLocaleString()} />
              {stats.drawsCompleted > 0 ? (
                <LedgerRow label="Draws gone off" value={stats.drawsCompleted.toString().padStart(2, "0")} />
              ) : (
                <LedgerRow label="First draw" value={formatCloseDate(stats.nextCloseAt)} />
              )}
            </dl>
            <p className="caption-micro mt-2 leading-[1.5] normal-case tracking-[0.06em]">
              Every draw automatic. Every ticket number published.{" "}
              <Link to="/transparency" className="underline">See the numbers</Link>.
            </p>
          </div>
          </div>
        </div>
      </section>

      <Perforation color="var(--color-ink-black)" className="text-transparent" />

      {/* TRUST STRIP */}
      <section className="border-y-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <ul className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x sm:mx-0 sm:px-0 sm:pb-0 sm:overflow-visible sm:grid sm:grid-cols-2 sm:gap-4">
            {[
              { icon: Dices, label: "Automatic random draws" },
              { icon: Handshake, label: "Verified winners, real handshakes" },
              { icon: Headset, label: "UK company, UK humans on support" },
              { icon: ListOrdered, label: "Every ticket number published" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="snap-start shrink-0 w-[150px] sm:w-auto flex flex-col gap-2 border-2 border-[var(--color-ink-blue)] bg-[var(--color-paper)] p-3"
              >
                <Icon aria-hidden className="h-5 w-5 text-[var(--color-coupon-red)]" />
                <span className="font-display uppercase tracking-[0.1em] text-[13px] leading-snug font-bold text-[var(--color-ink-blue)]">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TERRY'S TIP OF THE WEEK */}
      {/* LAST DRAWN — always on show, whatever's live. */}
      <section className="border-b-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="label text-[9px] text-[var(--color-ink-blue)]">Last drawn</div>
            {delayedDraws.length > 0 ? (
              <p className="font-display uppercase text-sm md:text-base leading-tight text-[var(--color-ink-red)]">
                {delayedDraws[0]!.title} — {DRAW_DELAYED_LINE}
              </p>
            ) : lastDrawn ? (
              <p className="font-display uppercase text-sm md:text-base leading-tight truncate">
                {lastDrawn.title} — no. {lastDrawn.winningNumber} ·{" "}
                <span className="font-mono text-[11px] text-muted-foreground normal-case">
                  {formatDrawTime(lastDrawn.drawnAt)}
                </span>
              </p>
            ) : (
              <p className="font-display uppercase text-sm md:text-base leading-tight">
                Nothing drawn yet — first one's on its way.
              </p>
            )}
          </div>
          <Link
            to="/results"
            className="shrink-0 inline-flex items-center gap-1.5 border-2 border-[var(--color-ink-black)] bg-[var(--color-paper)] px-3 py-1.5 font-display uppercase tracking-[0.14em] text-[11px] hover:bg-[var(--color-ink-yellow)]"
          >
            All results <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* LATEST RESULT — the draw board, replayable by anyone. */}
      {lastDrawn && (
        <section className="mx-auto max-w-7xl px-4 pt-6 w-full">
          <div className="label text-[9px] text-[var(--color-ink-blue)] mb-2">Latest result</div>
          <DrawBoardForDraw drawId={lastDrawn.drawId} />
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pt-6 w-full">
        <TerrysTip />
      </section>

      {/* LIVE COMPETITIONS GRID */}
      <section className="mx-auto max-w-7xl px-4 pt-3 pb-2 w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover mb-2 font-bold">Live · {stats.compsLive.toString().padStart(2, "0")}</div>
            <h2 className="font-display font-black tracking-tight text-foreground">Competitions</h2>
            <p className="text-muted-foreground text-sm mt-1">Every ticket accounted for, every close time public.</p>
          </div>
          {showControls && (
          <div className="flex items-center gap-2 flex-wrap">
            <ViewToggle view={view} onChange={setView} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="border-2 border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] px-3 py-1 text-[11px] font-body font-bold uppercase tracking-[0.14em] text-[var(--color-ink-black)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-blue)]"
            >
              <option value="ending">Ending soonest</option>
              <option value="popular">Most popular</option>
              <option value="price">Cheapest first</option>
            </select>
          </div>
          )}
        </div>

        {showControls && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                "shrink-0 whitespace-nowrap border-2 border-[var(--color-ink-black)] px-3 py-1 text-[11px] font-body font-bold uppercase tracking-[0.14em] transition-colors " +
                (cat === c
                  ? "bg-[var(--color-ink-blue)] text-[var(--color-paper)]"
                  : "bg-[var(--color-paper-raised)] text-[var(--color-ink-black)] hover:bg-[var(--color-ink-yellow)]")
              }
            >
              {c}
            </button>
          ))}
        </div>
        )}

        {!showControls ? (
          <div className="mt-6 flex flex-col gap-3">
            {filtered.map((c) => (
              <div key={c.slug} className="rise-in mx-auto w-full max-w-2xl">
                <CompCard c={c} />
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="mt-4 font-mono text-sm text-muted-foreground">
                Nothing live this minute. Next lot's on its way.
              </p>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="stall-grid mt-6 grid gap-3 sm:gap-5 grid-cols-2 md:grid-cols-3 items-stretch">
            {filtered.map((c) => (
              <div key={c.slug} className="rise-in h-full">
                <CompCard c={c} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            {filtered.map((c) => (
              <div key={c.slug} className="rise-in">
                <CompRow c={c} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mx-auto max-w-7xl px-4 mt-6 md:mt-10"><div role="separator" aria-hidden className="perf-rule" /></div>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 mt-4 md:mt-6 w-full">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover font-bold">How it works</div>
          <h2 className="mt-2 font-display font-black tracking-[-0.02em] text-foreground">Three steps. One of them's a skill question.</h2>
        </div>
        {/* Bento box */}
        <div className="mt-8 grid gap-4 md:grid-cols-6 md:grid-rows-2 md:auto-rows-fr">
          <div className="md:col-span-3 md:row-span-2 rounded-lg bg-card border border-border p-8 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="font-mono text-[11px] tracking-[0.25em] text-clover font-bold">STEP 01</div>
            <h3 className="mt-4 font-display text-3xl md:text-4xl font-black tracking-tight text-foreground">Pick your tickets.</h3>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed max-w-md">
              Lucky Dip if you can't be bothered, or hand-pick your numbers like it matters. From a quid a go. Grid updates live so you can't nick a number someone else already has.
            </p>
          </div>
          <div className="md:col-span-3 rounded-lg bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="font-mono text-[11px] tracking-[0.25em] text-clover font-bold">STEP 02</div>
            <h3 className="mt-3 font-display text-xl font-black text-foreground">Checkout, sorted.</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Answer a genuine skill question before paying. Get it right and you're in the draw. Get it wrong and your tickets don't qualify — stated unmissably before you pay.</p>
          </div>
          <div className="md:col-span-3 rounded-lg bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="font-mono text-[11px] tracking-[0.25em] text-clover font-bold">STEP 03</div>
            <h3 className="mt-3 font-display text-xl font-black text-foreground">Draw goes off automatically.</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{DRAW_AND_PAY_LINE} Drawn from correct entries only, with the pool size published for verification.</p>
          </div>
        </div>
      </section>

      {/* WINNERS WALL */}
      <section className="mx-auto max-w-7xl px-4 mt-8 md:mt-14 w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover mb-2 font-bold">Winners · Verified</div>
            <h2 className="font-display font-black tracking-[-0.02em] text-foreground">Smug Gits.</h2>
            <p className="text-muted-foreground mt-1">Real people who won real things. Try not to hate them.</p>
          </div>
          <Link to="/winners" className="text-sm font-bold text-clover hover:underline">Smug Gits (Our Winners) →</Link>
        </div>
        {winners.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {winners.slice(0, 3).map((w) => (
              <WinnerCard
                key={w.id}
                w={w}
                expanded={openWinnerId === w.id}
                onToggle={(id) => setOpenWinnerId((cur) => (cur === id ? null : id))}
              />
            ))}
          </div>
        ) : (
          <p className="mt-6 font-mono text-sm text-muted-foreground">
            No draws yet — first winners land after the next close.{" "}
            <Link to="/winners" className="font-bold text-clover underline underline-offset-2">See the winners wall</Link>
          </p>
        )}
      </section>

      <div className="mx-auto max-w-7xl px-4 mt-6 md:mt-10"><div role="separator" aria-hidden className="perf-rule" /></div>

      <NewsletterSlip />
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "clover" }) {
  return (
    <div>
      <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className={"mt-1 font-display font-black tabular-nums text-3xl " + (tone === "clover" ? "text-clover" : "text-foreground")}>
        {value}
      </dd>
    </div>
  );
}
