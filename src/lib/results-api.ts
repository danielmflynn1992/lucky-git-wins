import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IMAGES } from "@/lib/competitions-api";
import { placeholderForPrize } from "@/lib/winners-api";

export interface CompetitionResult {
  competitionId: string;
  status: string;
  totalTickets: number;
  /** Numbers that were actually bought. Only published after close. */
  soldNumbers: number[];
  untouched: number[];
  winningNumber: number | null;
  drawId: string | null;
  drawnAt: string | null;
  winnerDisplayName: string | null;
  winnerTown: string | null;
}

/**
 * Post-close result data for a competition: which numbers went, which never
 * got touched, and the winning ticket. Deliberately returns nothing while a
 * competition is still live — publishing pick-rates mid-comp would nudge
 * people's choices.
 */
export async function fetchCompetitionResult(slug: string): Promise<CompetitionResult | null> {
  const { data: comp, error } = await supabase
    .from("competitions")
    .select("id, status, total_tickets, ends_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!comp) return null;

  const closed = comp.status !== "live" || new Date(comp.ends_at).getTime() <= Date.now();
  if (!closed) return null;

  const { data: tickets } = await supabase
    .from("tickets")
    .select("number, status")
    .eq("competition_id", comp.id);

  const soldNumbers = (tickets ?? [])
    .filter((t) => t.status === "sold")
    .map((t) => t.number)
    .sort((a, b) => a - b);
  const soldSet = new Set(soldNumbers);
  const untouched: number[] = [];
  for (let n = 1; n <= comp.total_tickets; n++) if (!soldSet.has(n)) untouched.push(n);

  const { data: draw } = await supabase
    .from("draws")
    .select("id, winning_number, drawn_at, winner_display_name, winner_town")
    .eq("competition_id", comp.id)
    .order("drawn_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    competitionId: comp.id,
    status: comp.status,
    totalTickets: comp.total_tickets,
    soldNumbers,
    untouched,
    winningNumber: draw?.winning_number ?? null,
    drawId: draw?.id ?? null,
    drawnAt: draw?.drawn_at ?? null,
    winnerDisplayName: draw?.winner_display_name ?? null,
    winnerTown: draw?.winner_town ?? null,
  };
}

export const competitionResultQuery = (slug: string) =>
  queryOptions({
    queryKey: ["competition-result", slug],
    queryFn: () => fetchCompetitionResult(slug),
    staleTime: 60_000,
  });

export interface DrawnCompetition {
  drawId: string;
  competitionId: string | null;
  slug: string | null;
  title: string;
  prize: string;
  winningNumber: number;
  winnerDisplayName: string;
  totalTickets: number;
  drawnAt: string;
  /** Example record: rendered as an illustration, never counted or verified. */
  isDemo: boolean;
  image: string | null;
}

/** Every competition that has actually been drawn, newest first. */
export async function fetchDrawnCompetitions(): Promise<DrawnCompetition[]> {
  const { data: draws, error } = await supabase
    .from("draws")
    .select("id, competition_id, competition_title, prize, winning_number, winner_display_name, total_tickets, drawn_at, is_demo")
    .order("drawn_at", { ascending: false });
  if (error) throw error;
  const rows = draws ?? [];
  const ids = rows.map((d) => d.competition_id).filter(Boolean) as string[];

  const slugs = new Map<string, string>();
  const images = new Map<string, string>();
  if (ids.length) {
    const { data: comps } = await supabase.from("competitions").select("id, slug, image").in("id", ids);
    for (const c of comps ?? []) {
      slugs.set(c.id, c.slug);
      const img = IMAGES[c.slug] ?? (/^https?:\/\//i.test(c.image ?? "") ? c.image : "");
      if (img) images.set(c.id, img);
    }
  }

  return rows.map((d) => {
    const isDemo = Boolean((d as { is_demo?: boolean }).is_demo);
    return {
      drawId: d.id,
      competitionId: d.competition_id,
      slug: d.competition_id ? slugs.get(d.competition_id) ?? null : null,
      title: d.competition_title,
      prize: d.prize,
      winningNumber: d.winning_number,
      winnerDisplayName: isDemo ? "—" : d.winner_display_name,
      totalTickets: d.total_tickets,
      drawnAt: d.drawn_at,
      isDemo,
      image:
        (d.competition_id ? images.get(d.competition_id) : null) ??
        placeholderForPrize(d.prize ?? "", d.competition_title ?? ""),
    } satisfies DrawnCompetition;
  });
}

export const drawnCompetitionsQuery = queryOptions({
  queryKey: ["drawn-competitions"],
  queryFn: fetchDrawnCompetitions,
  staleTime: 60_000,
});

/**
 * The draw to surface as "latest result". Real draws always win: an example
 * only shows when no genuine draw exists anywhere.
 */
export function latestDrawn(list: DrawnCompetition[]): DrawnCompetition | null {
  return list.find((d) => !d.isDemo) ?? list[0] ?? null;
}