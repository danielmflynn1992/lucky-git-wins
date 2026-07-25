import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import audi from "@/assets/prize-audi.jpg";
import tech from "@/assets/prize-tech.jpg";
import cash from "@/assets/prize-cash.jpg";
import holiday from "@/assets/prize-holiday.jpg";
import ps5 from "@/assets/prize-ps5.jpg";
import watch from "@/assets/prize-watch.jpg";

// Slug → bundled asset. Keeps the DB free of build-time paths.
const IMAGES: Record<string, string> = {
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
  skillQuestion: { q: string; options: string[]; correct: number };
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
    image: IMAGES[comp.slug] ?? comp.image,
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
    skillQuestion: comp.skill_question as DbCompetition["skillQuestion"],
    takenNumbers,
  };
}

export const competitionQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["competition", slug],
    queryFn: () => fetchCompetitionBySlug(slug),
    staleTime: 15_000,
  });

// --- Reservation helpers ------------------------------------------------------

export function newReservationToken(): string {
  return crypto.randomUUID();
}

export async function reserveLuckyDip(slug: string, qty: number, token: string): Promise<number[]> {
  const { data, error } = await supabase.rpc("reserve_lucky_dip", {
    p_slug: slug,
    p_qty: qty,
    p_token: token,
  });
  if (error) throw new Error(cleanRpcError(error.message));
  return (data as number[]) ?? [];
}

export async function reserveNumbers(slug: string, numbers: number[], token: string): Promise<number[]> {
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
