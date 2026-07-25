import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Eye, Save, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { SkillQuestionModal, type SkillQuestion } from "@/components/SkillQuestionModal";
import { competitionQueryOptions } from "@/lib/competitions-api";
import { updateSkillQuestion } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/competitions/$slug/skill")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(competitionQueryOptions(params.slug));
    if (!data) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Edit skill question — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SkillEditor,
});

function SkillEditor() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(competitionQueryOptions(slug));
  const c = data!;

  const [question, setQuestion] = useState<SkillQuestion>({
    q: c.skillQuestion.q ?? "",
    options: [0, 1, 2, 3].map((i) => c.skillQuestion.options?.[i] ?? ""),
    correct: c.skillQuestion.correct ?? 0,
  });
  const [answered, setAnswered] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const update = useServerFn(updateSkillQuestion);

  const setOpt = (i: number, v: string) =>
    setQuestion((q) => ({ ...q, options: q.options.map((o, idx) => (idx === i ? v : o)) }));

  const problems: string[] = [];
  if (question.q.trim().length < 3) problems.push("Question must be at least 3 characters.");
  question.options.forEach((o, i) => {
    if (!o.trim()) problems.push(`Option ${String.fromCharCode(65 + i)} is empty.`);
  });
  const trimmed = question.options.map((o) => o.trim().toLowerCase());
  if (new Set(trimmed).size !== trimmed.length && !trimmed.includes(""))
    problems.push("Options must be unique.");

  const canSave = problems.length === 0 && !saving;

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await update({
        data: {
          slug,
          skillQuestion: {
            q: question.q.trim(),
            options: question.options.map((o) => o.trim()),
            correct: question.correct,
          },
        },
      });
      await qc.invalidateQueries({ queryKey: ["competition", slug] });
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-6 w-full flex-1">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link to="/admin" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to admin
            </Link>
            <h1 className="font-display text-3xl md:text-4xl font-black mt-1">Skill question</h1>
            <p className="text-muted-foreground text-sm">{c.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="cream" onClick={() => { setAnswered(null); setShowOverlay(true); }}>
              <Eye className="h-4 w-4" /> Preview as user
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={!canSave}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save changes</>}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Editor */}
          <section className="rounded-2xl bg-card border-2 border-white/5 p-5">
            <h2 className="font-display text-lg font-bold">Editor</h2>
            <p className="text-xs text-muted-foreground mt-1">
              A skill question is required by UK prize-comp law. Keep it easy but not trivial.
            </p>

            <label className="block mt-5 text-xs uppercase tracking-widest font-bold text-foreground/60">Question</label>
            <textarea
              value={question.q}
              onChange={(e) => setQuestion((q) => ({ ...q, q: e.target.value }))}
              rows={2}
              maxLength={300}
              placeholder="Which of these is a German car manufacturer?"
              className="mt-1 w-full rounded-xl bg-background border-2 border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-clover"
            />

            <div className="mt-4 space-y-2">
              <div className="text-xs uppercase tracking-widest font-bold text-foreground/60">
                Answer options — pick the correct one
              </div>
              {question.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                    <input
                      type="radio"
                      name="correct"
                      checked={question.correct === i}
                      onChange={() => setQuestion((q) => ({ ...q, correct: i }))}
                      className="h-4 w-4 accent-clover"
                    />
                    <span className="font-mono text-sm w-4">{String.fromCharCode(65 + i)}</span>
                  </label>
                  <input
                    value={opt}
                    onChange={(e) => setOpt(i, e.target.value)}
                    maxLength={120}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className={`flex-1 rounded-xl bg-background border-2 px-3 py-2 text-sm focus:outline-none ${
                      question.correct === i ? "border-clover" : "border-white/10 focus:border-clover/60"
                    }`}
                  />
                  {question.correct === i && (
                    <span className="text-[10px] font-bold uppercase text-clover shrink-0">Correct</span>
                  )}
                </div>
              ))}
            </div>

            {problems.length > 0 && (
              <ul className="mt-4 space-y-1 text-xs text-hot">
                {problems.map((p) => (
                  <li key={p} className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {saved && (
              <div className="mt-4 text-xs text-clover flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved. Live for buyers now.
              </div>
            )}
            {saveError && (
              <div className="mt-4 text-xs text-hot flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
          </section>

          {/* Preview */}
          <section className="rounded-2xl bg-card border-2 border-white/5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Live preview</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Exactly what buyers see
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Click an answer to test — correct highlights green, wrong flashes red.
            </p>
            <div className="mt-5 rounded-2xl bg-black/40 border border-white/5 p-4">
              <SkillQuestionModal
                inline
                question={question}
                answered={answered}
                onAnswer={setAnswered}
                onCancel={() => setAnswered(null)}
                onConfirm={() => { /* preview only */ }}
                confirmLabel="Reserve & checkout"
              />
            </div>
          </section>
        </div>
      </main>

      {showOverlay && (
        <SkillQuestionModal
          question={question}
          answered={answered}
          onAnswer={setAnswered}
          onCancel={() => setShowOverlay(false)}
          onConfirm={() => setShowOverlay(false)}
          confirmLabel="Close preview"
        />
      )}

      <SiteFooter />
    </div>
  );
}