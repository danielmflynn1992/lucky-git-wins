import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { liveOddsQueryOptions, IMAGES } from "@/lib/competitions-api";
import { gbp } from "@/lib/format";
import { NoDeadCompsBadge } from "@/components/NoDeadCompsBadge";
import { Countdown } from "@/components/Countdown";
import { TrendingDown } from "lucide-react";

export const Route = createFileRoute("/odds")({
  loader: ({ context }) => context.queryClient.ensureQueryData(liveOddsQueryOptions),
  head: () => ({
    meta: [
      { title: "Best odds live now — Lucky Git Comps" },
      { name: "description", content: "Every live competition ranked by current odds. Data-first, updated in real time. Bargain-hunters welcome." },
      { property: "og:title", content: "Best odds live now — Lucky Git Comps" },
      { property: "og:description", content: "Live leaderboard of current best odds." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: OddsLeaderboard,
});

function OddsLeaderboard() {
  const { data } = useSuspenseQuery(liveOddsQueryOptions);
  // Odds on a single ticket are 1 in (pool size). Smallest pool = best odds.
  // Ties broken by whichever closes first.
  const rows = [...data].sort(
    (a, b) => a.totalTickets - b.totalTickets || +new Date(a.endsAt) - +new Date(b.endsAt),
  );

  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-10 w-full flex-1">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover font-bold">Data · Live</div>
            <h1 className="mt-1 font-display text-4xl md:text-5xl font-black tracking-[-0.02em]">Best odds right now.</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Every live comp ranked by odds, best first. For the bargain hunters, the spreadsheet lot, and anyone who checks the price of a pint before ordering. The tables move — check back before you enter.
            </p>
          </div>
          <NoDeadCompsBadge variant="row" />
        </div>

        {rows.length === 0 ? (
          <div className="mt-12 rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
            No live comps at the moment. The next drop is on the way.
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            <div className="hidden md:grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3 border-b-2 border-[var(--color-ink-black)] text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground bg-muted/40">
              <div>Competition</div>
              <div className="text-right">Odds per ticket</div>
              <div className="text-right">Per ticket</div>
              <div className="text-right">Remaining</div>
              <div>Ends</div>
              <div />
            </div>
            <ul className="divide-y divide-border">
              {rows.map((r, i) => (
                <li
                  key={r.id}
                  className={
                    "relative grid md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-5 py-4 items-center " +
                    (i % 2 === 1 ? "bg-[color-mix(in_oklab,var(--color-ink-black)_5%,transparent)]" : "")
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-fair text-xl leading-none tabular-nums text-[var(--color-ink-red)] w-7 text-right">{i + 1}</span>
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                      {IMAGES[r.slug] ? (
                        <img src={IMAGES[r.slug]} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-clover">{r.category}</div>
                      <div className="font-display font-bold truncate">{r.title}</div>
                      {i === 0 && (
                        <span className="mt-1 inline-block border-2 border-[var(--color-ink-red)] px-1.5 py-0.5 font-display uppercase tracking-[0.14em] text-[9px] text-[var(--color-ink-red)] rotate-[-3deg]">
                          Best on the board
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="md:text-right">
                    <div className="md:hidden text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Odds</div>
                    <div className="inline-flex items-center gap-1 font-mono font-bold text-lg tabular-nums text-clover">
                      {i === 0 && <TrendingDown className="h-3.5 w-3.5" />}
                      1 in {r.totalTickets.toLocaleString()}
                    </div>
                  </div>
                  <div className="md:text-right">
                    <div className="md:hidden text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Per ticket</div>
                    <div className="font-display font-black tabular-nums">{gbp(r.pricePerTicket)}</div>
                  </div>
                  <div className="md:text-right">
                    <div className="md:hidden text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Remaining</div>
                    <div className="font-mono tabular-nums text-sm">{r.ticketsAvailable.toLocaleString()} / {r.totalTickets.toLocaleString()}</div>
                  </div>
                  <div>
                    <Countdown target={r.endsAt} compact />
                  </div>
                  <div>
                    <Link
                      to="/competitions/$slug"
                      params={{ slug: r.slug }}
                      className="inline-flex items-center rounded-md bg-clover text-primary-foreground px-3 py-2 text-xs font-display font-extrabold uppercase tracking-wider hover:bg-clover-deep"
                    >
                      Enter →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground max-w-2xl">
          One ticket's odds of winning are <span className="font-mono">1 in (total tickets in the pool)</span> — and the pool never goes above 499. Selling out doesn't change your odds, it just means there's none left, so "remaining" is urgency, not maths. Ties are broken by the earliest close time. Everything here draws automatically the moment it ends — see <Link to="/promise" className="text-clover font-semibold hover:underline">the 499 Promise</Link>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}