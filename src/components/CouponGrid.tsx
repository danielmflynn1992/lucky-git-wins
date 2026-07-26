/**
 * CouponGrid — 499-cell pools coupon.
 * Sold cells: blue biro X. Picked: red X.
 * Roving tabindex + aria-pressed + direct number-input fallback.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { BiroMark } from "./BiroMark";

export function CouponGrid({
  total = 499,
  sold,
  picked,
  onToggle,
  cols = 25,
}: {
  total?: number;
  sold: Set<number>;
  picked: Set<number>;
  onToggle: (n: number) => void;
  cols?: number;
}) {
  const [focusIdx, setFocusIdx] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const cells = useMemo(
    () => Array.from({ length: total }, (_, i) => i + 1),
    [total],
  );

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
    const num = parseInt(input, 10);
    if (Number.isFinite(num) && num >= 1 && num <= total && !sold.has(num)) {
      onToggle(num);
      setInput("");
    }
  };

  return (
    <div className="space-y-3">
      <div
        data-coupon-grid
        ref={gridRef}
        role="grid"
        aria-label={`Coupon grid — ${total} tickets, ${sold.size} sold, ${picked.size} selected`}
        className="grid gap-[2px] p-2 bg-[var(--color-ink-black)]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onKeyDown={onKey}
      >
        {cells.map((n, i) => {
          const isSold = sold.has(n);
          const isPicked = picked.has(n);
          const cls =
            "note-cell" +
            (isSold ? " note-cell--sold" : "") +
            (isPicked ? " note-cell--picked" : "");
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
              {isPicked && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <BiroMark kind="x" color="var(--color-ink-red)" size={18} animate />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <form onSubmit={submitInput} className="flex items-center gap-2">
        <label className="label" htmlFor="coupon-input">Enter no.</label>
        <input
          id="coupon-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={total}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="1–499"
          className="w-24 border border-[var(--color-ink-black)] bg-[var(--color-paper)] px-2 py-1 font-mono text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-red)]"
        />
        <button
          type="submit"
          className="border border-[var(--color-ink-black)] bg-[var(--color-ink-red)] text-[var(--color-paper)] px-3 py-1 font-display uppercase tracking-[0.14em] text-xs"
        >
          Mark
        </button>
      </form>
    </div>
  );
}