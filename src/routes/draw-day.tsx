import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CompCard } from "@/components/CompCard";
import { Countdown } from "@/components/Countdown";
import { allCompetitionsQueryOptions } from "@/lib/competitions-api";
import { winnersQuery } from "@/lib/winners-api";
import { Perforation } from "@/components/Perforation";

export const Route = createFileRoute("/draw-day")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(allCompetitionsQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Draw Day — Lucky Git Comps" },
      { name: "description", content: "Gates open at the next draw time. Every comp closing today, drawn automatically, results posted on the spot." },
      { property: "og:title", content: "Draw Day — Lucky Git Comps" },
      { property: "og:description", content: "No delays, no warm-up act." },
      { property: "og:type", content: "website" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-24 flex-1 text-center">
        <h1 className="font-display text-3xl font-black">Draw day's having a moment.</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </main>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Nothing here.</div>,
  component: DrawDay,
});

/** The next draw is simply the next competition close — draws fire on close. */
export function nextDrawAt(comps: { endsAt: string }[], now = Date.now()): Date | null {
  const upcoming = comps
    .map((c) => new Date(c.endsAt))
    .filter((d) => d.getTime() > now)
    .sort((a, b) => a.getTime() - b.getTime());
  return upcoming[0] ?? null;
}

const timeLabel = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function DrawDay() {
  const { data: comps } = useSuspenseQuery(allCompetitionsQueryOptions);
  const { data: winners = [] } = useQuery(winnersQuery);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const next = nextDrawAt(comps, now);
  const msToNext = next ? next.getTime() - now : null;
  const doorsOpening = msToNext !== null && msToNext <= 10 * 60_000;
  const closingWithNext = next
    ? comps.filter((c) => new Date(c.endsAt).toDateString() === next.toDateString())
    : [];

  // Results board: anything drawn in the last 24 hours.
  const recent = winners.filter((w) => now - new Date(w.drawn_at).getTime() < 24 * 3600_000);

  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-10 w-full flex-1">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--color-ink-red)] font-bold">
          Draw day
        </div>

        {next ? (
          <>
            <h1
              className="mt-1 font-display uppercase leading-[0.9] tracking-[0.01em]"
              style={{ fontSize: doorsOpening ? "clamp(3rem, 12vw, 7rem)" : "clamp(2.5rem, 8vw, 5rem)" }}
            >
              Gates open {timeLabel(next)}.
            </h1>
            <div className="mt-4 font-mono tabular-nums text-lg">
              <Countdown target={next.toISOString()} />
            </div>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-ink-grey)]">
              {next.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>

            {doorsOpening && (
              <div className="mt-5 border-2 border-[var(--color-ink-red)] bg-[var(--color-paper-raised)] px-4 py-3 motion-safe:animate-pulse">
                <p className="font-display uppercase tracking-[0.06em] text-base">
                  Draw's at {timeLabel(next)}. No delays, no warm-up act. The machine doesn't do encores either.
                </p>
              </div>
            )}

            <div className="mt-8">
              <Perforation color="var(--color-ink-black)" />
            </div>

            <h2 className="mt-8 font-display text-2xl uppercase">Closing today</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {closingWithNext.map((c) => (
                <CompCard key={c.slug} c={c} />
              ))}
            </div>
          </>
        ) : (
          <h1 className="mt-1 font-display uppercase leading-[0.9]" style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}>
            That's your lot.
          </h1>
        )}

        {recent.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl uppercase">
              {next ? "Last 24 hours" : "That's your lot."}
            </h2>
            {!next && (
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-[var(--color-ink-grey)]">
                Next gates open when the next comp closes.
              </p>
            )}
            <ul className="mt-4 divide-y divide-border border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
              {recent.map((w) => (
                <li key={w.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <span className="font-display uppercase">{w.competition_title}</span>
                  <span className="font-mono text-xs tabular-nums">
                    #{w.winning_number} · {w.winner_display_name}
                    {w.winner_town ? ` · ${w.winner_town}` : ""}
                  </span>
                  <Link to="/draws/$id/reveal" params={{ id: w.id }} className="font-mono text-xs underline text-[var(--color-ink-blue)]">
                    Watch the reveal →
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Entered one of these? Your own result — including how close you got — is on the competition page.
            </p>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}