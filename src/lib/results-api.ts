import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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