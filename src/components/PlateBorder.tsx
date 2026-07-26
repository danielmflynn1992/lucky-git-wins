import type { ReactNode } from "react";

/**
 * PlateBorder — certificate treatment: fine double rule (border + outline),
 * ornamental corner flourishes. Sharp corners only.
 */
export function PlateBorder({
  children,
  className = "",
  variant = "default",
  as: Tag = "div",
  corners = true,
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "tight" | "flush";
  as?: "div" | "article" | "section" | "aside";
  corners?: boolean;
}) {
  const v =
    variant === "tight" ? "plate-border--tight" : variant === "flush" ? "plate-border--flush" : "";
  return (
    <Tag className={`plate-border ${v} ${className}`}>
      {corners && <PlateCorners />}
      {children}
    </Tag>
  );
}

function PlateCorners() {
  const c = "absolute h-3 w-3";
  return (
    <>
      <Flourish className={`${c} top-1 left-1`} />
      <Flourish className={`${c} top-1 right-1 -scale-x-100`} />
      <Flourish className={`${c} bottom-1 left-1 -scale-y-100`} />
      <Flourish className={`${c} bottom-1 right-1 -scale-100`} />
    </>
  );
}

function Flourish({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={className} fill="none" stroke="var(--color-ink-green)" strokeWidth="0.8">
      <path d="M1 1 L6 1 M1 1 L1 6 M1 1 Q5 3 6 6" />
    </svg>
  );
}