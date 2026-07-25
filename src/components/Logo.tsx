import { Link } from "@tanstack/react-router";
import { GaryMascot } from "./GaryMascot";

export function Logo({ variant = "horizontal", className = "" }: { variant?: "horizontal" | "stacked"; className?: string }) {
  if (variant === "stacked") {
    return (
      <Link to="/" className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <GaryMascot className="h-16 w-16" />
        <div className="text-center leading-none">
          <div className="font-display text-2xl text-cream">Lucky Git</div>
          <div className="tracking-[0.35em] text-[10px] font-bold text-gold">COMPS</div>
        </div>
      </Link>
    );
  }
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <GaryMascot className="h-10 w-10 shrink-0" />
      <div className="leading-none">
        <div className="font-display text-lg sm:text-xl text-clover">Lucky Git</div>
        <div className="tracking-[0.3em] text-[9px] font-bold text-clover/70">COMPS</div>
      </div>
    </Link>
  );
}