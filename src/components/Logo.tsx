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

export function Logo({
  variant = "horizontal",
  onDark = false,
  className = "",
}: { variant?: "horizontal" | "stacked"; onDark?: boolean; className?: string }) {
  const sizing =
    variant === "stacked"
      ? "h-20 w-auto"
      : "h-14 sm:h-16 md:h-20 lg:h-24 w-auto";
  // On the aged paper background the crest's cream halo blends; on dark
  // surfaces (footer) we need to lift the cream so it doesn't read as a
  // dirty rectangle. mix-blend-screen keeps the ink readable on green.
  const blend = onDark
    ? "mix-blend-screen opacity-95"
    : "mix-blend-multiply drop-shadow-[0_2px_0_rgba(0,0,0,0.08)]";
  return (
    <Link
      to="/"
      aria-label="Lucky Git Comps — home"
      className={`inline-flex items-center ${className}`}
    >
      <img
        src={CREST_URL}
        alt="Lucky Git Comps"
        className={`${sizing} object-contain max-w-none ${blend}`}
        width={1420}
        height={800}
        loading="eager"
      />
    </Link>
  );
}