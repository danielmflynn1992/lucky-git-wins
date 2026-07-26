import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

/** Small on-brand badge asserting: this comp draws on its stated close date/time,
 *  no matter what. Mechanically true because draws are fully automated.
 *  `asLink={false}` renders a plain span so it can be nested inside another <a>
 *  without breaking DOM validity (no nested anchors). */
export function NoDeadCompsBadge({
  variant = "chip",
  asLink = true,
}: {
  variant?: "chip" | "row";
  asLink?: boolean;
}) {
  if (variant === "row") {
    const cls =
      "inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.15em] font-bold text-clover hover:underline";
    const inner = (
      <>
        <ShieldCheck className="h-3 w-3" /> No dead comps guarantee
      </>
    );
    return asLink ? (
      <Link to="/promise" className={cls}>
        {inner}
      </Link>
    ) : (
      <span className={cls}>{inner}</span>
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