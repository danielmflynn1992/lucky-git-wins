import { Link } from "@tanstack/react-router";
import { LuckyMark } from "./GaryMascot";

export function Logo({ variant = "horizontal", className = "" }: { variant?: "horizontal" | "stacked"; className?: string }) {
  const dark = variant === "stacked";
  if (dark) {
    return (
      <Link to="/" className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <LuckyMark className="h-12 w-12" />
        <div className="font-display text-xl font-semibold tracking-tight text-cream leading-none">
          LuckyGit<span className="text-clover">Comps</span>
        </div>
      </Link>
    );
  }
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <LuckyMark className="h-8 w-8 shrink-0" />
      <div className="font-display text-lg font-semibold tracking-tight text-foreground leading-none">
        LuckyGit<span className="text-clover">Comps</span>
      </div>
    </Link>
  );
}