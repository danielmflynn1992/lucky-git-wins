import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LetterboxStyle } from "@/components/LetterboxImage";
import type { Competition } from "@/lib/mock-comps";
import audi from "@/assets/prize-audi.jpg";
import tech from "@/assets/prize-tech.jpg";
import cash from "@/assets/prize-cash.jpg";
import holiday from "@/assets/prize-holiday.jpg";
import ps5 from "@/assets/prize-ps5.jpg";
import watch from "@/assets/prize-watch.jpg";

// Slug → bundled asset. Keeps the DB free of build-time paths.
export const IMAGES: Record<string, string> = {
  "audi-rs3-25k-cash": audi,
  "apple-tech-bundle": tech,
  "10k-cash": cash,
  "maldives-getaway": holiday,
  "ps5-pro-instant": ps5,
  "rolex-submariner": watch,
};

// DB rows can hold stale dev paths like "/src/assets/prize-audi.jpg" that don't
// resolve after build. Treat any non-http(s) value as unusable and fall back
// to the bundled slug asset.
function resolveImage(raw: string | null | undefined, slug: string): string {
  if (raw && /^https?:\/\//i.test(raw)) return raw;
  return IMAGES[slug] ?? "";
}

export interface DbCompetition {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  thumbUrl: string;
  supportingImages: string[];
  letterboxStyle: LetterboxStyle;
  pricePerTicket: number;
  totalTickets: number;
  ticketsSold: number;
  ticketsAvailable: number;
  cashAlternative: number;
  maxPerPerson: number;
  endsAt: string;
  hot: boolean;
  description: string;
  takenNumbers: number[];
}

export async function fetchCompetitionBySlug(slug: string): Promise<DbCompetition | null> {
  const { data: comp, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!comp) return null;

  const { data: takenRows, error: tErr } = await supabase
    .from("tickets")
    .select("number, status")
    .eq("competition_id", comp.id)
    .neq("status", "available");
  if (tErr) throw tErr;

  const rows = (takenRows ?? []) as Array<{ number: number; status: string }>;
  const takenNumbers = rows.map((r) => r.number);
  const sold = rows.filter((r) => r.status === "sold").length;

  return {
    id: comp.id,
    slug: comp.slug,
    title: comp.title,
    subtitle: comp.subtitle,
    category: comp.category,
    image: resolveImage(comp.image, comp.slug),
    thumbUrl: (comp as { thumb_url?: string | null }).thumb_url || "",
    supportingImages: ((comp as { supporting_images?: string[] | null }).supporting_images ?? []).filter(Boolean),
    letterboxStyle: ((comp as { letterbox_style?: string }).letterbox_style ?? "blur") as LetterboxStyle,
    pricePerTicket: Number(comp.price_per_ticket),
    totalTickets: comp.total_tickets,
    ticketsSold: sold,
    ticketsAvailable: comp.total_tickets - takenNumbers.length,
    cashAlternative: comp.cash_alternative,
    maxPerPerson: comp.max_per_person,
    endsAt: comp.ends_at,
    hot: comp.hot,
    description: comp.description,
    takenNumbers,
  };
}

export const competitionQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["competition", slug],
    queryFn: () => fetchCompetitionBySlug(slug),
    staleTime: 15_000,
  });

// --- Every live competition (single source of truth for cards/rows) ----------

/**
 * One query every browse surface reads from, so the homepage, the
 * /competitions grid, the odds board and the detail page can never disagree
 * about price, category or how many tickets have gone.
 */
export async function fetchAllCompetitions(): Promise<Competition[]> {
  const { data: comps, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("status", "live")
    .order("ends_at", { ascending: true });
  if (error) throw error;
  if (!comps || comps.length === 0) return [];

  const ids = comps.map((c) => c.id);
  const { data: tickets, error: tErr } = await supabase
    .from("tickets")
    .select("competition_id, status")
    .in("competition_id", ids)
    .eq("status", "sold");
  if (tErr) throw tErr;

  const sold = new Map<string, number>();
  for (const t of tickets ?? []) sold.set(t.competition_id, (sold.get(t.competition_id) ?? 0) + 1);

  return comps.map((c) => {
    const image = resolveImage(c.image, c.slug);
    const supporting = ((c as { supporting_images?: string[] | null }).supporting_images ?? []).filter(Boolean);
    return {
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      category: c.category,
      image,
      thumbUrl: (c as { thumb_url?: string | null }).thumb_url || "",
      letterboxStyle: ((c as { letterbox_style?: string }).letterbox_style ?? "blur") as LetterboxStyle,
      gallery: supporting.length ? supporting : [image],
      pricePerTicket: Number(c.price_per_ticket),
      totalTickets: c.total_tickets,
      ticketsSold: sold.get(c.id) ?? 0,
      cashAlternative: c.cash_alternative,
      maxPerPerson: c.max_per_person,
      endsAt: c.ends_at,
      hot: c.hot,
      description: c.description,
    } satisfies Competition;
  });
}

export const allCompetitionsQueryOptions = queryOptions({
  queryKey: ["competitions", "live"],
  queryFn: fetchAllCompetitions,
  staleTime: 15_000,
  refetchInterval: 60_000,
});

// --- Live odds for the ticker ------------------------------------------------

export interface LiveOdds {
  id: string;
  slug: string;
  title: string;
  category: string;
  pricePerTicket: number;
  totalTickets: number;
  ticketsSold: number;
  ticketsReserved: number;
  ticketsAvailable: number;
  odds: number; // 1 : odds
  pctSold: number;
  endsAt: string;
}

export async function fetchLiveOdds(): Promise<LiveOdds[]> {
  const { data: comps, error } = await supabase
    .from("competitions")
    .select("id, slug, title, category, price_per_ticket, total_tickets, ends_at")
    .eq("status", "live")
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: true });
  if (error) throw error;
  if (!comps || comps.length === 0) return [];

  const ids = comps.map((c) => c.id);
  const { data: tickets, error: tErr } = await supabase
    .from("tickets")
    .select("competition_id, status")
    .in("competition_id", ids)
    .neq("status", "available");
  if (tErr) throw tErr;

  const counts = new Map<string, { sold: number; reserved: number }>();
  for (const t of tickets ?? []) {
    const c = counts.get(t.competition_id) ?? { sold: 0, reserved: 0 };
    if (t.status === "sold") c.sold += 1;
    else if (t.status === "reserved") c.reserved += 1;
    counts.set(t.competition_id, c);
  }

  return comps.map((c) => {
    const { sold = 0, reserved = 0 } = counts.get(c.id) ?? {};
    const total = c.total_tickets;
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      category: c.category,
      pricePerTicket: Number(c.price_per_ticket),
      totalTickets: total,
      ticketsSold: sold,
      ticketsReserved: reserved,
      ticketsAvailable: total - sold - reserved,
      // A single ticket's odds in a raffle are 1 in (total tickets in the pool).
      // Nothing to do with how many have sold.
      odds: total,
      pctSold: Math.round((sold / Math.max(1, total)) * 100),
      endsAt: c.ends_at,
    };
  });
}

export const liveOddsQueryOptions = queryOptions({
  queryKey: ["live-odds"],
  queryFn: fetchLiveOdds,
  staleTime: 15_000,
  refetchInterval: 30_000,
});

// --- Reservation helpers ------------------------------------------------------

export function newReservationToken(): string {
  return crypto.randomUUID();
}

export async function reserveLuckyDip(
  slug: string,
  qty: number,
  token: string,
): Promise<number[]> {
  const { data, error } = await supabase.rpc("reserve_lucky_dip", {
    p_slug: slug,
    p_qty: qty,
    p_token: token,
  });
  if (error) throw new Error(cleanRpcError(error.message));
  return (data as number[]) ?? [];
}

export async function reserveNumbers(
  slug: string,
  numbers: number[],
  token: string,
): Promise<number[]> {
  const { data, error } = await supabase.rpc("reserve_specific_numbers", {
    p_slug: slug,
    p_numbers: numbers,
    p_token: token,
  });
  if (error) throw new Error(cleanRpcError(error.message));
  return (data as number[]) ?? [];
}

export async function releaseReservation(token: string): Promise<void> {
  await supabase.rpc("release_reservation", { p_token: token });
}

function cleanRpcError(msg: string) {
  return msg.replace(/^.*?:\s*/, "");
}

export interface Availability {
  available: number;
  total: number;
  status: string;
  endsAt: string;
  closed: boolean;
}

export async function fetchAvailability(slug: string): Promise<Availability | null> {
  const { data: comp, error } = await supabase
    .from("competitions")
    .select("id, status, ends_at, total_tickets")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !comp) return null;
  const { count } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("competition_id", comp.id)
    .eq("status", "available");
  const closed = comp.status !== "live" || new Date(comp.ends_at).getTime() <= Date.now();
  return {
    available: count ?? 0,
    total: comp.total_tickets,
    status: comp.status,
    endsAt: comp.ends_at,
    closed,
  };
}

/**
 * Turns an RPC reservation error into a user-facing message, adding live
 * availability so the UI can nudge the user down to what's actually left.
 */
export async function explainReservationFailure(
  slug: string,
  requestedQty: number,
  rawMessage: string,
): Promise<{ message: string; availability: Availability | null }> {
  const availability = await fetchAvailability(slug);
  const msg = rawMessage.toLowerCase();

  if (availability?.closed) {
    return {
      message: "This competition has closed — the auto-draw will run shortly.",
      availability,
    };
  }

  if (msg.includes("not enough tickets") || msg.includes("already taken")) {
    if (!availability || availability.available === 0) {
      return { message: "Sold out — every ticket has gone. Try another competition.", availability };
    }
    if (availability.available < requestedQty) {
      return {
        message: `Only ${availability.available} ticket${availability.available === 1 ? "" : "s"} left — drop your quantity to ${availability.available} or fewer to continue.`,
        availability,
      };
    }
    return {
      message: "Some of those numbers were just snapped up. Pick different numbers or use Lucky Dip.",
      availability,
    };
  }

  if (msg.includes("exceeds max per person")) {
    return { message: rawMessage, availability };
  }

  if (msg.includes("competition not open")) {
    return { message: "This competition isn't open for entries right now.", availability };
  }

  return { message: rawMessage || "Reservation failed. Try again.", availability };
}
