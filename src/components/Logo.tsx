import { Link } from "@tanstack/react-router";
import crest from "@/assets/crest.png.asset.json";

const CREST_URL = crest.url;

/** Legacy export — renders just the crest as a badge. */
export function SmugSmile({ className = "" }: { className?: string }) {
  return (
    <img
      src={CREST_URL}
      alt=""
      aria-hidden="true"
      className={className}
      width={1420}
      height={800}
      loading="lazy"
    />
  );
}

export function Logo({ variant = "horizontal", className = "" }: { variant?: "horizontal" | "stacked"; className?: string }) {
  const sizing =
    variant === "stacked"
      ? "h-24 w-auto"
      : "h-24 sm:h-28 md:h-40 lg:h-48 w-auto";
  return (
    <Link
      to="/"
      aria-label="Lucky Git Comps — home"
      className={`inline-flex items-center ${className}`}
    >
      <img
        src={CREST_URL}
        alt="Lucky Git Comps"
        className={`${sizing} object-contain max-w-none drop-shadow-[0_2px_0_rgba(0,0,0,0.08)] mix-blend-multiply`}
        width={1420}
        height={800}
        loading="eager"
      />
    </Link>
  );
}