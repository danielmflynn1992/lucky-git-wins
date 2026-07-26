import type { ReactNode } from "react";

/**
 * Ribbon — engraved ribbon banner. Section headings only, never buttons.
 */
export function Ribbon({
  children,
  className = "",
  as: Tag = "h2",
  eyebrow,
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
  eyebrow?: string;
}) {
  return (
    <div className={`inline-flex flex-col items-center text-center ${className}`}>
      {eyebrow && <div className="label-micro mb-2">{eyebrow}</div>}
      <div className="relative inline-flex items-center justify-center px-8 py-3">
        <svg
          aria-hidden="true"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          fill="none"
          stroke="var(--color-ink-green)"
        >
          <path d="M20 12 L380 12 L392 30 L380 48 L20 48 L8 30 Z" strokeWidth="1" fill="var(--color-paper-raised)" />
          <path d="M26 18 L374 18 L384 30 L374 42 L26 42 L16 30 Z" strokeWidth="0.4" fill="none" />
          <path d="M8 30 L0 22 L0 38 Z" strokeWidth="1" fill="var(--color-paper-deep)" />
          <path d="M392 30 L400 22 L400 38 Z" strokeWidth="1" fill="var(--color-paper-deep)" />
        </svg>
        <Tag
          className="relative font-display font-semibold uppercase px-2 sm:px-4 text-[clamp(0.78rem,3.4cqi,1.15rem)] leading-[1.15] tracking-[0.06em] sm:tracking-[0.1em] md:tracking-[0.14em] break-words hyphens-auto"
          style={{ color: "var(--color-ink-green-deep)", fontVariant: "small-caps" }}
        >
          {children}
        </Tag>
      </div>
    </div>
  );
}