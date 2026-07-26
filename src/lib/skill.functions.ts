import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Public server client for reads (no correct_option — reads through view)
function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined as unknown as Storage },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const fetchSkillQuestion = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { data: comp } = await client
      .from("competitions")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!comp) throw new Error("competition not found");
    const { data: q, error } = await client
      .from("skill_questions_public" as never)
      .select("id, question_text, option_a, option_b, option_c, option_d")
      .eq("competition_id", comp.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!q) throw new Error("no skill question set for this competition");
    // Explicitly project only safe columns — never return correct_option.
    return {
      id: (q as { id: string }).id,
      questionText: (q as { question_text: string }).question_text,
      optionA: (q as { option_a: string }).option_a,
      optionB: (q as { option_b: string }).option_b,
      optionC: (q as { option_c: string }).option_c,
      optionD: (q as { option_d: string }).option_d,
    };
  });

// Client-side wrapper: the actual RPC is SECURITY DEFINER and validates auth.uid()
// server-side. We call from the browser so the anon/user session context is used.
export async function submitSkillAnswer(args: {
  reservationToken: string;
  questionId: string;
  selected: "a" | "b" | "c" | "d";
}): Promise<{ isCorrect: boolean; orderRef: string }> {
  const { data, error } = await supabase.rpc("submit_skill_answer", {
    p_reservation_token: args.reservationToken,
    p_question_id: args.questionId,
    p_selected: args.selected,
  });
  if (error) throw new Error(error.message);
  const r = data as { is_correct: boolean; order_ref: string };
  return { isCorrect: r.is_correct, orderRef: r.order_ref };
}
