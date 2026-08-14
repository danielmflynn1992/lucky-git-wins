import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LayoutGrid, List } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CompCard } from "@/components/CompCard";
import { CompRow } from "@/components/CompRow";
import { allCompetitionsQueryOptions } from "@/lib/competitions-api";
import { UnmarkedStub } from "@/components/EmptyBasketScene";
import { pinDrawingFirst } from "@/lib/site-stats";

type SortKey = "ending-soon" | "highest-prize" | "best-odds" | "lowest-price" | "hot";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "ending-soon", label: "Ending Soon" },
  { key: "highest-prize", label: "Highest Prize" },
  { key: "best-odds", label: "Best Odds" },
  { key: "lowest-price", label: "Lowest Price" },
  { key: "hot", label: "Hot" },
];

export const Route = createFileRoute("/competitions/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(allCompetitionsQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "All Live Competitions — Lucky Git Comps" },
      { name: "description", content: "Every live prize competition on Lucky Git Comps — cars, tech, cash and holidays from £1." },
      { property: "og:title", content: "All Live Competitions — Lucky Git Comps" },
      { property: "og:description", content: "Every live prize on Lucky Git Comps." },
    ],
  }),
  component: () => (
    <CompetitionsPage />
  ),
});

function CompetitionsPage() {
  const { data: COMPETITIONS } = useSuspenseQuery(allCompetitionsQueryOptions);
  const CATEGORIES = useMemo(
    () => [...new Set(COMPETITIONS.map((c) => c.category))],
    [COMPETITIONS],
  );
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("ending-soon");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  // Same rule as the homepage: controls appear once there are 4+ live comps.
  const showControls = COMPETITIONS.length >= 4;
  const sorted = useMemo(() => {
    const arr = COMPETITIONS.filter((c) => (activeCat ? c.category === activeCat : true));
    switch (sort) {
      case "ending-soon":
        return pinDrawingFirst(arr.sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt)));
      case "highest-prize":
        return pinDrawingFirst(arr.sort((a, b) => b.cashAlternative - a.cashAlternative));
      case "best-odds":
        return pinDrawingFirst(
          arr.sort((a, b) => a.totalTickets - a.ticketsSold - (b.totalTickets - b.ticketsSold)),
        );
      case "lowest-price":
        return pinDrawingFirst(arr.sort((a, b) => a.pricePerTicket - b.pricePerTicket));
      case "hot":
        return pinDrawingFirst(arr.sort((a, b) => Number(!!b.hot) - Number(!!a.hot)));
      default:
        return pinDrawingFirst(arr);
    }
  }, [sort, activeCat, COMPETITIONS]);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-4 md:py-6 w-full">
        <h1 className="font-display font-black text-foreground">Live Competitions</h1>
        <p className="text-muted-foreground mt-1 text-base leading-[1.55] max-w-[34ch]">All the current lot. Sort them, filter them, buy the lot.</p>
        {showControls && (
        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {["All", ...CATEGORIES].map((c) => {
              const active = c === "All" ? activeCat === null : activeCat === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCat(c === "All" ? null : (active ? null : c))}
                  className={
                    "whitespace-nowrap border-2 border-[var(--color-ink-black)] px-3 py-1 text-[11px] font-body font-bold uppercase tracking-[0.14em] transition-colors " +
                    (active
                      ? "bg-[var(--color-ink-blue)] text-[var(--color-paper)]"
                      : "bg-[var(--color-paper-raised)] text-[var(--color-ink-black)] hover:bg-[var(--color-ink-yellow)]")
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SortSelect value={sort} onChange={setSort} />
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
        )}
        {!showControls ? (
          sorted.length === 0 ? (
            <EmptyStall />
          ) : (
            <div className="mt-8 flex flex-col gap-3">
              {sorted.map((c) => (
                <div key={c.slug} className="mx-auto w-full max-w-2xl">
                  <CompCard c={c} />
                </div>
              ))}
            </div>
          )
        ) : view === "grid" ? (
          sorted.length === 0 ? (
            <EmptyStall />
          ) : (
            <div className="mt-8 grid gap-3 sm:gap-5 grid-cols-2 md:grid-cols-3 items-stretch">
              {sorted.map((c) => (
                <div key={c.slug} className="h-full">
                  <CompCard c={c} />
                </div>
              ))}
            </div>
          )
        ) : (
          sorted.length === 0 ? (
            <EmptyStall />
          ) : (
            <div className="mt-8 flex flex-col gap-2">
              {sorted.map((c) => <CompRow key={c.slug} c={c} />)}
            </div>
          )
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function EmptyStall() {
  return (
    <div className="mt-6 text-center py-6">
      <UnmarkedStub compact />
      <p className="mt-4 font-mono text-[13px] uppercase tracking-[0.12em] text-[var(--color-ink-black)]">
        Stall's empty. Back Monday.
      </p>
      <p className="caption-micro mt-1">Nothing doing. Try something else.</p>
    </div>
  );
}

export function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <label className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="text-[11px] font-body font-bold uppercase tracking-[0.16em] text-[var(--color-ink-black)]/70">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="border-2 border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] px-3 py-1 text-[11px] font-body font-bold uppercase tracking-[0.14em] text-[var(--color-ink-black)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-blue)]"
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>
    </label>
  );
}

export function ViewToggle({ view, onChange }: { view: "grid" | "list"; onChange: (v: "grid" | "list") => void }) {
  return (
    <div className="inline-flex border-2 border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
      <button
        onClick={() => onChange("grid")}
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-body font-bold uppercase tracking-[0.14em] transition-colors ${
          view === "grid"
            ? "bg-[var(--color-ink-blue)] text-[var(--color-paper)]"
            : "text-[var(--color-ink-black)]/70 hover:text-[var(--color-ink-black)]"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" /> Grid
      </button>
      <button
        onClick={() => onChange("list")}
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-body font-bold uppercase tracking-[0.14em] transition-colors ${
          view === "list"
            ? "bg-[var(--color-ink-blue)] text-[var(--color-paper)]"
            : "text-[var(--color-ink-black)]/70 hover:text-[var(--color-ink-black)]"
        }`}
      >
        <List className="h-3.5 w-3.5" /> List
      </button>
    </div>
  );
}