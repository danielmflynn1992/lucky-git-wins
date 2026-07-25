import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo } from "react";
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

const PRIZE_TYPES = ["Car", "Cash", "Watch", "Tech", "Holiday", "Other"] as const;
type PrizeType = (typeof PRIZE_TYPES)[number];

function classifyPrize(prize: string): PrizeType {
  const p = prize.toLowerCase();
  if (/(car|range rover|bmw|audi|porsche|mercedes|tesla|ford|golf|supra|m3|m4|rs\d)/.test(p)) return "Car";
  if (/(cash|£|gbp|money|payout)/.test(p)) return "Cash";
  if (/(rolex|omega|watch|tag heuer|patek|audemars)/.test(p)) return "Watch";
  if (/(iphone|macbook|ipad|playstation|ps5|xbox|tv|laptop|airpods|tech|console)/.test(p)) return "Tech";
  if (/(holiday|trip|villa|cruise|getaway|ibiza|dubai|maldives)/.test(p)) return "Holiday";
  return "Other";
}

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  comp: fallback(z.string(), "").default(""),
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
  type: fallback(z.string(), "").default(""),
  num: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/past-draws")({
  validateSearch: zodValidator(searchSchema),
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
  const { q, comp, from, to, type, num } = Route.useSearch();
  const navigate = useNavigate({ from: "/past-draws" });

  type SearchState = { q: string; comp: string; from: string; to: string; type: string; num: string };
  const setParam = (key: keyof SearchState, value: string) => {
    navigate({ search: (prev: SearchState) => ({ ...prev, [key]: value }) });
  };

  const competitions = useMemo(() => {
    const set = new Set<string>();
    draws.forEach((d) => set.add(d.competition_title));
    return Array.from(set).sort();
  }, [draws]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const fromMs = from ? new Date(from).getTime() : null;
    const toMs = to ? new Date(to).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    const numTrim = num.trim();
    return draws.filter((d) => {
      if (comp && d.competition_title !== comp) return false;
      if (type && classifyPrize(d.prize) !== type) return false;
      if (numTrim && String(d.winning_number) !== numTrim) return false;
      const t = new Date(d.drawn_at).getTime();
      if (fromMs !== null && t < fromMs) return false;
      if (toMs !== null && t > toMs) return false;
      if (qLower) {
        const hay = `${d.competition_title} ${d.prize} ${d.winner_display_name} ${d.winner_town}`.toLowerCase();
        if (!hay.includes(qLower)) return false;
      }
      return true;
    });
  }, [draws, q, comp, from, to, type, num]);

  const activeFilters = Boolean(q || comp || from || to || type || num);
  const reset = () =>
    navigate({ search: { q: "", comp: "", from: "", to: "", type: "", num: "" } });

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

        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Search
              </label>
              <input
                type="text"
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
                placeholder="Competition, prize, winner…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-clover"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Competition
              </label>
              <select
                value={comp}
                onChange={(e) => setParam("comp", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-clover"
              >
                <option value="">All competitions</option>
                {competitions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Prize type
              </label>
              <select
                value={type}
                onChange={(e) => setParam("type", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-clover"
              >
                <option value="">Any type</option>
                {PRIZE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Winning #
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={num}
                onChange={(e) => setParam("num", e.target.value)}
                placeholder="e.g. 142"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-clover"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Drawn from
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setParam("from", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-clover"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Drawn to
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setParam("to", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-clover"
              />
            </div>
            <div className="md:col-span-6 flex items-end justify-between gap-3">
              <div className="text-xs font-mono text-muted-foreground">
                {filtered.length} of {draws.length} draws
              </div>
              {activeFilters && (
                <button
                  onClick={reset}
                  className="text-xs font-mono uppercase tracking-widest text-clover hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
            <div className="col-span-3">Drawn</div>
            <div className="col-span-4">Competition &amp; prize</div>
            <div className="col-span-2">Winning #</div>
            <div className="col-span-3">Winner</div>
          </div>

          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-muted-foreground">
              {draws.length === 0
                ? "No draws recorded yet. Check back after the next competition ends."
                : "No draws match your filters."}
            </div>
          )}

          <ul className="divide-y divide-border">
            {filtered.map((d) => (
              <li key={d.id} className="px-5 py-5">
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 md:col-span-3 font-mono text-sm text-foreground/80">
                    <div>{formatDate(d.drawn_at)}</div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">
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
                    <div className="text-[11px] font-mono text-muted-foreground mt-1">
                      of {d.total_tickets.toLocaleString()}
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-3">
                    <div className="font-bold">{d.winner_display_name}</div>
                    {d.winner_town && (
                      <div className="text-sm text-muted-foreground">{d.winner_town}</div>
                    )}
                  </div>
                </div>

                {(d.verification_hash || d.notes) && (
                  <div className="mt-3 rounded-md bg-background/60 border border-border px-3 py-2 font-mono text-[11px] text-muted-foreground break-all">
                    {d.verification_hash && (
                      <div>
                        <span className="text-muted-foreground">verify:</span>{" "}
                        {d.verification_hash}
                      </div>
                    )}
                    {d.notes && (
                      <div className="mt-1">
                        <span className="text-muted-foreground">note:</span> {d.notes}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-xs text-muted-foreground max-w-2xl">
          Draws are executed automatically once the competition timer ends. The
          winning number, timestamp and hash are written to this log immediately
          and cannot be altered from the site.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}