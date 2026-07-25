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
      : "h-16 sm:h-20 md:h-24 w-auto -my-3 md:-my-5";
  return (
    <Link
      to="/"
      aria-label="LuckyGitComps home"
      className={`inline-flex items-center ${className}`}
    >
      <img
        src={logoLockup}
        alt="LuckyGitComps"
        className={`${sizing} object-contain max-w-none translate-x-[9%]`}
        width={1536}
        height={1024}
        loading="eager"
      />
    </Link>
  );
}