import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CompCard } from "@/components/CompCard";
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
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12 w-full">
        <h1 className="font-display text-4xl md:text-5xl font-black">Live Competitions</h1>
        <p className="text-muted-foreground mt-1">All the current lot. Sort them, filter them, buy the lot.</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <span key={c} className="rounded-full bg-white border-2 border-ink/10 px-3 py-1 text-xs font-bold">{c}</span>
          ))}
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COMPETITIONS.map((c) => <CompCard key={c.slug} c={c} />)}
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});