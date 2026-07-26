import type { ReactNode } from "react";

/**
 * WaxSeal — engraved seal/stamp mark for state.
 * DRAWN · SOLD OUT · VERIFIED · WINNER. Second-plate red, slight rotation.
 */
export function WaxSeal({
  children,
  size = "md",
  className = "",
  as: Tag = "span",
}: {
  children: ReactNode;
  size?: "sm" | "md";
  className?: string;
  as?: "span" | "div";
}) {
  return (
    <Tag className={`wax-seal ${size === "sm" ? "wax-seal--sm" : ""} ${className}`}>
      {children}
    </Tag>
  );
}