/**
 * Microtext — horizontal divider of repeating tiny text, like real
 * banknote microprinting. Legible only when zoomed. Straight-faced joke.
 */
const DEFAULT_LINE =
  "LUCKY GIT COMPS · NO MORE THAN 499 · YOU CANNOT WIN IF YOU DO NOT ENTER · ";

export function Microtext({
  text = DEFAULT_LINE,
  className = "",
  repeat = 40,
}: {
  text?: string;
  className?: string;
  repeat?: number;
}) {
  const line = text.endsWith(" ") ? text : text + " · ";
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={`microtext-rule ${className}`}
      title={text.trim()}
    >
      {line.repeat(repeat)}
    </div>
  );
}