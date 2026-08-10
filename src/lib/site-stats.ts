/**
 * Single source of truth for every headline number on the site.
 *
 * Homepage hero, /transparency, /odds, the footer counter and the Winners
 * Wall all read from here, so they can never disagree. Nothing in this file
 * is hardcoded — it is derived from the live `competitions` and `draws`
 * tables via the same two queries used everywhere else.
 */
import { useQuery } from "@tanstack/react-query";
import { allCompetitionsQueryOptions } from "@/lib/competitions-api";
import { winnersQuery, realOnly } from "@/lib/winners-api";
import type { Competition } from "@/lib/mock-comps";

/** The 499 Promise: a pool never exceeds this, so one ticket is never worse than 1 in 499. */
export const MAX_POOL = 499;

/** A comp with no close time, or a close time in the past, is closed. Full stop. */
export function isClosed(endsAt: string | null | undefined): boolean {
  if (!endsAt) return true;
  const t = new Date(endsAt).getTime();
  return !Number.isFinite(t) || t <= Date.now();
}

export interface SiteStats {
  /** Comps still open for entry. */
  open: Competition[];
  /** Closed comps awaiting (or already having had) their automatic draw. */
  closed: Competition[];
  compsLive: number;
  prizesOnTable: number;
  ticketsSold: number;
  drawsCompleted: number;
  /** Same figure as drawsCompleted — one draw, one lucky git. */
  gitsMadeLucky: number;
  /** Average % of the pool sold across open comps. */
  sellThroughPct: number;
  /** ISO close time of the next comp to close, or null if nothing is open. */
  nextCloseAt: string | null;
  loading: boolean;
}

export function useSiteStats(): SiteStats {
  const { data: comps = [], isLoading: cLoading } = useQuery(allCompetitionsQueryOptions);
  const { data: winners = [], isLoading: wLoading } = useQuery(winnersQuery);
  // Example records are illustration only — they never reach a public number.
  const realWinners = assertNoDemoCounted(realOnly(winners));

  const open = comps.filter((c) => !isClosed(c.endsAt));
  const closed = comps.filter((c) => isClosed(c.endsAt));

  const prizesOnTable = open.reduce((s, c) => s + (c.cashAlternative ?? 0), 0);
  const ticketsSold = comps.reduce((s, c) => s + c.ticketsSold, 0);
  const sellThroughPct = open.length
    ? Math.round(
        open.reduce((s, c) => s + c.ticketsSold / Math.max(1, c.totalTickets), 0) / open.length * 100,
      )
    : 0;
  const nextCloseAt = open.length
    ? [...open].sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt))[0]!.endsAt
    : null;

  return {
    open,
    closed,
    compsLive: open.length,
    prizesOnTable,
    ticketsSold,
    drawsCompleted: realWinners.length,
    gitsMadeLucky: realWinners.length,
    sellThroughPct,
    nextCloseAt,
    loading: cLoading || wLoading,
  };
}

export function formatCloseDate(iso: string | null): string {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/**
 * Loud guard: any demo record that slips into a counted set is a
 * transparency bug, so fail hard in dev and log in production.
 */
export function assertNoDemoCounted<T extends { isDemo?: boolean }>(rows: T[]): T[] {
  const leaked = rows.filter((r) => r.isDemo);
  if (leaked.length) {
    const msg = `[site-stats] ${leaked.length} demo record(s) reached a public statistic`;
    if (import.meta.env.DEV) throw new Error(msg);
    console.error(msg);
    return rows.filter((r) => !r.isDemo);
  }
  return rows;
}

/**
 * Competition lifecycle, derived from server data — never a manual flag.
 *
 *  LIVE    now < close time            → browse pages, buyable
 *  DRAWING close time passed, no draw  → browse pages, pinned top, no buying
 *  DRAWN   a draw record exists        → results only; detail page shows result
 */
export type Lifecycle = "live" | "drawing" | "drawn";

export function lifecycleOf(c: {
  endsAt?: string | null;
  status?: string | null;
  drawId?: string | null;
}): Lifecycle {
  if (c.drawId || (c.status && c.status !== "live")) return "drawn";
  return isClosed(c.endsAt) ? "drawing" : "live";
}

/** Closed-but-undrawn comps stay on the shelf, pinned to the top. */
export function pinDrawingFirst<T extends { endsAt?: string | null; status?: string | null }>(
  list: T[],
): T[] {
  const rank = (c: T) => (lifecycleOf(c) === "drawing" ? 0 : 1);
  return [...list].sort((a, b) => rank(a) - rank(b));
}

/** "8 Aug, 20:00" — the moment the draw fires. */
/**
 * DRAWING is a state a comp passes through, not one it lives in. Anything
 * still awaiting its draw 24h after close is a fault worth shouting about.
 */
export const STALE_DRAWING_MS = 24 * 60 * 60 * 1000;

export function isStaleDrawing(c: {
  endsAt?: string | null;
  status?: string | null;
  drawId?: string | null;
}): boolean {
  if (lifecycleOf(c) !== "drawing") return false;
  const t = c.endsAt ? new Date(c.endsAt).getTime() : NaN;
  return Number.isFinite(t) && Date.now() - t > STALE_DRAWING_MS;
}

export function formatDrawTime(iso: string | null | undefined): string {
  if (!iso) return "shortly";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "shortly";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}
