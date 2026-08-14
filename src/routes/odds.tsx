import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { allCompetitionsQueryOptions, IMAGES } from "@/lib/competitions-api";
import { gbp } from "@/lib/format";
import { NoDeadCompsBadge } from "@/components/NoDeadCompsBadge";
import { Countdown } from "@/components/Countdown";
import { isClosed, MAX_POOL } from "@/lib/site-stats";
import { TrendingDown } from "lucide-react";

export const Route = createFileRoute("/odds")({
  loader: ({ context }) => context.queryClient.ensureQueryData(allCompetitionsQueryOptions),
  head: () => ({
    meta: [
      { title: "Best odds live now — Lucky Git Comps" },
      { name: "description", content: "Every live competition ranked by tickets remaining and time left. Pools are capped, so one ticket is never worse than 1 in 499." },
      { property: "og:title", content: "Best odds live now — Lucky Git Comps" },
      { property: "og:description", content: "Live leaderboard: tickets remaining against time left." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: OddsLeaderboard,
});

function OddsLeaderboard() {
  const { data } = useSuspenseQuery(allCompetitionsQueryOptions);

  // Same table, same rows, same numbers as the homepage grid. Closed comps
  // never appear on a board about entering.
  const rows = data
    .filter((c) => !isClosed(c.endsAt))
    .map((c) => ({
      ...c,
      remaining: Math.max(0, c.totalTickets - c.ticketsSold),
      msLeft: Math.max(0, +new Date(c.endsAt) - Date.now()),
    }))
    // Ranked by how few tickets are left against how little time is left:
    // the fewer remaining and the sooner it closes, the higher it sits.
    .sort((a, b) => a.remaining * a.msLeft - b.remaining * b.msLeft);

  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-10 w-full flex-1">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover font-bold">Data · Live</div>
            <h1 className="mt-1 font-display text-4xl md:text-5xl font-black tracking-[-0.02em]">Best odds right now.</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              One ticket is <b>1 in {MAX_POOL}</b>. Always. That's the promise, and it doesn't move
              with how many have sold. What does move is how many are left and how long you've got —
              so that's what this board ranks. Board's live, so check it before you commit.
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
            <div className="hidden md:grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-3 border-b-2 border-[var(--color-ink-black)] text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground bg-muted/40">
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
                  key={r.slug}
                  className={
                    "relative grid md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-4 px-5 py-4 items-center " +
                    (i % 2 === 1 ? "bg-[color-mix(in_oklab,var(--color-ink-black)_5%,transparent)]" : "")
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-fair text-xl leading-none tabular-nums text-[var(--color-ink-red)] w-7 text-right">{i + 1}</span>
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                      {(r.thumbUrl || r.image || IMAGES[r.slug]) ? (
                        <img src={r.thumbUrl || r.image || IMAGES[r.slug]} alt="" className="h-full w-full object-cover" loading="lazy" />
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
                    <div className="font-mono tabular-nums text-sm">{r.remaining.toLocaleString()} of {r.totalTickets.toLocaleString()} remaining</div>
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
          One ticket's odds of winning are <span className="font-mono">1 in {MAX_POOL}</span> — the pool never
          goes above {MAX_POOL}, and selling out doesn't change your odds, it just means there's none left. Ranking here is
          tickets remaining weighed against time left. Everything draws automatically the moment it ends — see{" "}
          <Link to="/promise" className="text-clover font-semibold hover:underline">the 499 Promise</Link>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
