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
  const sizing =
    variant === "stacked"
      ? "h-28 w-auto"
      : "h-24 sm:h-28 md:h-32 w-auto -my-6 md:-my-8";
  return (
    <Link
      to="/"
      aria-label="LuckyGitComps home"
      className={`inline-flex items-center ${className}`}
    >
      <img
        src={logoLockup}
        alt="LuckyGitComps"
        className={`${sizing} object-contain max-w-none translate-y-1 md:translate-y-2`}
        width={1536}
        height={1024}
        loading="eager"
      />
    </Link>
  );
}