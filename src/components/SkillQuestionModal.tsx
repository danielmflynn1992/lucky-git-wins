import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SkillQuestion {
  q: string;
  options: string[];
  correct: number;
}

interface Props {
  question: SkillQuestion;
  answered: number | null;
  onAnswer: (i: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
  reserving?: boolean;
  error?: string | null;
  confirmLabel?: string;
  /** Render inline (for previews) instead of as a fixed overlay. */
  inline?: boolean;
}

export function SkillQuestionModal({
  question,
  answered,
  onAnswer,
  onCancel,
  onConfirm,
  reserving = false,
  error = null,
  confirmLabel = "Reserve & checkout",
  inline = false,
}: Props) {
  const canProceed = answered !== null && answered === question.correct;

  const panel = (
    <div
      className="bg-background rounded-3xl border-2 border-white/10 w-full max-w-md p-6 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-xs font-bold uppercase tracking-widest text-clover">
        Skill question · required
      </div>
      <h3 className="mt-1 font-display text-2xl font-black">{question.q || "Your question here"}</h3>
      <p className="text-xs text-muted-foreground mt-1">
        You must answer correctly to reserve tickets — your answer is recorded with your order.
      </p>
      <div className="mt-4 space-y-2">
        {question.options.map((opt, i) => {
          const chosen = answered === i;
          const wrong = chosen && i !== question.correct;
          const right = chosen && i === question.correct;
          return (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              disabled={reserving}
              className={`w-full text-left rounded-xl border-2 px-4 py-3 font-semibold transition-colors flex items-center justify-between ${
                right
                  ? "border-clover bg-clover/10"
                  : wrong
                    ? "border-hot bg-hot/10"
                    : "border-white/10 bg-card hover:border-clover/40"
              }`}
            >
              <span>
                {String.fromCharCode(65 + i)}. {opt || <span className="text-muted-foreground italic">Option {i + 1}</span>}
              </span>
              {right && <CheckCircle2 className="h-4 w-4 text-clover" />}
              {wrong && <AlertTriangle className="h-4 w-4 text-hot" />}
            </button>
          );
        })}
      </div>
      {answered !== null && (
        <div className={`mt-3 text-sm font-bold ${canProceed ? "text-clover" : "text-hot"}`}>
          {canProceed ? "Correct. You can continue." : "Not quite — pick another answer."}
        </div>
      )}
      {error && (
        <div className="mt-3 text-xs text-hot flex items-start gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="mt-5 flex gap-2">
        <Button variant="cream" onClick={onCancel} className="flex-1" disabled={reserving}>
          Cancel
        </Button>
        <Button
          variant="gold"
          size="lg"
          disabled={!canProceed || reserving}
          onClick={onConfirm}
          className="flex-1"
        >
          {reserving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Locking tickets…
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </div>
    </div>
  );

  if (inline) {
    return <div className="flex justify-center">{panel}</div>;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={() => !reserving && onCancel()}
    >
      {panel}
    </div>
  );
}