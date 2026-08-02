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
import { winnersQuery } from "@/lib/winners-api";
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
    drawsCompleted: winners.length,
    gitsMadeLucky: winners.length,
    sellThroughPct,
    nextCloseAt,
    loading: cLoading || wLoading,
  };
}

export function formatCloseDate(iso: string | null): string {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
