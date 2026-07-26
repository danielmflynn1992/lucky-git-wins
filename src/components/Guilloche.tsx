/**
 * Guilloche — interwoven rosette line pattern, engraved in green ink.
 * Absolutely-positioned decorative background. Aria-hidden, non-interactive.
 * Max one visible per viewport (see restraint rules).
 */
export function Guilloche({
  className = "",
  variant = "rosette",
  strength = "normal",
}: {
  className?: string;
  variant?: "rosette" | "field" | "band";
  strength?: "faint" | "normal" | "strong";
}) {
  const opacityClass =
    strength === "faint" ? "guilloche-bg--faint" : strength === "strong" ? "guilloche-bg--strong" : "";
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`guilloche-bg ${opacityClass} ${className}`}
      viewBox="0 0 600 400"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="guilloche-lines" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
          <path d="M0 3 Q1.5 0 3 3 T6 3" stroke="currentColor" strokeWidth="0.5" fill="none" />
        </pattern>
      </defs>
      {variant === "rosette" && (
        <g fill="none" stroke="currentColor" strokeWidth="0.5">
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i * Math.PI) / 18;
            const r1 = 150;
            const r2 = 60;
            const cx = 300 + Math.cos(a) * r2;
            const cy = 200 + Math.sin(a) * r2;
            return <ellipse key={i} cx={cx} cy={cy} rx={r1} ry={r1 * 0.55} transform={`rotate(${(i * 10)} ${cx} ${cy})`} />;
          })}
          <circle cx="300" cy="200" r="140" />
          <circle cx="300" cy="200" r="90" />
        </g>
      )}
      {variant === "field" && <rect width="600" height="400" fill="url(#guilloche-lines)" />}
      {variant === "band" && (
        <g fill="none" stroke="currentColor" strokeWidth="0.4">
          {Array.from({ length: 24 }).map((_, i) => (
            <path
              key={i}
              d={`M0 ${200 + Math.sin(i) * 10} Q150 ${100 + i * 4} 300 ${200 - Math.cos(i) * 20} T600 ${200 + Math.sin(i) * 10}`}
            />
          ))}
        </g>
      )}
    </svg>
  );
}