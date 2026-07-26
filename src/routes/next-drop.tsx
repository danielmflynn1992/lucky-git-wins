import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Countdown } from "@/components/Countdown";
import { dropScheduleQuery, nextDropAt, scheduleSummary, DEFAULT_SCHEDULE } from "@/lib/drop-schedule";

export const Route = createFileRoute("/next-drop")({
  head: () => ({
    meta: [
      { title: "Next drop — Lucky Git Comps" },
      { name: "description", content: "New comps land Monday, Wednesday and Friday at 20:00. Join the queue, watch the countdown, scratch the teaser." },
      { property: "og:title", content: "Next drop — Lucky Git Comps" },
      { property: "og:description", content: "Countdown to the next drop of competitions." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: NextDropPage,
});

function NextDropPage() {
  const { data: schedule = DEFAULT_SCHEDULE } = useQuery(dropScheduleQuery);
  const next = nextDropAt(schedule);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-10 w-full flex-1">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Drop schedule</div>
        <h1 className="mt-1 font-display text-4xl md:text-5xl font-black tracking-[-0.02em]">
          Next drop.
        </h1>
        <p className="mt-3 text-muted-foreground font-mono text-sm">{scheduleSummary(schedule)}</p>

        <div className="mt-8 border-2 border-ink bg-card p-6 text-center">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Doors open in</div>
          <div className="mt-2 text-4xl md:text-6xl font-display font-black tabular-nums">
            {next ? <Countdown endsAt={next.toISOString()} /> : "—"}
          </div>
        </div>

        <div className="mt-8">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-2">Teaser</div>
          <div className="relative border-2 border-ink bg-card min-h-[220px] flex items-center justify-center overflow-hidden">
            {!revealed && (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                aria-label="Reveal next drop teaser"
                className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#c8c8c8,#8a8a8a)] text-ink font-display uppercase tracking-[0.2em] text-sm"
              >
                Scratch to reveal
              </button>
            )}
            {revealed && (
              <div className="p-8 text-center">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Coming next</div>
                <div className="mt-2 font-display text-2xl md:text-3xl font-black">Something worth a look.</div>
                <p className="mt-2 text-sm text-muted-foreground font-mono">Full reveal at the top of the hour.</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] font-mono text-muted-foreground">
            Prefer a keyboard? <button onClick={() => setRevealed((r) => !r)} className="underline">{revealed ? "Hide" : "Reveal"} teaser</button>.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link to="/competitions" className="underline font-mono text-sm">See what's already live →</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}