import { createFileRoute } from "@tanstack/react-router";
import { CompCard } from "@/components/CompCard";
import { COMPETITIONS } from "@/lib/mock-comps";
import type { Competition } from "@/lib/mock-comps";

export const Route = createFileRoute("/dev/compcard")({
  component: CompCardShowcase,
  head: () => ({
    meta: [
      { title: "CompCard Visual Regression" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

// Fixed widths mirror the real grid at key breakpoints so future CSS changes
// that would clip the Enter Now / Add buttons show up here immediately.
const WIDTHS = [
  { label: "mobile-2col (≈195px)", px: 195 },
  { label: "mobile-2col-tight (≈175px)", px: 175 },
  { label: "tablet-3col (≈240px)", px: 240 },
  { label: "desktop-3col (≈360px)", px: 360 },
];

// Force worst-case label lengths & badges so layout regressions surface.
const base = COMPETITIONS[0];
const VARIANTS: Competition[] = [
  { ...base, slug: "vr-short", title: "Short title", instantWin: false, ticketsSold: 10, totalTickets: 100 },
  { ...base, slug: "vr-long", title: "Extremely long competition title that wraps to two lines easily", instantWin: true, ticketsSold: 95, totalTickets: 100 },
  { ...base, slug: "vr-almost", title: "Almost gone prize", instantWin: true, ticketsSold: 990, totalTickets: 1000 },
];

function CompCardShowcase() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-10">
      <header>
        <h1 className="font-display text-2xl font-extrabold">CompCard Visual Regression</h1>
        <p className="text-sm text-muted-foreground max-w-2xl mt-1">
          Renders <code>CompCard</code> at the container widths it hits across breakpoints.
          The Enter Now and + Add buttons must never overflow their column.
          Automated check: <code>tests/visual/compcard.spec.ts</code>.
        </p>
      </header>

      {WIDTHS.map((w) => (
        <section key={w.label} data-vr-width={w.px}>
          <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-3">{w.label}</h2>
          <div className="flex flex-wrap gap-4">
            {VARIANTS.map((c) => (
              <div key={c.slug} style={{ width: w.px }} data-vr-card={c.slug}>
                <CompCard c={c} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}