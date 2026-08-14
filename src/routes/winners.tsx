import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { WinnerCard } from "@/components/WinnerCard";
import { winnersQuery, realOnly } from "@/lib/winners-api";

export const Route = createFileRoute("/winners")({
  loader: ({ context }) => context.queryClient.ensureQueryData(winnersQuery),
  head: () => ({
    meta: [
      { title: "Winners Wall — Lucky Git Comps" },
      { name: "description", content: "Every verified winner of a Lucky Git Comps prize draw. Real gits, real prizes, real handshakes." },
      { property: "og:title", content: "Winners Wall — Lucky Git Comps" },
      { property: "og:description", content: "Real winners. Real prizes." },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-16 flex-1">
        <h1 className="font-display text-3xl font-black">Winners Wall</h1>
        <p className="text-signal mt-2">Couldn't load winners: {error.message}</p>
      </main>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: () => <div>Not found</div>,
  component: WinnersPage,
});

function WinnersPage() {
  const { data: allWinners } = useSuspenseQuery(winnersQuery);
  // Real draws only. An empty wall is honest; a fabricated one is not.
  const winners = realOnly(allWinners);
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="mx-auto w-full max-w-[720px] px-4 py-10 flex-1">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover">Verified · Drawn · Paid out</div>
        <h1 className="mt-2 font-display text-5xl md:text-7xl font-semibold tracking-[-0.03em]">
          <span className="text-gradient-mint">Smug Gits.</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl">
          Every winner from every completed draw. Names, prizes, and the actual thing they took home. If you'd like to join this wall of insufferable smugness, the tickets are that way.
        </p>

        {winners.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-surface px-6 py-16 text-center text-muted-foreground">
            Our first winners will appear here — and you'll be able to check every single draw.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {winners.map((w) => (
              <WinnerCard
                key={w.id}
                w={w}
                expanded={openId === w.id}
                onToggle={(id) => setOpenId((cur) => (cur === id ? null : id))}
              />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}