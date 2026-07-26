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
 * Crops the raster crest to a circle so only the portrait roundel shows
 * (the ribbon banner is masked out), then adds a pressed-into-paper effect:
 * inset highlight on the top-left inner edge and a low ambient drop shadow
 * beneath. The whole circle is the tap target and it links home. Sizing is
 * driven by the parent so a scroll-shrink parent can swap it.
 */
export function WaxSeal({
  size = "h-[88px] w-[88px]",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return (
    <Link
      to="/"
      aria-label="Lucky Git Comps — home"
      className={`group relative inline-flex items-center justify-center rounded-full ${size} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)] focus-visible:ring-[var(--color-ink-green)] wax-seal-transition ${className}`}
      style={{
        filter: "drop-shadow(0 4px 12px rgba(60, 50, 30, 0.35))",
      }}
    >
      <span
        aria-hidden="true"
        className="block h-full w-full rounded-full overflow-hidden bg-[var(--color-paper-raised)]"
        style={{
          boxShadow:
            "inset 1px 1px 0 rgba(255,255,255,0.55), inset -1px -1px 0 rgba(60,50,30,0.15), 0 0 0 1px rgba(60,50,30,0.18)",
        }}
      >
        <img
          src={CREST_URL}
          alt="Lucky Git Comps"
          width={1400}
          height={1400}
          loading="eager"
          className="block h-full w-full object-cover mix-blend-multiply"
        />
      </span>
    </Link>
  );
}