import { Link } from "@tanstack/react-router";
import logoLockup from "@/assets/luckygit-mascot-logo.png";

/** Legacy export kept for any lingering imports — renders the mascot lockup image. */
export function SmugSmile({ className = "" }: { className?: string }) {
  return (
    <img
      src={logoLockup}
      alt=""
      aria-hidden="true"
      className={className}
      width={1536}
      height={1024}
      loading="lazy"
    />
  );
}

export function Logo({ variant = "horizontal", className = "" }: { variant?: "horizontal" | "stacked"; className?: string }) {
  const sizing = variant === "stacked" ? "h-20 w-auto" : "h-11 w-auto";
  return (
    <Link
      to="/"
      aria-label="LuckyGitComps home"
      className={`inline-flex items-center ${className}`}
    >
      <img
        src={logoLockup}
        alt="LuckyGitComps"
        className={`${sizing} object-contain`}
        width={1536}
        height={1024}
        loading="eager"
      />
    </Link>
  );
}