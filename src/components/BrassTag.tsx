import type { ReactNode } from "react";

/**
 * BrassTag — brushed-brass plate with embossed text.
 * Replaces flat badges for odds, "SOLD OUT", "INSTANT WIN", "NEXT DROP".
 */
export function BrassTag({
  children,
  size = "sm",
  className = "",
  as: Tag = "span",
}: {
  children: ReactNode;
  size?: "xs" | "sm" | "md";
  className?: string;
  as?: "span" | "div";
}) {
  const sizes = {
    xs: "text-[9px] px-1.5 py-0.5 tracking-[0.14em]",
    sm: "text-[10px] px-2 py-0.5 tracking-[0.16em]",
    md: "text-xs px-3 py-1 tracking-[0.18em]",
  } as const;
  return (
    <Tag
      className={`brass inline-flex items-center gap-1 font-display uppercase leading-none rounded-[2px] ${sizes[size]} ${className}`}
    >
      {children}
    </Tag>
  );
}