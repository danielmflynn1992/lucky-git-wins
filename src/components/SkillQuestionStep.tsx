import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchSkillQuestion, submitSkillAnswer } from "@/lib/skill.functions";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Choice = "a" | "b" | "c" | "d";

/**
 * SkillQuestionStep — accessible radiogroup, no timer, server-validated.
 * Options are fetched via a server fn that reads a view stripping the
 * correct answer. Submission goes through a SECURITY DEFINER RPC.
 */
export function SkillQuestionStep({
  slug,
  reservationToken,
  onResult,
}: {
  slug: string;
  reservationToken: string;
  onResult: (r: { isCorrect: boolean; orderRef: string }) => void;
}) {
  const fetchFn = useServerFn(fetchSkillQuestion);
  const { data, isPending, error } = useQuery({
    queryKey: ["skill-question", slug],
    queryFn: () => fetchFn({ data: { slug } }),
    staleTime: 60_000,
    retry: false,
  });

  const [selected, setSelected] = useState<Choice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean } | null>(null);

  useEffect(() => {
    // Defensive: if the payload ever contained a correct_option-shaped
    // field, log a hard error. This should never happen given the view.
    if (data && Object.prototype.hasOwnProperty.call(data, "correct_option")) {
      // eslint-disable-next-line no-console
      console.error("Skill question payload leaked correct_option");
    }
  }, [data]);

  if (isPending) {
    return (
      <div className="border-2 border-[var(--color-ink-black)] bg-card p-5 flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading the question…
      </div>
    );
  }
  if (error) {
    return (
      <div className="border-2 border-[var(--color-ink-red)] bg-card p-5 text-sm text-[color:var(--color-ink-red)]">
        Couldn't load the skill question: {(error as Error).message}
      </div>
    );
  }
  if (!data) return null;

  const options: Array<[Choice, string]> = [
    ["a", data.optionA],
    ["b", data.optionB],
    ["c", data.optionC],
    ["d", data.optionD],
  ];

  const submit = async () => {
    if (!selected) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await submitSkillAnswer({
        reservationToken,
        questionId: data.id,
        selected,
      });
      setResult({ isCorrect: res.isCorrect });
      onResult(res);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div
        className={
          "border-2 p-5 " +
          (result.isCorrect
            ? "border-[var(--color-ink-blue)] bg-[color:var(--color-ink-blue)]/5"
            : "border-[var(--color-ink-red)] bg-[color:var(--color-ink-red)]/5")
        }
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-2">
          {result.isCorrect ? (
            <CheckCircle2 className="h-5 w-5 mt-0.5 text-[color:var(--color-ink-blue)]" />
          ) : (
            <XCircle className="h-5 w-5 mt-0.5 text-[color:var(--color-ink-red)]" />
          )}
          <div>
            <div className="font-display uppercase tracking-[0.14em] text-sm">
              {result.isCorrect ? "Answer submitted" : "Answer submitted — not entered"}
            </div>
            <p className="mt-1 text-sm text-foreground/85">
              {result.isCorrect
                ? "Correct answers make you eligible for the draw. Proceed to payment to confirm your tickets."
                : "Your answer was incorrect. You can still complete payment, but your tickets will not be entered in the draw. If you'd rather not proceed, close this page — no charge yet."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <fieldset className="border-2 border-[var(--color-ink-black)] bg-card p-5">
      <legend className="px-2 font-display uppercase tracking-[0.14em] text-sm">
        Skill question · one answer per order
      </legend>
      <p className="mt-1 text-base font-semibold text-foreground">{data.questionText}</p>
      <div role="radiogroup" aria-label="Skill question options" className="mt-4 grid gap-2">
        {options.map(([key, label]) => {
          const active = selected === key;
          return (
            <label
              key={key}
              className={
                "flex items-start gap-3 p-3 border-2 cursor-pointer transition-colors " +
                (active
                  ? "border-[var(--color-ink-black)] bg-[color:var(--color-ink-blue)]/5"
                  : "border-border hover:border-foreground/50")
              }
            >
              <input
                type="radio"
                name="skill-answer"
                value={key}
                checked={active}
                onChange={() => setSelected(key)}
                className="mt-1 h-4 w-4 accent-[color:var(--color-ink-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-ink-red)]"
              />
              <span className="text-sm">
                <span className="font-mono font-bold mr-2 uppercase">{key})</span>
                {label}
              </span>
            </label>
          );
        })}
      </div>
      {submitError && (
        <div className="mt-3 text-sm text-[color:var(--color-ink-red)]">{submitError}</div>
      )}
      <Button
        type="button"
        variant="gold"
        size="lg"
        className="mt-4 w-full"
        onClick={submit}
        disabled={!selected || submitting}
      >
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit answer"}
      </Button>
      <p className="mt-2 text-[11px] text-muted-foreground text-center">
        No time limit. No retries within this order.
      </p>
    </fieldset>
  );
}
