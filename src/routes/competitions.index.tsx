import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CompCard } from "@/components/CompCard";
import { CompRow } from "@/components/CompRow";
import { COMPETITIONS, CATEGORIES } from "@/lib/mock-comps";

type SortKey = "ending-soon" | "highest-prize" | "best-odds" | "lowest-price" | "hot";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "ending-soon", label: "Ending Soon" },
  { key: "highest-prize", label: "Highest Prize" },
  { key: "best-odds", label: "Best Odds" },
  { key: "lowest-price", label: "Lowest Price" },
  { key: "hot", label: "Hot" },
];

export const Route = createFileRoute("/competitions/")({
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
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("ending-soon");
  const [activeCat, setActiveCat] = useState<(typeof CATEGORIES)[number] | null>(null);
  const sorted = useMemo(() => {
    const arr = COMPETITIONS.filter((c) => (activeCat ? c.category === activeCat : true));
    switch (sort) {
      case "ending-soon":
        return arr.sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt));
      case "highest-prize":
        return arr.sort((a, b) => b.cashAlternative - a.cashAlternative);
      case "best-odds":
        return arr.sort(
          (a, b) => a.totalTickets - a.ticketsSold - (b.totalTickets - b.ticketsSold),
        );
      case "lowest-price":
        return arr.sort((a, b) => a.pricePerTicket - b.pricePerTicket);
      case "hot":
        return arr.sort((a, b) => Number(!!b.hot) - Number(!!a.hot));
      default:
        return arr;
    }
  }, [sort, activeCat]);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12 w-full">
        <h1 className="font-display text-4xl md:text-5xl font-black text-foreground">Live Competitions</h1>
        <p className="text-muted-foreground mt-1">All the current lot. Sort them, filter them, buy the lot.</p>
        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => {
              const active = activeCat === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCat(active ? null : c)}
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
        {view === "grid" ? (
          <div className="mt-8 grid gap-3 sm:gap-5 grid-cols-2 md:grid-cols-3 items-stretch">
            {sorted.map((c) => (
              <div key={c.slug} className="h-full">
                <CompCard c={c} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-2">
            {sorted.map((c) => <CompRow key={c.slug} c={c} />)}
          </div>
        )}
      </main>
      <SiteFooter />
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