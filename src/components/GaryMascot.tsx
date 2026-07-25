import type { SVGProps } from "react";

/**
 * LuckyMark — abstract geometric four-leaf clover mark.
 * Faceted, gemstone-cut leaves with an emerald→gold gradient and a single
 * asymmetric highlight leaf. No outlines, no faces, no cartoon linework.
 * Exported under the legacy GaryMascot / GaryGlyph names for import compat.
 */
export function GaryMascot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lucky Git Comps mark"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id="lg-emerald" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3BF5A5" />
          <stop offset="100%" stopColor="#00A65E" />
        </linearGradient>
        <linearGradient id="lg-emerald-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00C170" />
          <stop offset="100%" stopColor="#00563A" />
        </linearGradient>
        <linearGradient id="lg-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6EFFB8" />
          <stop offset="100%" stopColor="#00DF81" />
        </linearGradient>
      </defs>

      {/* Four faceted leaves */}
      <g transform="translate(100 100)">
        {/* Top leaf — dark face */}
        <path d="M 0 -6 L 30 -46 L 0 -76 L -30 -46 Z" fill="url(#lg-emerald-dark)" />
        <path d="M 0 -6 L 30 -46 L 0 -46 Z" fill="url(#lg-emerald)" opacity="0.9" />
        {/* Right leaf */}
        <path d="M 6 0 L 46 -30 L 76 0 L 46 30 Z" fill="url(#lg-emerald)" />
        <path d="M 6 0 L 46 -30 L 46 0 Z" fill="url(#lg-emerald-dark)" opacity="0.55" />
        {/* Bottom leaf */}
        <path d="M 0 6 L 30 46 L 0 76 L -30 46 Z" fill="url(#lg-emerald-dark)" />
        <path d="M 0 6 L -30 46 L 0 46 Z" fill="url(#lg-emerald)" opacity="0.9" />
        {/* Left leaf — the highlight (asymmetric offset + gold catch) */}
        <path d="M -8 -2 L -48 -32 L -78 -2 L -48 32 Z" fill="url(#lg-emerald)" />
        <path d="M -8 -2 L -48 -32 L -48 -2 Z" fill="url(#lg-gold)" opacity="0.85" />
        {/* Center — small gold facet */}
        <path d="M 0 -6 L 6 0 L 0 6 L -8 -2 Z" fill="url(#lg-gold)" />
      </g>
    </svg>
  );
}

/** Compact glyph variant — favicon-safe. */
export function GaryGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <GaryMascot {...props} />
  );
}

/** Preferred name going forward. */
export const LuckyMark = GaryMascot;