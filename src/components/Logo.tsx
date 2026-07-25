import { Link } from "@tanstack/react-router";

/**
 * The Smug Smile — a cool, off-centre grin with sunglasses
 * and a mint sparkle. Scales cleanly from h-8 to h-16+.
 */
export function SmugSmile({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Gold face */}
      <circle cx="32" cy="34" r="26" fill="#FBBF24" />
      {/* Sunglasses bridge */}
      <path
        d="M20 28 H44"
        stroke="#0B0B0B"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Left lens */}
      <path
        d="M13 27 Q13 24 16 24 H26 Q29 24 29 27 L27 33 Q26 35 24 35 H18 Q16 35 15 33 Z"
        fill="#0B0B0B"
      />
      {/* Right lens */}
      <path
        d="M35 27 Q35 24 38 24 H48 Q51 24 51 27 L49 33 Q48 35 46 35 H40 Q38 35 37 33 Z"
        fill="#0B0B0B"
      />
      {/* Lens glare */}
      <path d="M17 26 L20 26 L18 30 Z" fill="#FFFFFF" opacity="0.35" />
      <path d="M39 26 L42 26 L40 30 Z" fill="#FFFFFF" opacity="0.35" />
      {/* Off-centre smirk — pulled to the right */}
      <path
        d="M22 44 Q31 52 44 45"
        stroke="#0B0B0B"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Mint luck sparkle, top-right */}
      <g transform="translate(48 8)">
        <path
          d="M8 0 L9.6 6.4 L16 8 L9.6 9.6 L8 16 L6.4 9.6 L0 8 L6.4 6.4 Z"
          fill="#10B77F"
        />
      </g>
    </svg>
  );
}

function Wordmark({ size }: { size: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg"
      ? "text-2xl"
      : size === "md"
        ? "text-lg"
        : "text-[15px]";
  return (
    <div
      className={`font-display font-extrabold tracking-[-0.045em] leading-none ${cls}`}
    >
      <span className="text-foreground">LuckyGit</span>
      <span className="text-clover">Comps</span>
    </div>
  );
}

export function Logo({ variant = "horizontal", className = "" }: { variant?: "horizontal" | "stacked"; className?: string }) {
  if (variant === "stacked") {
    return (
      <Link
        to="/"
        aria-label="LuckyGitComps home"
        className={`inline-flex flex-col items-center gap-2 ${className}`}
      >
        <SmugSmile className="h-16 w-16" />
        <Wordmark size="lg" />
      </Link>
    );
  }
  return (
    <Link
      to="/"
      aria-label="LuckyGitComps home"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <SmugSmile className="h-10 w-10 shrink-0" />
      <Wordmark size="sm" />
    </Link>
  );
}