/**
 * OddsPlate — uncut sheet of banknotes. 499 tiny engraved note-cells;
 * sold ones are cancelled with a fine diagonal overprint.
 */
export function OddsPlate({
  total,
  sold,
  className = "",
  cols = 25,
}: {
  total: number;
  sold: number;
  className?: string;
  cols?: number;
}) {
  const capped = Math.min(total, 499);
  const soldCount = Math.min(sold, capped);
  const cells = Array.from({ length: capped }, (_, i) => i < soldCount);
  return (
    <div
      className={className}
      aria-label={`${soldCount.toLocaleString()} of ${capped.toLocaleString()} tickets sold`}
      role="img"
    >
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cells.map((isSold, i) => (
          <div key={i} className={`note-cell ${isSold ? "note-cell--sold" : ""}`} aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}