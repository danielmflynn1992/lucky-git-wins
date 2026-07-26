import { Link } from "@tanstack/react-router";
import crest from "@/assets/lucky-git-seal.png.asset.json";
import lockupImage from "@/assets/lockups/lockup-horizontal-v2.png.asset.json";

const CREST_URL = crest.url;
const LOCKUP_URL = lockupImage.url;

/**
 * StampSeal — the crest at scale, used as a static stamp on non-scrolling
 * surfaces (homepage hero, checkout confirmation, draw reveal, footer).
 *
 * The source PNG has a cream disc baked in around the engraved ring; the
 * clip-path crops to a perfect circle so it reads as a transparent stamp
 * on paper. No wrapper disc, ring, or drop shadow — it sits FLAT on the
 * page, not floating.
 *
 * `angle` prop rotates the seal for the "stamped in ink" effect on
 * receipts / confirmations. `tone="cream"` inverts it for dark surfaces.
 */
export function StampSeal({
  size = 140,
  angle = 0,
  tone = "ink",
  className = "",
  as = "div",
}: {
  size?: number;
  angle?: number;
  tone?: "ink" | "cream";
  className?: string;
  as?: "div" | "a";
}) {
  const Tag: any = as;
  return (
    <Tag
      className={`inline-block ${className}`}
      style={{ width: size, height: size, transform: angle ? `rotate(${angle}deg)` : undefined }}
      aria-hidden="true"
    >
      <img
        src={CREST_URL}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        className={`block h-full w-full object-contain select-none pointer-events-none [clip-path:circle(50%_at_50%_50%)] ${
          tone === "cream" ? "opacity-90 [filter:invert(1)_sepia(0.2)_brightness(1.35)_contrast(0.9)]" : ""
        }`}
      />
    </Tag>
  );
}

/**
 * Lockup — single combined seal + wordmark SVG. Two variants:
 *   - "horizontal": header lockup, seal-left, wordmark-right.
 *   - "stacked":    hero/footer lockup, seal above wordmark.
 *
 * Inlined via dangerouslySetInnerHTML so the SVG's <text> renders with
 * the page's Cormorant Garamond. Fill is controlled via `currentColor`,
 * so wrap in a text-<colour> utility (e.g. text-clover, text-cream).
 *
 * IMPORTANT: every caller MUST bound width. The svg fills its container.
 */
export function Lockup({
  variant = "horizontal",
  className = "",
  style,
  tone = "ink",
}: {
  variant?: "horizontal" | "stacked";
  className?: string;
  style?: React.CSSProperties;
  tone?: "ink" | "cream";
}) {
  // On light (paper) surfaces we still use the raster lockup with
  // mix-blend-multiply to drop the white background cleanly.
  //
  // On DARK / COLOURED surfaces the old approach was `filter: invert()
  // + mix-blend-screen`, which tinted the cream text pink/lilac when
  // laid over a saturated blue/red surface. Instead we render a
  // dedicated cream-ink SVG wordmark using currentColor — no raster,
  // no filter, no hue shift. Wrap in a text-[--color-on-dark-fg]
  // (or similar) container to colour it.
  // The v2 lockup is a printed cream-and-red panel with a two-colour
  // wheeler-dealer mascot on the left and the wordmark on the right.
  // The cream backdrop is part of the artwork, so no blend mode is
  // applied — it reads as a printed sticker on both light paper and
  // dark ink-blue surfaces.
  return (
    <img
      src={LOCKUP_URL}
      alt="Lucky Git Comps"
      draggable={false}
      className={`block object-contain select-none ${
        tone === "cream" ? "" : "mix-blend-multiply"
      } ${className}`}
      style={{ maxWidth: "100%", height: "auto", ...style }}
    />
  );
}

/** Legacy export — renders just the crest as a badge. */
export function SmugSmile({ className = "" }: { className?: string }) {
  return (
    <img
      src={CREST_URL}
      alt=""
      aria-hidden="true"
      className={`${className} [clip-path:circle(50%_at_50%_50%)]`}
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