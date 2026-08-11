import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Shield, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Countdown } from "@/components/Countdown";
import { demoCompsQuery, type DemoComp } from "@/lib/demo-api";
import { ExampleBanner, DEMO_WINNER_NAME } from "@/lib/demo";
import { formatDrawTime } from "@/lib/site-stats";
import { gbp } from "@/lib/format";

export const Route = createFileRoute("/demo")({
  loader: ({ context }) => context.queryClient.ensureQueryData(demoCompsQuery),
  head: () => ({
    meta: [
      { title: "Example competitions — the pipeline, running | Lucky Git Comps" },
      {
        name: "description",
        content:
          "Example competitions running the real Lucky Git Comps pipeline end to end: on sale, closing, automatically drawn and independently verifiable. No prizes are awarded.",
      },
      { property: "og:title", content: "Example competitions — the pipeline, running" },
      { property: "og:description", content: "Real draw pipeline. Example prizes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ({ error }) => (
    <Shell>
      <p role="alert" className="font-mono text-sm text-[var(--color-ink-red)]">{error.message}</p>
    </Shell>
  ),
  notFoundComponent: () => (
    <Shell><p className="font-mono text-sm text-muted-foreground">No examples running.</p></Shell>
  ),
  component: DemoPage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-6 md:py-10 w-full flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function DemoPage() {
  const { data: comps } = useSuspenseQuery(demoCompsQuery);
  const live = comps.filter((c) => c.phase === "live");
  const drawing = comps.filter((c) => c.phase === "drawing");
  const drawn = comps.filter((c) => c.phase === "drawn");

  return (
    <Shell>
      <h1 className="font-display uppercase text-4xl md:text-5xl leading-[0.95]">Examples</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Example competitions run the same code as the real thing: entries, close, automatic draw,
        sealed seed, published hash, verifiable result. The only thing that isn't real is the prize.
      </p>
      <div className="mt-4">
        <ExampleBanner />
      </div>

      <Section title="On sale" count={live.length}>
        {live.map((c) => <Row key={c.id} c={c} />)}
      </Section>
      <Section title="Closed — drawing" count={drawing.length}>
        {drawing.map((c) => <Row key={c.id} c={c} />)}
      </Section>
      <Section title="Drawn" count={drawn.length}>
        {drawn.map((c) => <Row key={c.id} c={c} />)}
      </Section>
    </Shell>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display uppercase tracking-[0.14em] text-[13px] text-muted-foreground">
        {title} <span className="tabular-nums">({count})</span>
      </h2>
      {count === 0 ? (
        <p className="mt-2 font-mono text-[12px] text-muted-foreground">Nothing in this state right now.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">{children}</ul>
      )}
    </section>
  );
}

function Row({ c }: { c: DemoComp }) {
  return (
    <li className="border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
      <div className="bg-[var(--color-ink-red)] text-[var(--color-paper)] px-3 py-1.5 flex items-baseline justify-between gap-2">
        <span className="font-display uppercase tracking-[0.14em] text-[11px] truncate">
          {c.title}{c.isRolling && " · daily"}
        </span>
        <span className="font-mono text-[10px] shrink-0">
          {c.phase === "drawn" ? formatDrawTime(c.drawnAt) : formatDrawTime(c.endsAt)}
        </span>
      </div>
      <div className="p-3 grid gap-3 sm:grid-cols-[1fr_auto] items-center">
        <div className="font-mono text-[12px] text-muted-foreground">
          {c.ticketsSold} / {c.totalTickets} entries · {gbp(c.pricePerTicket)} a go
          {c.phase === "live" && (
            <span className="mt-1 block">
              <Countdown target={c.endsAt} compact />
            </span>
          )}
          {c.phase === "drawn" && (
            <span className="block">
              Winning number <b className="text-foreground tabular-nums">{c.winningNumber}</b> · winner{" "}
              {DEMO_WINNER_NAME} (Example entry)
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/competitions/$slug"
            params={{ slug: c.slug }}
            className="inline-flex items-center gap-1.5 border-[1.5px] border-[var(--color-ink-black)] px-3 py-2 font-display uppercase tracking-[0.14em] text-[11px]"
          >
            View <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          {c.drawId && (
            <Link
              to="/draws/$id/verify"
              params={{ id: c.drawId }}
              className="inline-flex items-center gap-1.5 bg-[var(--color-ink-blue)] text-[var(--color-paper)] px-3 py-2 font-display uppercase tracking-[0.14em] text-[11px]"
            >
              <Shield className="h-3.5 w-3.5" /> Verify
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
