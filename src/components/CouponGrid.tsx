/**
 * CouponGrid — 499-cell pools coupon.
 * Sold cells: blue biro X. Picked: red X.
 * Roving tabindex + aria-pressed + direct number-input fallback.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { BiroMark } from "./BiroMark";
import { Shuffle } from "lucide-react";

function parseNumberSpec(spec: string, max: number): number[] {
  const out = new Set<number>();
  for (const chunk of spec.split(/[,\s]+/).filter(Boolean)) {
    const range = chunk.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (range) {
      const a = Math.max(1, Math.min(max, +range[1]));
      const b = Math.max(1, Math.min(max, +range[2]));
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      for (let n = lo; n <= hi; n++) out.add(n);
    } else {
      const n = parseInt(chunk, 10);
      if (Number.isFinite(n) && n >= 1 && n <= max) out.add(n);
    }
  }
  return [...out];
}

export function CouponGrid({
  total = 499,
  sold,
  picked,
  onToggle,
  onLuckyDip,
  winnerCounts,
  cols = 25,
}: {
  total?: number;
  sold: Set<number>;
  picked: Set<number>;
  onToggle: (n: number) => void;
  onLuckyDip?: () => void;
  /** Map of ticket-number → how many times it's been drawn a winner site-wide. */
  winnerCounts?: Map<number, number>;
  cols?: number;
}) {
  const [focusIdx, setFocusIdx] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [note, setNote] = useState<string>("");

  const cells = useMemo(
    () => Array.from({ length: total }, (_, i) => i + 1),
    [total],
  );

  const left = total - sold.size;
  const focusedNumber = focusIdx + 1;

  useEffect(() => {
    const el = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-cell="${focusIdx}"]`,
    );
    if (el && document.activeElement?.closest("[data-coupon-grid]")) el.focus();
  }, [focusIdx]);

  const onKey = (e: React.KeyboardEvent) => {
    let n = focusIdx;
    if (e.key === "ArrowRight") n = Math.min(total - 1, n + 1);
    else if (e.key === "ArrowLeft") n = Math.max(0, n - 1);
    else if (e.key === "ArrowDown") n = Math.min(total - 1, n + cols);
    else if (e.key === "ArrowUp") n = Math.max(0, n - cols);
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = total - 1;
    else return;
    e.preventDefault();
    setFocusIdx(n);
  };

  const submitInput = (e: React.FormEvent) => {
    e.preventDefault();
    const nums = parseNumberSpec(input, total);
    let added = 0;
    for (const n of nums) if (!sold.has(n)) { onToggle(n); added++; }
    setInput("");
    setNote(
      added === 0
        ? "Nothing added — check for typos or numbers already gone."
        : `Marked ${added} number${added === 1 ? "" : "s"}.`,
    );
  };

  const winsForFocused = winnerCounts?.get(focusedNumber) ?? 0;
  const focusHint = winsForFocused === 0
    ? `NOBODY HAS WON WITH ${String(focusedNumber).padStart(3, "0")} YET`
    : `${String(focusedNumber).padStart(3, "0")} HAS WON ${winsForFocused === 1 ? "ONCE" : `${winsForFocused} TIMES`}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="font-mono text-[11px] tabular-nums tracking-[0.15em] uppercase text-[var(--color-ink-black)]">
          <b>{sold.size}</b> / {total} TAKEN
          <span className="mx-2 text-[var(--color-ink-blue)]">·</span>
          <b>{left}</b> LEFT
          {picked.size > 0 && (
            <>
              <span className="mx-2 text-[var(--color-ink-blue)]">·</span>
              <b className="text-[var(--color-ink-red)]">{picked.size}</b> YOURS
            </>
          )}
        </div>
        {onLuckyDip && (
          <button
            type="button"
            onClick={onLuckyDip}
            className="inline-flex items-center gap-1.5 border-2 border-[var(--color-ink-black)] bg-[var(--color-ink-yellow)] text-[var(--color-ink-black)] px-3 py-1 font-display uppercase tracking-[0.14em] text-[11px]"
          >
            <Shuffle className="h-3.5 w-3.5" /> Lucky dip
          </button>
        )}
      </div>
      <div
        data-coupon-grid
        ref={gridRef}
        role="grid"
        aria-label={`Coupon grid — ${total} tickets, ${sold.size} sold, ${picked.size} selected`}
        className="grid gap-[1px] p-1 bg-[var(--color-ink-black)] max-h-[60vh] overflow-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onKeyDown={onKey}
      >
        {cells.map((n, i) => {
          const isSold = sold.has(n);
          const isPicked = picked.has(n);
          const cls =
            "relative aspect-square flex items-center justify-center bg-[var(--color-paper)] font-mono text-[9px] leading-none tabular-nums focus:outline-none focus:z-10 focus:ring-2 focus:ring-[var(--color-ink-red)] " +
            (isSold
              ? "text-[var(--color-ink-black)]/40 cursor-not-allowed"
              : isPicked
                ? "bg-[var(--color-ink-yellow)]/60 text-[var(--color-ink-black)] hover:bg-[var(--color-ink-yellow)]"
                : "text-[var(--color-ink-black)] hover:bg-[var(--color-ink-yellow)]/30");
          return (
            <button
              key={n}
              data-cell={i}
              type="button"
              role="gridcell"
              aria-pressed={isPicked}
              aria-label={`Ticket ${n}${isSold ? ", sold" : isPicked ? ", selected" : ", available"}`}
              aria-disabled={isSold || undefined}
              disabled={isSold}
              tabIndex={i === focusIdx ? 0 : -1}
              onFocus={() => setFocusIdx(i)}
              onClick={() => !isSold && onToggle(n)}
              className={cls}
            >
              <span aria-hidden="true">{n}</span>
              {isSold && (
                <span className="absolute inset-0 flex items-center justify-center" style={{ transform: `rotate(${((n * 37) % 20) - 10}deg)` }}>
                  <BiroMark kind="x" color="var(--color-ink-blue)" size={16} />
                </span>
              )}
              {isPicked && (
                <span className="absolute inset-0 flex items-center justify-center" style={{ transform: `rotate(${((n * 23) % 16) - 8}deg)` }}>
                  <BiroMark kind="x" color="var(--color-ink-red)" size={16} animate />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="font-mono text-[10px] tabular-nums tracking-[0.14em] uppercase text-[var(--color-ink-blue)] min-h-[1em]">
        {focusHint}
      </div>

      <form onSubmit={submitInput} className="flex flex-wrap items-center gap-2">
        <label className="text-[10px] font-body font-bold uppercase tracking-[0.14em] text-[var(--color-ink-black)]" htmlFor="coupon-input">
          Pick my numbers
        </label>
        <input
          id="coupon-input"
          type="text"
          inputMode="numeric"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 7, 42, 100–110"
          className="flex-1 min-w-[10rem] border border-[var(--color-ink-black)] bg-[var(--color-paper)] px-2 py-1 font-mono text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-red)]"
        />
        <button
          type="submit"
          className="border border-[var(--color-ink-black)] bg-[var(--color-ink-red)] text-[var(--color-paper)] px-3 py-1 font-display uppercase tracking-[0.14em] text-xs"
        >
          Mark
        </button>
        {note && (
          <span aria-live="polite" className="basis-full font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-blue)]">
            {note}
          </span>
        )}
      </form>
    </div>
  );
}