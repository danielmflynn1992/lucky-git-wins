import type { CompetitionResult } from "@/lib/results-api";

/**
 * Pick-rate board for a closed competition: the full coupon grid again, with
 * bought numbers inked in and untouched ones left blank. Published only after
 * close so live pick-rates can never steer anyone's choices.
 */
export function PickHeatmap({ result }: { result: CompetitionResult }) {
  const sold = new Set(result.soldNumbers);
  const cols = Math.min(25, Math.max(10, Math.ceil(Math.sqrt(result.totalTickets * 1.6))));
  const cells = Array.from({ length: result.totalTickets }, (_, i) => i + 1);
  const untouchedPreview = result.untouched.slice(0, 5);

  return (
    <section className="mt-8 border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
      <div className="bg-[var(--color-ink-red)] px-3 py-1.5 font-body font-bold uppercase tracking-[0.16em] text-[9px] text-[var(--color-paper)]">
        Where the money went
      </div>
      <div className="p-4">
        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          role="img"
          aria-label={`${result.soldNumbers.length} of ${result.totalTickets} numbers were bought`}
        >
          {cells.map((n) => {
            const isWinner = n === result.winningNumber;
            const wasSold = sold.has(n);
            return (
              <div
                key={n}
                title={`${n}${isWinner ? " — winning ticket" : wasSold ? " — bought" : " — untouched"}`}
                className="aspect-square border border-[var(--color-ink-black)]/40"
                style={{
                  background: isWinner
                    ? "var(--color-ink-blue)"
                    : wasSold
                      ? "color-mix(in oklab, var(--color-ink-red) 70%, transparent)"
                      : "transparent",
                }}
              />
            );
          })}
        </div>

        <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-black)] [overflow-wrap:anywhere]">
          BOUGHT: {result.soldNumbers.length} / {result.totalTickets}
          {untouchedPreview.length > 0 && <> · UNTOUCHED: {untouchedPreview.join(", ")}{result.untouched.length > 5 ? "…" : ""}</>}
          {result.winningNumber !== null && <> · WINNING TICKET: {result.winningNumber}</>}
        </div>
        <p className="mt-2 font-body text-sm text-[var(--color-ink-grey)]">
          For the record: the machine doesn't care what's popular.
        </p>
      </div>
    </section>
  );
}