import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Shield, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { drawnCompetitionsQuery } from "@/lib/results-api";
import { formatDrawTime } from "@/lib/site-stats";

export const Route = createFileRoute("/results")({
  loader: ({ context }) => context.queryClient.ensureQueryData(drawnCompetitionsQuery),
  head: () => ({
    meta: [
      { title: "Results — every drawn competition | Lucky Git Comps" },
      {
        name: "description",
        content:
          "Every Lucky Git Comps competition that has been drawn: winning ticket number, winner and the draw timestamp. Verify any of them yourself.",
      },
      { property: "og:title", content: "Results — every drawn competition" },
      { property: "og:description", content: "Winning numbers, winners and verifiable draw records." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <Shell>
      <p role="alert" className="font-mono text-sm text-[var(--color-ink-red)]">{error.message}</p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell>
      <p className="font-mono text-sm text-muted-foreground">Nothing drawn yet.</p>
    </Shell>
  ),
  component: ResultsPage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-6 md:py-10 w-full flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function ResultsPage() {
  const { data: drawn } = useSuspenseQuery(drawnCompetitionsQuery);
  const real = drawn.filter((d) => !d.isDemo);
  const demo = drawn.filter((d) => d.isDemo);
  const hasReal = real.length > 0;
  // Examples vanish the moment a genuine draw lands. No manual step.
  const rows = hasReal ? real : demo;

  return (
    <Shell>
      <h1 className="font-display uppercase text-4xl md:text-5xl leading-[0.95] text-foreground">Results</h1>
      <p className="mt-2 text-muted-foreground text-sm max-w-xl">
        {hasReal ? (
          <>
            Every comp that's been drawn. Winning number, winner, timestamp — and the maths to
            check it, should you fancy it.{" "}
            <Link to="/past-draws" className="underline">Full draw log</Link>.
          </>
        ) : (
          <>No draws gone off yet — here's what results will look like when they do.</>
        )}
      </p>

      {rows.length === 0 ? (
        <div className="mt-10 border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] p-6">
          <p className="font-display uppercase text-xl">Nothing's been drawn yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            First timer hasn't hit zero. <Link to="/competitions" className="underline">Go and have a go</Link>.
          </p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {rows.map((d) => (
            <li
              key={d.drawId}
              className="border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]"
            >
              <div className="bg-[var(--color-ink-red)] text-[var(--color-paper)] px-3 py-1.5 flex items-baseline justify-between gap-2">
                <span className="font-display uppercase tracking-[0.14em] text-[11px] truncate">{d.title}</span>
                <span className="font-mono text-[10px] shrink-0">{formatDrawTime(d.drawnAt)}</span>
              </div>
              {d.image && (
                <div className="relative overflow-hidden border-b-[1.5px] border-[var(--color-ink-black)]">
                  <img
                    src={d.image}
                    alt={d.title}
                    loading="lazy"
                    className="h-40 w-full object-cover"
                    style={d.isDemo ? { filter: "saturate(0.6)" } : undefined}
                  />
                  {d.isDemo && (
                    <span
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] whitespace-nowrap border-2 border-[var(--color-ink-red)] bg-[var(--color-paper)]/85 px-6 py-1.5 font-display uppercase tracking-[0.2em] text-[13px] text-[var(--color-ink-red)]"
                    >
                      Example draw
                    </span>
                  )}
                </div>
              )}
              <div className="p-3 grid gap-3 sm:grid-cols-[auto_1fr_auto] items-center">
                <div>
                  <div className="label text-[9px]">Winning number</div>
                  <div className="font-display text-3xl tabular-nums leading-none">
                    {d.winningNumber} <span className="text-sm text-muted-foreground">/ {d.totalTickets}</span>
                  </div>
                </div>
                <div className="font-mono text-[12px] text-muted-foreground">
                  Winner: <b className="text-foreground">{d.isDemo ? "—" : d.winnerDisplayName}</b>
                  {d.isDemo && <span className="block">Example entry</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {d.slug && !d.isDemo && (
                    <Link
                      to="/competitions/$slug"
                      params={{ slug: d.slug }}
                      className="inline-flex items-center gap-1.5 border-2 border-[var(--color-ink-black)] bg-[var(--color-paper)] px-3 py-2 font-display uppercase tracking-[0.14em] text-[11px] hover:bg-[var(--color-ink-yellow)]"
                    >
                      The comp <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {d.isDemo ? (
                    <button
                      type="button"
                      disabled
                      title="Verification opens on real draws."
                      className="inline-flex cursor-not-allowed items-center gap-1.5 bg-[var(--color-ink-blue)]/40 text-[var(--color-paper)] px-3 py-2 font-display uppercase tracking-[0.14em] text-[11px]"
                    >
                      <Shield className="h-3.5 w-3.5" /> Verify
                    </button>
                  ) : (
                  <Link
                    to="/draws/$id/verify"
                    params={{ id: d.drawId }}
                    className="inline-flex items-center gap-1.5 bg-[var(--color-ink-blue)] text-[var(--color-paper)] px-3 py-2 font-display uppercase tracking-[0.14em] text-[11px] hover:bg-[var(--color-ink-black)]"
                  >
                    <Shield className="h-3.5 w-3.5" /> Verify
                  </Link>
                  )}
                </div>
              </div>
              {d.isDemo && (
                <p className="border-t border-dashed border-[var(--color-ink-black)]/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  This is how a result will look. No draw has taken place yet.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
