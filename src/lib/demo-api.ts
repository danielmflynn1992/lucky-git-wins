import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { lifecycleOf, type Lifecycle } from "@/lib/site-stats";

export interface DemoComp {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  pricePerTicket: number;
  totalTickets: number;
  ticketsSold: number;
  endsAt: string;
  status: string;
  isRolling: boolean;
  drawId: string | null;
  drawnAt: string | null;
  winningNumber: number | null;
  phase: Lifecycle;
}

/** Every example competition, with its live lifecycle state and draw record. */
export async function fetchDemoComps(): Promise<DemoComp[]> {
  const { data: comps, error } = await supabase
    .from("competitions")
    .select("id, slug, title, subtitle, price_per_ticket, total_tickets, ends_at, status, is_rolling_demo")
    .eq("is_demo", true)
    .order("ends_at", { ascending: false });
  if (error) throw error;
  const rows = comps ?? [];
  if (rows.length === 0) return [];

  const { data: counts } = await supabase.rpc("competition_sold_counts");
  const sold = new Map<string, number>();
  for (const row of counts ?? []) sold.set(row.competition_id, row.sold);

  const { data: draws } = await supabase
    .from("draws")
    .select("id, competition_id, winning_number, drawn_at")
    .in("competition_id", rows.map((c) => c.id));
  const drawByComp = new Map<string, { id: string; winning_number: number; drawn_at: string }>();
  for (const d of draws ?? []) {
    if (d.competition_id) drawByComp.set(d.competition_id, d as never);
  }

  return rows.map((c) => {
    const draw = drawByComp.get(c.id) ?? null;
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle ?? "",
      pricePerTicket: Number(c.price_per_ticket),
      totalTickets: c.total_tickets,
      ticketsSold: sold.get(c.id) ?? 0,
      endsAt: c.ends_at,
      status: c.status,
      isRolling: Boolean((c as { is_rolling_demo?: boolean }).is_rolling_demo),
      drawId: draw?.id ?? null,
      drawnAt: draw?.drawn_at ?? null,
      winningNumber: draw?.winning_number ?? null,
      phase: lifecycleOf({ endsAt: c.ends_at, status: c.status, drawId: draw?.id ?? null }),
    } satisfies DemoComp;
  });
}

export const demoCompsQuery = queryOptions({
  queryKey: ["demo-comps"],
  queryFn: fetchDemoComps,
  staleTime: 15_000,
  refetchInterval: 60_000,
});
