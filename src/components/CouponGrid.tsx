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

function useResponsiveCols(override?: number) {
  const [cols, setCols] = useState(override ?? 10);
  useEffect(() => {
    if (override) { setCols(override); return; }
    const calc = () => {
      const w = window.innerWidth;
      setCols(w >= 1024 ? 25 : w >= 640 ? 16 : w >= 400 ? 12 : 10);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [override]);
  return cols;
}

function useIsDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const on = () => setD(mql.matches);
    on();
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, []);
  return d;
}

export function CouponGrid({
  total = 499,
  sold,
  picked,
  onToggle,
  onLuckyDip,
  winnerCounts,
  cols: colsOverride,
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
  const cols = useResponsiveCols(colsOverride);
  const isDesktop = useIsDesktop();
  const [focusIdx, setFocusIdx] = useState<number>(0);
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [note, setNote] = useState<string>("");

  const collapsedCount = Math.min(total, Math.ceil(100 / cols) * cols);
  const collapsible = !isDesktop && total > collapsedCount;
  const visibleCount = collapsible && !expanded ? collapsedCount : total;

  const rows = useMemo(() => {
    const out: number[][] = [];
    for (let i = 0; i < visibleCount; i += cols) {
      out.push(
        Array.from(
          { length: Math.min(cols, visibleCount - i) },
          (_, k) => i + k + 1,
        ),
      );
    }
    return out;
  }, [visibleCount, cols]);

  const left = total - sold.size;

  useEffect(() => {
    const el = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-cell="${focusIdx}"]`,
    );
    if (el && document.activeElement?.closest("[data-coupon-grid]")) el.focus();
  }, [focusIdx]);

  const onKey = (e: React.KeyboardEvent) => {
    let n = focusIdx;
    const max = visibleCount - 1;
    if (e.key === "ArrowRight") n = Math.min(max, n + 1);
    else if (e.key === "ArrowLeft") n = Math.max(0, n - 1);
    else if (e.key === "ArrowDown") n = Math.min(max, n + cols);
    else if (e.key === "ArrowUp") n = Math.max(0, n - cols);
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = max;
    else return;
    e.preventDefault();
    setFocusIdx(n);
    setActiveNumber(n + 1);
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

  const hintNumber = activeNumber;
  const winsForFocused = hintNumber ? (winnerCounts?.get(hintNumber) ?? 0) : 0;
  const focusHint = !hintNumber
    ? ""
    : winsForFocused === 0
      ? `NOBODY HAS WON WITH ${String(hintNumber).padStart(3, "0")} YET`
      : `${String(hintNumber).padStart(3, "0")} HAS WON ${winsForFocused === 1 ? "ONCE" : `${winsForFocused} TIMES`}`;

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-[var(--color-paper)] border-b border-[var(--color-ink-black)]/20 flex flex-wrap items-center gap-3 justify-between">
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
      <div className="max-h-[70vh] overflow-auto">
        <div
          data-coupon-grid
          ref={gridRef}
          role="grid"
          aria-label={`Coupon grid — ${total} tickets, ${sold.size} sold, ${picked.size} selected`}
          className="bg-[var(--color-ink-black)] p-1 flex flex-col gap-[1px]"
          onKeyDown={onKey}
        >
          {rows.map((row, r) => {
            const band = Math.floor(r / 5) % 2 === 1;
            return (
              <div key={r} role="row" className="flex gap-[1px]">
                {isDesktop && (
                  <div
                    aria-hidden="true"
                    className="w-8 shrink-0 flex items-center justify-center bg-[var(--color-ink-black)] font-mono text-[10px] tabular-nums text-[var(--color-paper)]/70"
                  >
                    {String(row[0]).padStart(3, "0")}
                  </div>
                )}
                <div
                  className="grid gap-[1px] flex-1 min-w-0"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(${isDesktop ? 34 : 30}px, 1fr))` }}
                >
                  {row.map((n) => {
                    const i = n - 1;
                    const isSold = sold.has(n);
                    const isPicked = picked.has(n);
                    const cls =
                      "relative aspect-square min-w-[30px] min-h-[30px] lg:min-w-[34px] lg:min-h-[34px] overflow-hidden flex items-center justify-center font-mono text-[0.625rem] lg:text-[0.6875rem] leading-none tracking-normal tabular-nums whitespace-nowrap focus:outline-none focus:z-10 focus:ring-2 focus:ring-[var(--color-ink-red)] " +
                      (isSold
                        ? "text-[var(--color-ink-black)]/40 cursor-not-allowed "
                        : isPicked
                          ? "text-[var(--color-ink-black)] hover:bg-[var(--color-ink-yellow)] "
                          : "text-[var(--color-ink-black)] hover:bg-[var(--color-ink-yellow)]/30 ") +
                      (isPicked ? "bg-[var(--color-ink-yellow)]/60" : "");
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
                        onFocus={() => { setFocusIdx(i); setActiveNumber(n); }}
                        onMouseEnter={() => setActiveNumber(n)}
                        onClick={() => { if (!isSold) { setActiveNumber(n); onToggle(n); } }}
                        className={cls}
                        style={
                          isPicked
                            ? undefined
                            : { backgroundColor: band
                                ? "color-mix(in srgb, var(--color-paper) 90%, var(--color-ink-blue))"
                                : "var(--color-paper)" }
                        }
                      >
                        <span aria-hidden="true">{n}</span>
                        {isSold && (
                          <span className="absolute inset-[18%] flex items-center justify-center" style={{ transform: `rotate(${((n * 37) % 20) - 10}deg)` }}>
                            <BiroMark kind="x" color="var(--color-ink-blue)" size={16} className="h-full w-full" />
                          </span>
                        )}
                        {isPicked && (
                          <span className="absolute inset-[18%] flex items-center justify-center" style={{ transform: `rotate(${((n * 23) % 16) - 8}deg)` }}>
                            <BiroMark kind="x" color="var(--color-ink-red)" size={16} animate className="h-full w-full" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {collapsible && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full border-2 border-[var(--color-ink-black)] bg-[var(--color-paper)] px-3 py-2 font-display uppercase tracking-[0.14em] text-[11px]"
        >
          Show all {total}
        </button>
      )}

      {focusHint && (
        <div aria-live="polite" className="font-mono text-[10px] tabular-nums tracking-[0.14em] uppercase text-[var(--color-ink-blue)]">
          {focusHint}
        </div>
      )}

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