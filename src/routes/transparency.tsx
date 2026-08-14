import { publicWinnerName } from "@/lib/winner-name";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { winnersQuery, realOnly } from "@/lib/winners-api";
import { useSiteStats, formatCloseDate } from "@/lib/site-stats";
import { gbp, ukDate } from "@/lib/format";
import { POOL_CAP_LINE } from "@/lib/promises";

export const Route = createFileRoute("/transparency")({
  head: () => ({
    meta: [
      { title: "Transparency — Lucky Git Comps" },
      { name: "description", content: "The real numbers. Prizes on the table, comps running, draws completed and average sell-through. Computed from live data, no rounding up." },
      { property: "og:title", content: "Transparency — Lucky Git Comps" },
      { property: "og:description", content: "Real numbers from every draw we've published." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TransparencyPage,
});

function TransparencyPage() {
  const { data: allWinners = [] } = useQuery(winnersQuery);
  const winners = realOnly(allWinners);
  const stats = useSiteStats();

  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-10 w-full flex-1">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Transparency</div>
        <h1 className="mt-1 font-display text-4xl md:text-5xl font-black tracking-[-0.02em]">
          The numbers. All of them.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Computed from live data, from the same tables the rest of the site reads. When a figure is
          zero, we show zero. Every completed draw links to its permanent verification page.
        </p>

        <dl className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat label="Prizes on the table" value={gbp(stats.prizesOnTable)} />
          <Stat label="Comps running" value={String(stats.compsLive).padStart(2, "0")} />
          <Stat
            label={stats.drawsCompleted ? "Draws gone off" : "First draw"}
            value={stats.drawsCompleted ? String(stats.drawsCompleted).padStart(3, "0") : formatCloseDate(stats.nextCloseAt)}
          />
          <Stat label="Pool cap" value="Max 499" />
        </dl>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {POOL_CAP_LINE}
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-black">Every completed draw</h2>
          {winners.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground font-mono">
              No draws published yet. This list fills up automatically the moment a comp closes.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {winners.map((w) => (
                <li key={w.id} className="py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-sm">
                  <span className="tabular-nums text-muted-foreground">
                    {ukDate(w.drawn_at)}
                  </span>
                  <span className="font-bold">{w.competition_title}</span>
                  {w.isDemo && (
                    <span className="border border-[var(--color-ink-red)] px-1 text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-red)]">
                      Demo data
                    </span>
                  )}
                  <span className="tabular-nums">#{String(w.winning_number).padStart(4, "0")}</span>
                  <span className="text-muted-foreground">{publicWinnerName(w.winner_display_name, w.winning_number)}</span>
                  <Link to="/draws/$id/reveal" params={{ id: w.id }} className="ml-auto underline text-clover">
                    verify →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t-2 border-ink pt-3">
      <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display font-black tabular-nums text-3xl">{value}</dd>
    </div>
  );
}
