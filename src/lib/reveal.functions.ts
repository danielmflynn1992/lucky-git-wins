import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side answer to "did I win this draw?". Ticket ownership is never
 * exposed to the browser — only a boolean for the signed-in caller.
 */
export const amIDrawWinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { drawId: string }) => ({ drawId: String(d.drawId).slice(0, 64) }))
  .handler(async ({ data, context }): Promise<{ won: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: draw } = await supabaseAdmin
      .from("draws")
      .select("competition_id, winning_number")
      .eq("id", data.drawId)
      .maybeSingle();
    if (!draw?.competition_id) return { won: false };

    const { data: ticket } = await supabaseAdmin
      .from("tickets")
      .select("id")
      .eq("competition_id", draw.competition_id)
      .eq("number", draw.winning_number)
      .eq("owner_id", context.userId)
      .maybeSingle();

    return { won: Boolean(ticket) };
  });
