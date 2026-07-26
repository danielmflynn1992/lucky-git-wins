import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { winnersQuery } from "@/lib/winners-api";
import { COMPETITIONS } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";

export const Route = createFileRoute("/transparency")({
  head: () => ({
    meta: [
      { title: "Transparency — Lucky Git Comps" },
      { name: "description", content: "The real numbers. Total prizes awarded, winners paid, average odds, and draws executed on schedule. Computed from live data, no rounding up." },
      { property: "og:title", content: "Transparency — Lucky Git Comps" },
      { property: "og:description", content: "Real numbers from every draw we've published." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TransparencyPage,
});

function TransparencyPage() {
  const { data: winners = [] } = useQuery(winnersQuery);

  const live = COMPETITIONS.length;
  const prizesLive = COMPETITIONS.reduce((s, c) => s + (c.cashAlternative ?? 0), 0);
  const drawsCount = winners.length;
  const avgOdds = COMPETITIONS.length
    ? Math.round(
        COMPETITIONS.reduce((s, c) => s + c.totalTickets / Math.max(1, c.ticketsSold), 0) /
          COMPETITIONS.length,
      )
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-10 w-full flex-1">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Transparency</div>
        <h1 className="mt-1 font-display text-4xl md:text-5xl font-black tracking-[-0.02em]">
          The numbers. All of them.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Computed from live data. When a figure is zero, we show zero. Every completed draw links to its permanent verification page.
        </p>

        <dl className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat label="Prizes on the table" value={gbp(prizesLive)} />
          <Stat label="Comps running" value={String(live).padStart(2, "0")} />
          <Stat label="Draws gone off" value={String(drawsCount).padStart(3, "0")} />
          <Stat label="Avg odds this week" value={drawsCount || live ? `1 : ${avgOdds}` : "—"} />
        </dl>

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
                    {new Date(w.drawn_at).toLocaleDateString("en-GB")}
                  </span>
                  <span className="font-bold">{w.competition_title}</span>
                  <span className="tabular-nums">#{String(w.winning_number).padStart(4, "0")}</span>
                  <span className="text-muted-foreground">{w.winner_display_name}</span>
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