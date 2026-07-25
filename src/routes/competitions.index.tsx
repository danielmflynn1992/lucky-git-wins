import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CompCard } from "@/components/CompCard";
import { CompRow } from "@/components/CompRow";
import { COMPETITIONS, CATEGORIES } from "@/lib/mock-comps";

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
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12 w-full">
        <h1 className="font-display text-4xl md:text-5xl font-black text-foreground">Live Competitions</h1>
        <p className="text-muted-foreground mt-1">All the current lot. Sort them, filter them, buy the lot.</p>
        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <span key={c} className="rounded-full bg-card border border-border px-3 py-1 text-xs font-bold text-foreground/80">{c}</span>
            ))}
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
        {view === "grid" ? (
          <div className="mt-8 grid gap-5 grid-cols-1 sm:grid-cols-2">
            {COMPETITIONS.map((c) => <CompCard key={c.slug} c={c} />)}
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-2">
            {COMPETITIONS.map((c) => <CompRow key={c.slug} c={c} />)}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

export function ViewToggle({ view, onChange }: { view: "grid" | "list"; onChange: (v: "grid" | "list") => void }) {
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5 shadow-sm">
      <button
        onClick={() => onChange("grid")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
          view === "grid" ? "bg-ink text-cream" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" /> Grid
      </button>
      <button
        onClick={() => onChange("list")}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
          view === "list" ? "bg-ink text-cream" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List className="h-3.5 w-3.5" /> List
      </button>
    </div>
  );
}