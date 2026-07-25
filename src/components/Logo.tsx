import { Link } from "@tanstack/react-router";
import { LuckyMark } from "./GaryMascot";

export function Logo({ variant = "horizontal", className = "" }: { variant?: "horizontal" | "stacked"; className?: string }) {
  const dark = variant === "stacked";
  if (dark) {
    return (
      <Link to="/" className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <LuckyMark className="h-10 w-10" />
        <div className="font-display text-lg font-semibold tracking-[-0.03em] text-foreground leading-none">
          LuckyGitComps
        </div>
      </Link>
    );
  }
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <LuckyMark className="h-7 w-7 shrink-0" />
      <div className="font-display text-[15px] font-semibold tracking-[-0.03em] text-foreground leading-none">
        LuckyGitComps
      </div>
    </Link>
  );
}