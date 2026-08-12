/**
 * Odds and sold-count furniture. One implementation, used on every card,
 * every row and every competition page so the numbers never disagree.
 *
 * House rules baked in here:
 *  - odds are stamped, never buried
 *  - sold counts are exact ("347 of 499"), never a percentage
 *  - the ONLY scarcity device on the site is the FINAL 49 stamp
 */
import { cn } from "@/lib/utils";

export const NO_HIDDEN_TOTALS =
  "No hidden totals. No moving targets. 499 tickets, every time.";

/** Rubber-stamped odds badge. Same wording, same position, every card. */
export function OddsStamp({
  total,
  size = "md",
  className,
}: {
  total: number;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-label={`Odds: one in ${total}`}
      className={cn(
        "inline-flex select-none items-center whitespace-nowrap border-[var(--color-ink-red)] font-display uppercase tracking-[0.12em] text-[var(--color-ink-red)] mix-blend-multiply -rotate-[3deg]",
        size === "sm" ? "border-[1.5px] px-1.5 py-0.5 text-[9px]" : "border-2 px-2.5 py-1 text-[11px]",
        className,
      )}
      style={{ filter: "url(#stamp-noise)" }}
    >
      1 in {total.toLocaleString()}. Full stop.
    </span>
  );
}

/** Exact sold counter with a coupon-style progress strip. */
export function SoldCounter({
  sold,
  total,
  strapline = false,
  className,
}: {
  sold: number;
  total: number;
  strapline?: boolean;
  className?: string;
}) {
  const safeSold = Math.max(0, Math.min(sold, total));
  const remaining = total - safeSold;
  const fill = total > 0 ? (safeSold / total) * 100 : 0;
  const cells = 40;
  const litCells = Math.round((fill / 100) * cells);

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-2 font-mono text-[11px] tabular-nums text-[var(--color-ink-black)]">
        <span>
          Sold: <b>{safeSold.toLocaleString()}</b> of <b>{total.toLocaleString()}</b>
        </span>
        <span className="text-[var(--color-ink-grey)]">{remaining.toLocaleString()} left</span>
      </div>
      <div
        role="img"
        aria-label={`${safeSold} of ${total} tickets sold`}
        className="mt-1 flex h-2.5 gap-[1px] border border-[var(--color-ink-black)] bg-[var(--color-paper)] p-[1px]"
      >
        {Array.from({ length: cells }, (_, i) => (
          <span
            key={i}
            className="flex-1"
            style={{
              background:
                i < litCells ? "var(--color-ink-red)" : "color-mix(in srgb, var(--color-paper) 82%, var(--color-ink-blue))",
            }}
          />
        ))}
      </div>
      {strapline && (
        <p className="mt-1.5 font-mono text-[10px] leading-snug text-[var(--color-ink-grey)]">
          {NO_HIDDEN_TOTALS}
        </p>
      )}
    </div>
  );
}

/** True once a pool genuinely passes 450 of 499 (or the equivalent 90%). */
export function isFinalRun(sold: number, total: number) {
  const remaining = total - sold;
  return remaining > 0 && remaining <= Math.max(1, Math.round(total * 0.1));
}

/** The one and only scarcity stamp on the site. */
export function FinalStamp({ sold, total, className }: { sold: number; total: number; className?: string }) {
  const remaining = total - sold;
  if (!isFinalRun(sold, total)) return null;
  return (
    <span
      aria-label={`Final ${remaining} tickets`}
      className={cn(
        "inline-flex select-none items-center whitespace-nowrap border-2 border-[var(--color-ink-red)] px-2 py-0.5 font-display uppercase tracking-[0.16em] text-[11px] text-[var(--color-ink-red)] mix-blend-multiply -rotate-[6deg]",
        className,
      )}
      style={{ filter: "url(#stamp-noise)" }}
    >
      Final {remaining}
    </span>
  );
}
