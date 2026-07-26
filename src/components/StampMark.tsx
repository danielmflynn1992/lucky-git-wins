/**
 * StampMark — rubber-stamp overprint.
 * Restraint: max one per card, two per screen. Replaces all badges.
 */
import { cn } from "@/lib/utils";

type Variant = "DRAWN" | "SOLD OUT" | "VERIFIED" | "PAID" | "WINNER" | "INSTANT WIN" | "LIVE" | "NEW";

const inkFor: Record<Variant, string> = {
  DRAWN:        "var(--color-ink-purple)",
  "SOLD OUT":   "var(--color-ink-red)",
  VERIFIED:     "var(--color-ink-blue)",
  PAID:         "var(--color-ink-red)",
  WINNER:       "var(--color-ink-red)",
  "INSTANT WIN":"var(--color-ink-red)",
  LIVE:         "var(--color-ink-red)",
  NEW:          "var(--color-ink-blue)",
};

export function StampMark({
  variant,
  angle = -8,
  size = "md",
  className,
}: {
  variant: Variant;
  angle?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const ink = inkFor[variant];
  const pad =
    size === "sm" ? "px-2 py-0.5 text-[10px] border-[1.5px]" :
    size === "lg" ? "px-4 py-1.5 text-lg border-[3px]"       :
                    "px-3 py-1 text-xs border-2";
  return (
    <span
      aria-label={variant}
      className={cn(
        "inline-flex items-center font-display uppercase tracking-[0.14em] select-none",
        "mix-blend-multiply",
        pad,
        className,
      )}
      style={{
        color: ink,
        borderColor: ink,
        transform: `rotate(${angle}deg)`,
        opacity: 0.82,
        // ragged ink-bleed edge via inset text-shadow trick
        filter: "url(#stamp-noise)",
      }}
    >
      {variant}
    </span>
  );
}

/** Once-per-app SVG filter for the stamp ink-bleed. Mount in root. */
export function StampFilterDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="stamp-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="1.6" />
      </filter>
    </svg>
  );
}