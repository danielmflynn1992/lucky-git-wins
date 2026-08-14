import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { publicWinnerName } from "@/lib/winner-name";

/**
 * Data behind The Draw Board. Pure presentation feed: it reads the already
 * computed draw record, it never decides anything about the draw itself.
 */
export interface DrawBoardData {
  competitionId: string | null;
  slug: string | null;
  title: string;
  /** Short human competition number, derived from the id. */
  compNumber: string;
  totalTickets: number;
  endsAt: string | null;
  /** When the sealed seed hash was published (competition created). */
  seedPublishedAt: string | null;
  soldCount: number;
  isDemo: boolean;
  /** Null until the automatic draw has run. */
  draw: {
    id: string;
    winningNumber: number;
    winnerDisplayName: string;
    winnerTown: string;
    drawnAt: string;
    seedHash: string;
    seedRevealed: string;
    poolSize: number;
    totalSold: number;
  } | null;
}

const DRAW_COLS =
  "id, competition_id, competition_title, winning_number, winner_display_name, winner_town, total_tickets, total_sold, qualifying_pool_size, drawn_at, seed_hash, seed_revealed, is_demo";

const COMP_COLS = "id, slug, title, total_tickets, ends_at, created_at, is_demo";

function compNumberOf(id: string | null): string {
  if (!id) return "—";
  const hex = id.replace(/[^0-9a-f]/gi, "").slice(0, 6);
  const n = parseInt(hex, 16) % 10000;
  return String(n).padStart(4, "0");
}

async function soldCountFor(competitionId: string | null): Promise<number> {
  if (!competitionId) return 0;
  const { count } = await supabase
    .from("tickets")
    .select("number", { count: "exact", head: true })
    .eq("competition_id", competitionId)
    .eq("status", "sold");
  return count ?? 0;
}

type DrawRow = Record<string, unknown>;

function mapDraw(d: DrawRow | null): DrawBoardData["draw"] {
  if (!d) return null;
  return {
    id: String(d.id),
    winningNumber: Number(d.winning_number),
    winnerDisplayName: publicWinnerName(d.winner_display_name as string | null, Number(d.winning_number)),
    winnerTown: String(d.winner_town ?? ""),
    drawnAt: String(d.drawn_at),
    seedHash: String(d.seed_hash ?? ""),
    seedRevealed: String(d.seed_revealed ?? ""),
    poolSize: Number(d.qualifying_pool_size ?? d.total_sold ?? 0),
    totalSold: Number(d.total_sold ?? 0),
  };
}

/** Board for a competition page — works before, during and after the draw. */
export async function fetchDrawBoardBySlug(slug: string): Promise<DrawBoardData | null> {
  const { data: comp, error } = await supabase
    .from("competitions")
    .select(COMP_COLS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!comp) return null;

  const { data: draw } = await supabase
    .from("draws")
    .select(DRAW_COLS)
    .eq("competition_id", comp.id)
    .order("drawn_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    competitionId: comp.id,
    slug: comp.slug,
    title: comp.title,
    compNumber: compNumberOf(comp.id),
    totalTickets: comp.total_tickets,
    endsAt: comp.ends_at,
    seedPublishedAt: comp.created_at,
    soldCount: await soldCountFor(comp.id),
    isDemo: Boolean(comp.is_demo),
    draw: mapDraw(draw as DrawRow | null),
  };
}

/** Board for a single draw — used by the Winners Wall and the homepage. */
export async function fetchDrawBoardByDrawId(drawId: string): Promise<DrawBoardData | null> {
  const { data: draw, error } = await supabase
    .from("draws")
    .select(DRAW_COLS)
    .eq("id", drawId)
    .maybeSingle();
  if (error) throw error;
  if (!draw) return null;

  let slug: string | null = null;
  let endsAt: string | null = null;
  let seedPublishedAt: string | null = null;
  if (draw.competition_id) {
    const { data: comp } = await supabase
      .from("competitions")
      .select(COMP_COLS)
      .eq("id", draw.competition_id)
      .maybeSingle();
    slug = comp?.slug ?? null;
    endsAt = comp?.ends_at ?? null;
    seedPublishedAt = comp?.created_at ?? null;
  }

  return {
    competitionId: draw.competition_id,
    slug,
    title: draw.competition_title,
    compNumber: compNumberOf(draw.competition_id ?? draw.id),
    totalTickets: draw.total_tickets,
    endsAt,
    seedPublishedAt,
    soldCount: draw.total_sold ?? 0,
    isDemo: Boolean((draw as { is_demo?: boolean }).is_demo),
    draw: mapDraw(draw as DrawRow),
  };
}

export const drawBoardBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["draw-board", "slug", slug],
    queryFn: () => fetchDrawBoardBySlug(slug),
    staleTime: 30_000,
  });

export const drawBoardByDrawIdQuery = (drawId: string) =>
  queryOptions({
    queryKey: ["draw-board", "draw", drawId],
    queryFn: () => fetchDrawBoardByDrawId(drawId),
    staleTime: 5 * 60_000,
  });
