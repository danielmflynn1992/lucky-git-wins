/**
 * BiroMark — hand-drawn blue ballpoint X, tick, or circle.
 */
import { cn } from "@/lib/utils";

type Kind = "x" | "tick" | "circle";

export function BiroMark({
  kind = "x",
  className,
  animate = false,
  color = "var(--color-ink-blue)",
  size = 24,
}: {
  kind?: Kind;
  className?: string;
  animate?: boolean;
  color?: string;
  size?: number;
}) {
  const common = {
    stroke: color,
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
    className: animate ? "biro-draw" : undefined,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("inline-block pointer-events-none", className)}
      aria-hidden="true"
    >
      {kind === "x" && (
        <>
          <path d="M4.2 5.1 C 9 10, 14 15, 19.5 19.2" {...common} />
          <path d="M19.8 4.6 C 15 9.5, 9.5 14.5, 4.4 19.6" {...common} />
        </>
      )}
      {kind === "tick" && (
        <path d="M3.8 12.6 C 6 14, 8 16.2, 10.2 18.4 C 13 14, 17 8.5, 20.3 4.8" {...common} />
      )}
      {kind === "circle" && (
        <path
          d="M12 3.2 C 5.5 3.4, 3 8.5, 3.5 12.8 C 4.2 17.6, 8 20.6, 12.4 20.8 C 17.2 20.9, 20.6 17.4, 20.7 12.4 C 20.6 7.4, 17.4 3.4, 12 3.3 Z"
          {...common}
        />
      )}
    </svg>
  );
}