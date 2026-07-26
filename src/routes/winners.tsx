import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES } from "@/lib/competitions-api";

type WinnerRow = {
  id: string;
  competition_title: string;
  prize: string;
  winning_number: number;
  winner_display_name: string;
  winner_town: string;
  drawn_at: string;
  image: string | null;
};

const winnersQuery = queryOptions({
  queryKey: ["winners"],
  queryFn: async (): Promise<WinnerRow[]> => {
    const { data, error } = await supabase
      .from("draws")
      .select("id, competition_id, competition_title, prize, winning_number, winner_display_name, winner_town, drawn_at, competitions(slug, image)")
      .order("drawn_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d: {
      id: string;
      competition_title: string;
      prize: string;
      winning_number: number;
      winner_display_name: string;
      winner_town: string;
      drawn_at: string;
      competitions: { slug: string; image: string } | null;
    }) => {
      const slug = d.competitions?.slug;
      const image = (slug && IMAGES[slug]) || d.competitions?.image || null;
      return {
        id: d.id,
        competition_title: d.competition_title,
        prize: d.prize,
        winning_number: d.winning_number,
        winner_display_name: d.winner_display_name,
        winner_town: d.winner_town,
        drawn_at: d.drawn_at,
        image,
      };
    });
  },
});

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
  const { data: winners } = useSuspenseQuery(winnersQuery);
  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-10 w-full flex-1">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover">Verified · Drawn · Paid out</div>
        <h1 className="mt-2 font-display text-5xl md:text-7xl font-semibold tracking-[-0.03em]">
          <span className="text-gradient-mint">Smug Gits.</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl">
          Every winner from every completed draw. Names, prizes, and the actual thing they took home. If you'd like to join this wall of insufferable smugness, the tickets are that way.
        </p>

        {winners.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-surface px-6 py-16 text-center text-muted-foreground">
            No winners yet — the first draw hasn't landed. Check back after the next competition closes.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {winners.map((w) => (
              <article
                key={w.id}
                className="group flex flex-col rounded-xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-[5/4] overflow-hidden bg-muted">
                  {w.image ? (
                    <img
                      src={w.image}
                      alt={w.prize}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-clover">Winner</div>
                      <div className="font-display font-bold text-lg leading-tight truncate">{w.winner_display_name}</div>
                      {w.winner_town && (
                        <div className="text-sm text-muted-foreground truncate">from {w.winner_town}</div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Ticket</div>
                      <div className="font-mono tabular-nums font-bold text-clover">#{w.winning_number}</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Won</div>
                    <div className="font-semibold text-foreground leading-tight">{w.prize}</div>
                    <div className="text-xs text-muted-foreground mt-1">{w.competition_title} · {formatWhen(w.drawn_at)}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}