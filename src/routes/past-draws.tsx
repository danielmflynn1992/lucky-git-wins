import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

type Draw = {
  id: string;
  competition_id: string | null;
  competition_title: string;
  prize: string;
  winning_number: number;
  winner_display_name: string;
  winner_town: string;
  total_tickets: number;
  draw_method: string;
  verification_hash: string;
  notes: string;
  drawn_at: string;
};

const drawsQuery = queryOptions({
  queryKey: ["past-draws"],
  queryFn: async (): Promise<Draw[]> => {
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .order("drawn_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Draw[];
  },
});

export const Route = createFileRoute("/past-draws")({
  loader: ({ context }) => context.queryClient.ensureQueryData(drawsQuery),
  head: () => ({
    meta: [
      { title: "Past draws & winners — Lucky Git Comps" },
      {
        name: "description",
        content:
          "Public, dated log of every Lucky Git Comps prize draw with winning ticket numbers, winners and verification hashes.",
      },
      { property: "og:title", content: "Past draws & winners — Lucky Git Comps" },
      {
        property: "og:description",
        content: "Verify every past draw: date, winning number, prize and winner.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-16 flex-1">
        <h1 className="font-display text-3xl font-black">Past draws</h1>
        <p className="text-signal mt-2">Couldn't load the draws log: {error.message}</p>
      </main>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: () => <div>Not found</div>,
  component: PastDrawsPage,
});

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PastDrawsPage() {
  const { data: draws } = useSuspenseQuery(drawsQuery);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-10 w-full flex-1">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono uppercase tracking-widest text-clover">
            Public verification log
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black">
            Past draws &amp; winners
          </h1>
          <p className="text-foreground/70 max-w-2xl">
            Every completed draw, timestamped and hashed. Cross-check the winning
            number against your own tickets — the record here is the source of
            truth.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] font-mono uppercase tracking-widest text-foreground/50 border-b border-border">
            <div className="col-span-3">Drawn</div>
            <div className="col-span-4">Competition &amp; prize</div>
            <div className="col-span-2">Winning #</div>
            <div className="col-span-3">Winner</div>
          </div>

          {draws.length === 0 && (
            <div className="px-5 py-10 text-center text-foreground/60">
              No draws recorded yet. Check back after the next competition ends.
            </div>
          )}

          <ul className="divide-y divide-border">
            {draws.map((d) => (
              <li key={d.id} className="px-5 py-5">
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 md:col-span-3 font-mono text-sm text-foreground/80">
                    <div>{formatDate(d.drawn_at)}</div>
                    <div className="text-[11px] uppercase tracking-widest text-foreground/40 mt-1">
                      {d.draw_method}
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-4">
                    <div className="font-display text-lg font-bold leading-tight">
                      {d.competition_title}
                    </div>
                    <div className="text-sm text-foreground/70 mt-0.5">🏆 {d.prize}</div>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <div className="inline-flex items-baseline gap-1 rounded-md bg-clover/10 px-2.5 py-1 font-mono text-clover">
                      <span className="text-xs opacity-60">#</span>
                      <span className="text-lg font-bold tabular-nums">
                        {d.winning_number}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-foreground/40 mt-1">
                      of {d.total_tickets.toLocaleString()}
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-3">
                    <div className="font-bold">{d.winner_display_name}</div>
                    {d.winner_town && (
                      <div className="text-sm text-foreground/60">{d.winner_town}</div>
                    )}
                  </div>
                </div>

                {(d.verification_hash || d.notes) && (
                  <div className="mt-3 rounded-md bg-background/60 border border-border px-3 py-2 font-mono text-[11px] text-foreground/60 break-all">
                    {d.verification_hash && (
                      <div>
                        <span className="text-foreground/40">verify:</span>{" "}
                        {d.verification_hash}
                      </div>
                    )}
                    {d.notes && (
                      <div className="mt-1">
                        <span className="text-foreground/40">note:</span> {d.notes}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-xs text-foreground/50 max-w-2xl">
          Draws are executed automatically once the competition timer ends. The
          winning number, timestamp and hash are written to this log immediately
          and cannot be altered from the site.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}