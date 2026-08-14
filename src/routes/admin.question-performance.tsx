import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Download } from "lucide-react";

export const Route = createFileRoute("/admin/question-performance")({
  head: () => ({
    meta: [
      { title: "Question performance — Lucky Git Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QP,
});

interface Row {
  competition_id: string;
  competition_slug: string;
  competition_title: string;
  total_answers: number;
  correct_answers: number;
  incorrect_answers: number;
  pct_incorrect: number;
}

function QP() {
  const { data, isPending, error } = useQuery({
    queryKey: ["question-performance"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_question_performance" as never);
      if (error) throw error;
      return ((data ?? []) as unknown as Row[]).map((r) => ({
        ...r,
        total_answers: Number(r.total_answers),
        correct_answers: Number(r.correct_answers),
        incorrect_answers: Number(r.incorrect_answers),
        pct_incorrect: Number(r.pct_incorrect),
      }));
    },
    staleTime: 15_000,
  });

  const aggregatePctIncorrect = data && data.length
    ? Math.round(
        (data.reduce((s, r) => s + r.incorrect_answers, 0) /
          Math.max(1, data.reduce((s, r) => s + r.total_answers, 0))) *
          100,
      )
    : 0;

  const exportCsv = () => {
    if (!data) return;
    const header = ["Slug", "Title", "Total", "Correct", "Incorrect", "% Incorrect"];
    const lines = [header.join(",")].concat(
      data.map((r) =>
        [
          r.competition_slug,
          `"${r.competition_title.replace(/"/g, '""')}"`,
          r.total_answers,
          r.correct_answers,
          r.incorrect_answers,
          `${r.pct_incorrect.toFixed(1)}%`,
        ].join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `question-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-6 w-full flex-1">
        <Link to="/admin" className="text-xs font-bold text-muted-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to admin
        </Link>
        <div className="mt-1 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-black">Question performance</h1>
            <p className="text-muted-foreground text-sm">
              Evidence record for the skill-competition basis. Flags questions where the incorrect
              rate falls below 10%.
            </p>
          </div>
          <Button variant="cream" size="lg" onClick={exportCsv} disabled={!data?.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-border bg-card p-5">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Aggregate % incorrect (all competitions)
          </div>
          <div className="font-display text-5xl font-black mt-1 tabular-nums">
            {aggregatePctIncorrect}%
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left p-3">Competition</th>
                <th className="text-right p-3">Total</th>
                <th className="text-right p-3">Correct</th>
                <th className="text-right p-3">Incorrect</th>
                <th className="text-right p-3">% Incorrect</th>
              </tr>
            </thead>
            <tbody>
              {isPending && (
                <tr><td className="p-4 text-muted-foreground" colSpan={5}>Loading…</td></tr>
              )}
              {error && (
                <tr><td className="p-4 text-[color:var(--color-ink-red)]" colSpan={5}>{(error as Error).message}</td></tr>
              )}
              {!isPending && !error && data?.length === 0 && (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={5}>
                    No skill answers recorded yet. This table fills up as entries come in.
                  </td>
                </tr>
              )}
              {data?.map((r) => {
                const flag = r.total_answers >= 20 && r.pct_incorrect < 10;
                return (
                  <tr key={r.competition_id} className="border-b border-border/60 last:border-b-0">
                    <td className="p-3">
                      <Link to="/competitions/$slug" params={{ slug: r.competition_slug }} className="font-bold underline">
                        {r.competition_title}
                      </Link>
                      {flag && (
                        <div className="mt-1 text-xs text-[color:var(--color-ink-red)] inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Low failure rate — this question may not satisfy the skill test.
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right tabular-nums font-mono">{r.total_answers}</td>
                    <td className="p-3 text-right tabular-nums font-mono">{r.correct_answers}</td>
                    <td className="p-3 text-right tabular-nums font-mono">{r.incorrect_answers}</td>
                    <td className="p-3 text-right tabular-nums font-mono font-bold">
                      {r.pct_incorrect.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
