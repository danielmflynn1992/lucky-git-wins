import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchSkillQuestion, normaliseAnswer, submitSkillAnswer } from "@/lib/skill.functions";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Free-text numeric skill answer. One attempt per order, no timer, and the
 * result is withheld until the draw. Marking happens entirely server-side.
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

  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const warnId = `${inputId}-warn`;
  const errId = `${inputId}-error`;

  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState(false);

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

  const placeholder = data.answerFormat === "time_24h" ? "e.g. 1725" : "e.g. 142";

  const submit = async () => {
    if (normaliseAnswer(value) === null) {
      setFieldError("Numbers only, please.");
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    try {
      const res = await submitSkillAnswer({
        reservationToken,
        questionId: data.id,
        rawAnswer: value,
      });
      setRecorded(true);
      onResult(res);
    } catch (e) {
      setFieldError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (recorded) {
    return (
      <div
        className="border-2 border-[var(--color-ink-black)] bg-card p-5"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 mt-0.5" />
          <div>
            <div className="font-display uppercase tracking-[0.14em] text-sm">Answer recorded</div>
            <p className="mt-1 text-sm text-foreground/85">
              You'll find out how you did when the draw goes off.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-[var(--color-ink-black)] bg-card p-5">
      <div className="label-field text-xs font-bold uppercase tracking-[0.2em]">Question of skill</div>

      <p className="mt-2 text-base text-foreground" id={`${inputId}-q`}>
        {data.questionText}
      </p>

      <label htmlFor={inputId} className="sr-only">
        Your answer to the skill question
      </label>
      <input
        id={inputId}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (fieldError) setFieldError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); void submit(); }
        }}
        placeholder={placeholder}
        aria-describedby={`${hintId} ${warnId}${fieldError ? ` ${errId}` : ""}`}
        aria-invalid={!!fieldError}
        disabled={submitting}
        className="mt-3 w-full h-14 border-2 border-[var(--color-ink-black)] bg-[var(--color-newsprint-warm,#FBF3E2)] px-3 font-mono text-xl tabular-nums tracking-wide focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ink-blue)]"
        style={{ fontFamily: '"Courier Prime", ui-monospace, monospace' }}
      />

      <p id={hintId} className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Numbers only. No commas.
      </p>

      <div aria-live="assertive" className="min-h-[1.25rem]">
        {fieldError && (
          <p id={errId} className="mt-1 text-sm font-bold text-[color:var(--color-ink-red)]">
            {fieldError}
          </p>
        )}
      </div>

      <div
        id={warnId}
        className="mt-3 border-2 border-[var(--color-ink-red)] bg-[color:var(--color-ink-red)]/5 p-3 text-sm leading-relaxed"
      >
        <b>Answer correctly to enter the draw.</b> Tickets bought against an incorrect answer are
        recorded as non-qualifying and will not be entered. Payment still completes. One attempt per
        order.
      </div>

      <Button
        type="button"
        variant="gold"
        size="lg"
        className="mt-4 w-full"
        onClick={submit}
        disabled={submitting || value.trim().length === 0}
      >
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Go on then"}
      </Button>
      <p className="mt-2 text-[11px] text-muted-foreground text-center">
        No time limit. No retries within this order.
      </p>
    </div>
  );
}
