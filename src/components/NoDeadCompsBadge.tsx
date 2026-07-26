import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

/** Small on-brand badge asserting: this comp draws on its stated close date/time,
 *  no matter what. Mechanically true because draws are fully automated. */
export function NoDeadCompsBadge({ variant = "chip" }: { variant?: "chip" | "row" }) {
  if (variant === "row") {
    return (
      <Link
        to="/promise"
        className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.15em] font-bold text-clover hover:underline"
      >
        <ShieldCheck className="h-3 w-3" /> No dead comps guarantee
      </Link>
    );
  }
  return (
    <span
      title="Draws on the stated close date/time no matter what — no postponements."
      className="inline-flex items-center gap-1 rounded-full border border-clover/40 bg-clover/10 text-clover px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
    >
      <ShieldCheck className="h-2.5 w-2.5 shrink-0" />
      <span className="hidden sm:inline">No dead comps</span>
    </span>
  );
}