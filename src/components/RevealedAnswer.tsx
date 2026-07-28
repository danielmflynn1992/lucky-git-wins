import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * The correct answer is published only after the competition has been drawn.
 * The RPC returns nothing at all while the competition is live.
 */
export function RevealedAnswer({ slug }: { slug: string }) {
  const { data } = useQuery({
    queryKey: ["revealed-answer", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("competition_revealed_answer", { p_slug: slug });
      if (error) throw error;
      return (data ?? [])[0] ?? null;
    },
    staleTime: 60_000,
    retry: false,
  });

  if (!data) return null;

  return (
    <div className="mt-6 border-2 border-[var(--color-ink-black)] bg-card p-4">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Question of skill · answer published
      </div>
      <p className="mt-1 text-sm">{data.question_text}</p>
      <div className="mt-2 font-mono text-2xl font-black tabular-nums">
        {data.answer_format === "time_24h"
          ? String(data.correct_answer).padStart(4, "0")
          : Number(data.correct_answer).toLocaleString()}
      </div>
    </div>
  );
}
