import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, Download, Plus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/questions")({
  head: () => ({
    meta: [
      { title: "Question bank — Lucky Git Admin" },
      { name: "description", content: "Manage the skill question bank and monitor difficulty." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuestionBank,
});

interface QRow {
  id: string;
  question_text: string;
  answer_format: "integer" | "time_24h";
  category: string;
  is_active: boolean;
  times_served: number;
  times_correct: number;
  created_at: string;
}

function pctIncorrect(r: QRow) {
  if (!r.times_served) return 0;
  return ((r.times_served - r.times_correct) / r.times_served) * 100;
}

function QuestionBank() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<null | Partial<QRow> & { correct_answer?: string }>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const questions = useQuery({
    queryKey: ["question-bank"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_questions");
      if (error) throw error;
      return (data ?? []) as QRow[];
    },
  });

  const stats = useQuery({
    queryKey: ["answer-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_answer_stats");
      if (error) throw error;
      return (data ?? []) as Array<{ day: string; attempts: number; incorrect: number }>;
    },
  });

  const save = useMutation({
    mutationFn: async (row: Partial<QRow> & { correct_answer?: string }) => {
      const answer = Number(String(row.correct_answer ?? "").replace(/[,\s£$:]/g, ""));
      if (!Number.isInteger(answer)) throw new Error("Correct answer must be a whole number.");
      const { error } = await supabase.rpc("admin_upsert_question", {
        p_id: (row.id ?? null) as unknown as string,
        p_question_text: (row.question_text ?? "").trim(),
        p_answer_format: row.answer_format ?? "integer",
        p_correct_answer: answer,
        p_category: row.category ?? "arithmetic",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(null);
      setSaveError(null);
      qc.invalidateQueries({ queryKey: ["question-bank"] });
    },
    onError: (e) => setSaveError(e instanceof Error ? e.message : "Save failed."),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.rpc("admin_set_question_active", { p_id: id, p_active: active });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["question-bank"] }),
  });

  const rows = useMemo(
    () => [...(questions.data ?? [])].sort((a, b) => pctIncorrect(a) - pctIncorrect(b)),
    [questions.data],
  );

  const totals = useMemo(() => {
    const attempts = (questions.data ?? []).reduce((s, r) => s + r.times_served, 0);
    const correct = (questions.data ?? []).reduce((s, r) => s + r.times_correct, 0);
    return {
      attempts,
      pctIncorrect: attempts ? Math.round(((attempts - correct) / attempts) * 100) : 0,
    };
  }, [questions.data]);

  const exportCsv = async () => {
    const { data, error } = await supabase.rpc("admin_export_entry_answers");
    if (error) return;
    const rowsOut = (data ?? []) as Array<Record<string, unknown>>;
    const header = ["Answered at", "Competition", "Question", "Answer given", "Normalised", "Correct", "Order ref"];
    const csv = [header.join(",")]
      .concat(
        rowsOut.map((r) =>
          [
            r.answered_at,
            `"${String(r.competition_title ?? "").replace(/"/g, '""')}"`,
            `"${String(r.question_text ?? "").replace(/"/g, '""')}"`,
            `"${String(r.raw_answer ?? "").replace(/"/g, '""')}"`,
            r.normalised_answer ?? "",
            r.is_correct ? "correct" : "incorrect",
            r.order_ref,
          ].join(","),
        ),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `entry-answers-${new Date().toISOString().slice(0, 10)}.csv`;
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
            <h1 className="font-display text-3xl md:text-4xl font-black">Question bank</h1>
            <p className="text-muted-foreground text-sm">
              Difficulty monitoring and the evidence trail. Sorted weakest first.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="cream" size="lg" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export answers CSV
            </Button>
            <Button
              variant="gold"
              size="lg"
              onClick={() => { setSaveError(null); setEditing({ answer_format: "integer", category: "arithmetic" }); }}
            >
              <Plus className="h-4 w-4" /> New question
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Overall % incorrect" value={`${totals.pctIncorrect}%`} />
          <Stat label="Total attempts" value={totals.attempts.toLocaleString()} />
          <div className="rounded-2xl border-2 border-border bg-card p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Incorrect rate over time
            </div>
            <Sparkline data={stats.data ?? []} />
          </div>
        </div>

        {editing && (
          <div className="mt-6 rounded-2xl border-2 border-[color:var(--color-ink-red)] bg-card p-5 space-y-3">
            <h2 className="font-display text-lg font-black">{editing.id ? "Edit question" : "New question"}</h2>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Question text</span>
              <textarea
                rows={2}
                value={editing.question_text ?? ""}
                onChange={(e) => setEditing({ ...editing, question_text: e.target.value })}
                className="mt-1 w-full rounded-xl border-2 border-border bg-background px-3 py-2 font-semibold"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Correct answer</span>
                <input
                  inputMode="numeric"
                  value={editing.correct_answer ?? ""}
                  onChange={(e) => setEditing({ ...editing, correct_answer: e.target.value })}
                  className="mt-1 w-full h-11 rounded-xl border-2 border-border bg-background px-3 font-mono"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Format</span>
                <select
                  value={editing.answer_format ?? "integer"}
                  onChange={(e) => setEditing({ ...editing, answer_format: e.target.value as QRow["answer_format"] })}
                  className="mt-1 w-full h-11 rounded-xl border-2 border-border bg-background px-3 font-semibold"
                >
                  <option value="integer">integer</option>
                  <option value="time_24h">time_24h</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</span>
                <input
                  value={editing.category ?? ""}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="mt-1 w-full h-11 rounded-xl border-2 border-border bg-background px-3 font-semibold"
                />
              </label>
            </div>
            {saveError && <p className="text-sm text-[color:var(--color-ink-red)]">{saveError}</p>}
            <div className="flex gap-2">
              <Button variant="cream" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="gold" onClick={() => save.mutate(editing)} disabled={save.isPending}>
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border-2 border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left p-3">Question</th>
                <th className="text-left p-3">Category</th>
                <th className="text-right p-3">Served</th>
                <th className="text-right p-3">Correct</th>
                <th className="text-right p-3">% Incorrect</th>
                <th className="text-right p-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {questions.isPending && <tr><td className="p-4 text-muted-foreground" colSpan={6}>Loading…</td></tr>}
              {questions.error && (
                <tr><td className="p-4 text-[color:var(--color-ink-red)]" colSpan={6}>{(questions.error as Error).message}</td></tr>
              )}
              {rows.map((r) => {
                const pct = pctIncorrect(r);
                const flag = r.times_served >= 30 && pct < 15;
                return (
                  <tr key={r.id} className="border-b border-border/60 last:border-b-0 align-top">
                    <td className="p-3 max-w-md">
                      <button
                        type="button"
                        className="text-left font-bold underline"
                        onClick={() => { setSaveError(null); setEditing({ ...r, correct_answer: "" }); }}
                      >
                        {r.question_text}
                      </button>
                      {flag && (
                        <div className="mt-1 text-xs text-[color:var(--color-ink-red)] inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Low failure rate — this question may not be doing enough work.
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs">{r.category}</td>
                    <td className="p-3 text-right font-mono tabular-nums">{r.times_served}</td>
                    <td className="p-3 text-right font-mono tabular-nums">{r.times_correct}</td>
                    <td className="p-3 text-right font-mono tabular-nums font-bold">{pct.toFixed(1)}%</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggle.mutate({ id: r.id, active: !r.is_active })}
                        className={`px-2 py-1 text-xs font-bold border-2 ${r.is_active ? "border-clover text-clover" : "border-border text-muted-foreground"}`}
                      >
                        {r.is_active ? "Active" : "Retired"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Retiring keeps the question and its history — nothing is ever deleted. Editing an existing
          question requires re-entering the correct answer; it is never sent to this browser.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-4xl font-black mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function Sparkline({ data }: { data: Array<{ day: string; attempts: number; incorrect: number }> }) {
  if (!data.length) return <div className="mt-2 text-sm text-muted-foreground">No attempts yet.</div>;
  const pts = data.map((d) => (d.attempts ? (d.incorrect / d.attempts) * 100 : 0));
  const w = 200, h = 44;
  const step = pts.length > 1 ? w / (pts.length - 1) : w;
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (p / 100) * h).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full h-11" role="img" aria-label="Incorrect rate over time">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
