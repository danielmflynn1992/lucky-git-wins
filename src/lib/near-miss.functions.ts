import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface NearMissResult {
  /** Did this account hold sold tickets in the competition? */
  entered: boolean;
  /** Has the competition actually been drawn? Never speculate before that. */
  drawn: boolean;
  won: boolean;
  winningNumber: number | null;
  closest: number | null;
  distance: number | null;
  yourNumbers: number[];
}

const EMPTY: NearMissResult = {
  entered: false,
  drawn: false,
  won: false,
  winningNumber: null,
  closest: null,
  distance: null,
  yourNumbers: [],
};

/**
 * Near-miss readout for the signed-in entrant only. Reads the caller's own
 * ticket numbers after the draw has completed — never before, and never for
 * anyone who didn't enter.
 */
export const getNearMiss = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug).slice(0, 120) }))
  .handler(async ({ data, context }): Promise<NearMissResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: comp } = await supabaseAdmin
      .from("competitions")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!comp) return EMPTY;

    const { data: draw } = await supabaseAdmin
      .from("draws")
      .select("winning_number")
      .eq("competition_id", comp.id)
      .order("drawn_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!draw) return EMPTY;

    const { data: mine } = await supabaseAdmin
      .from("tickets")
      .select("number")
      .eq("competition_id", comp.id)
      .eq("owner_id", context.userId)
      .eq("status", "sold");

    const numbers = (mine ?? []).map((t) => t.number).sort((a, b) => a - b);
    if (numbers.length === 0) return { ...EMPTY, drawn: true };

    const winning = draw.winning_number;
    let closest = numbers[0];
    let distance = Math.abs(numbers[0] - winning);
    for (const n of numbers) {
      const d = Math.abs(n - winning);
      if (d < distance) {
        distance = d;
        closest = n;
      }
    }

    return {
      entered: true,
      drawn: true,
      won: distance === 0,
      winningNumber: winning,
      closest,
      distance,
      yourNumbers: numbers,
    };
  });