import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

export interface DbCompetition {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  pricePerTicket: number;
  totalTickets: number;
  ticketsSold: number;
  ticketsAvailable: number;
  cashAlternative: number;
  maxPerPerson: number;
  endsAt: string;
  instantWin: boolean;
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
    image: comp.image || IMAGES[comp.slug] || "",
    pricePerTicket: Number(comp.price_per_ticket),
    totalTickets: comp.total_tickets,
    ticketsSold: sold,
    ticketsAvailable: comp.total_tickets - takenNumbers.length,
    cashAlternative: comp.cash_alternative,
    maxPerPerson: comp.max_per_person,
    endsAt: comp.ends_at,
    instantWin: comp.instant_win,
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
    const soldEffective = Math.max(1, sold);
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
      odds: Math.max(1, Math.round(total / soldEffective)),
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
