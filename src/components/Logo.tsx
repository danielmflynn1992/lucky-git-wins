import { Link } from "@tanstack/react-router";
import crest from "@/assets/lucky-git-seal.png.asset.json";

const CREST_URL = crest.url;

/** Legacy export — renders just the crest as a badge. */
export function SmugSmile({ className = "" }: { className?: string }) {
  return (
    <img
      src={CREST_URL}
      alt=""
      aria-hidden="true"
      className={className}
      width={1400}
      height={1400}
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
        width={1400}
        height={1400}
        loading="eager"
      />
    </Link>
  );
}

/**
 * WaxSeal — circular "stamp" variant of the crest for the header.
 *
 * The engraved circle border in the asset itself is the edge of the emblem
 * — no wrapper disc, ring, or background fill. Just the transparent PNG
 * with a soft pressed-into-paper drop shadow beneath. The whole crest is
 * the tap target and links home. Sizing is driven by the parent so a
 * scroll-shrink parent can swap it.
 */
export function WaxSeal({
  size = "h-[76px] w-[76px] md:h-[96px] md:w-[96px]",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return (
    <Link
      to="/"
      aria-label="Lucky Git Comps — home"
      className={`relative inline-flex items-center justify-center ${size} rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)] focus-visible:ring-[var(--color-ink-green)] wax-seal-transition ${className}`}
      style={{
        filter: "drop-shadow(0 3px 10px rgba(60, 50, 30, 0.4))",
      }}
    >
      <img
        src={CREST_URL}
        alt="Lucky Git Comps"
        width={668}
        height={668}
        loading="eager"
        // The raster asset has a solid backing outside the engraved ring.
        // clip-path circle crops it to the engraved edge so no white/cream
        // disc bleeds out from behind the emblem.
        className="block h-full w-full object-contain select-none pointer-events-none [clip-path:circle(50%_at_50%_50%)]"
        draggable={false}
      />
    </Link>
  );
}