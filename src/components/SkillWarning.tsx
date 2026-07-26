import { AlertTriangle } from "lucide-react";

/**
 * Prominent skill-competition warning. Legal reason this exists:
 * users must be told BEFORE payment that an incorrect answer means they
 * are not entered in the draw. Payment providers and consumer-law
 * expect this to be unmissable, not buried in T&Cs.
 */
export function SkillWarning({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={
        "border-2 border-[var(--color-ink-black)] bg-[var(--color-newsprint-warm,#fff)] " +
        (compact ? "p-3" : "p-4")
      }
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className="h-5 w-5 shrink-0 mt-0.5"
          style={{ color: "var(--color-ink-red,#c0392b)" }}
          aria-hidden
        />
        <div>
          <div
            className="font-display uppercase tracking-[0.14em] text-sm"
            style={{ color: "var(--color-ink-red,#c0392b)" }}
          >
            This is a competition of skill
          </div>
          <p className={"mt-1 " + (compact ? "text-xs" : "text-sm") + " text-foreground/90 leading-relaxed"}>
            <b>Answer the question correctly to enter the draw.</b> Tickets bought against an
            incorrect answer will not be entered — no refund. The winner is drawn at random from
            correct entries only.
          </p>
        </div>
      </div>
    </div>
  );
}
