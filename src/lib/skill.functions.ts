import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { createPublicSkillClient } from "@/lib/skill.server";

export type AnswerFormat = "integer" | "time_24h";

/**
 * Returns id, question_text and answer_format ONLY. The correct answer lives
 * behind a table with no client-readable policy and is never projected here.
 */
export const fetchSkillQuestion = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const client = createPublicSkillClient();
    const { data: rows, error } = await client.rpc("get_competition_question", { p_slug: data.slug });
    if (error) throw new Error(error.message);
    const q = (rows as Array<{ id: string; question_text: string; answer_format: string }> | null)?.[0];
    if (!q) throw new Error("no skill question set for this competition");
    return {
      id: q.id,
      questionText: q.question_text,
      answerFormat: (q.answer_format === "time_24h" ? "time_24h" : "integer") as AnswerFormat,
    };
  });

/** Normalise client-side only for validation UX — the server re-normalises. */
export function normaliseAnswer(raw: string): number | null {
  const s = raw.trim().replace(/[,\s£$:]/g, "").replace(/\.0+$/, "");
  if (!/^-?\d+$/.test(s)) return null;
  return Number(s);
}

// The RPC is SECURITY DEFINER: it normalises, compares, records the attempt
// and returns only { is_correct }. The answer never leaves the database.
export async function submitSkillAnswer(args: {
  reservationToken: string;
  questionId: string;
  rawAnswer: string;
}): Promise<{ isCorrect: boolean; orderRef: string }> {
  const { data, error } = await supabase.rpc("submit_skill_answer", {
    p_reservation_token: args.reservationToken,
    p_question_id: args.questionId,
    p_raw_answer: args.rawAnswer,
  });
  if (error) throw new Error(error.message);
  const r = data as unknown as { is_correct: boolean; order_ref: string };
  return { isCorrect: r.is_correct, orderRef: r.order_ref };
}
