/**
 * Marker — yellow highlighter swipe. Max ONE per screen.
 */
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Marker({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("marker", className)}>{children}</span>;
}