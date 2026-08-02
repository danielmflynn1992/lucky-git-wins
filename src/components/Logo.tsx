import { Link } from "@tanstack/react-router";
import lockupRed from "@/assets/lockups/lockup-horizontal-v5.png.asset.json";
import lockupCream from "@/assets/lockups/lockup-horizontal-v5.png.asset.json";
import character from "@/assets/terry-panel.png.asset.json";

const LOCKUP_RED_URL = lockupRed.url;
const LOCKUP_CREAM_URL = lockupCream.url;
const CHARACTER_URL = character.url;

export const LOCKUP_HORIZONTAL_URL = LOCKUP_RED_URL;
export const LOCKUP_CREAM_URL_EXPORT = LOCKUP_CREAM_URL;

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
/**
 * StampSeal — a square, character-only stamp used on static surfaces
 * (checkout confirmation, hero, etc.). Uses the winking-mascot square crop.
 * No filters or hue-rotate — the source PNG is the correct colour variant.
 */
export function StampSeal({
  size = 140,
  angle = 0,
  className = "",
  as = "div",
}: {
  size?: number;
  angle?: number;
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
        src={CHARACTER_URL}
        alt="Lucky Git Comps"
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        className="block h-full w-full object-contain select-none pointer-events-none"
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
  // Horizontal masthead banner. No filters, invert, or hue-rotate: we
  // ship two colour variants of the same artwork.
  //   - tone="ink"   → full-colour printed panel (red + cream).
  //   - tone="cream" → single-colour cream silhouette for dark surfaces.
  const src = tone === "cream" ? LOCKUP_CREAM_URL : LOCKUP_RED_URL;
  return (
    <img
      src={src}
      alt="Lucky Git Comps"
      draggable={false}
      className={`block object-contain select-none ${className}`}
      style={{ maxWidth: "100%", height: "auto", ...style }}
    />
  );
}

/** Legacy export kept for back-compat — renders the character stamp. */
export function SmugSmile({ className = "" }: { className?: string }) {
  return (
    <img
      src={CHARACTER_URL}
      alt="Lucky Git Comps"
      className={className}
      width={512}
      height={512}
      loading="lazy"
    />
  );
}

export function Logo({
  className = "",
}: { variant?: "horizontal" | "stacked"; onDark?: boolean; className?: string }) {
  return (
    <Link to="/" aria-label="Lucky Git Comps — home" className={`inline-flex items-center ${className}`}>
      <Lockup style={{ height: 56, width: "auto", maxWidth: "74vw" }} />
    </Link>
  );
}