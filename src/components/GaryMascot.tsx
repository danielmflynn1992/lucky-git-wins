import type { SVGProps } from "react";

/**
 * Gary the Git — a smug four-leaf clover with a flat cap, wink, and golden ticket.
 * Flat 2-3 colour vector. Scales cleanly from favicon to hero.
 */
export function GaryMascot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Gary the Git mascot"
      role="img"
      {...props}
    >
      {/* Golden ticket held between two leaves */}
      <g transform="translate(120 120) rotate(20)">
        <rect x="0" y="0" width="70" height="26" rx="4" fill="#F5B700" stroke="#1A1A1A" strokeWidth="3" />
        <circle cx="0" cy="13" r="4" fill="#FFF8ED" stroke="#1A1A1A" strokeWidth="2" />
        <circle cx="70" cy="13" r="4" fill="#FFF8ED" stroke="#1A1A1A" strokeWidth="2" />
        <line x1="18" y1="6" x2="18" y2="20" stroke="#1A1A1A" strokeWidth="2" strokeDasharray="2 2" />
        <text x="34" y="18" fontFamily="Fraunces, serif" fontSize="12" fontWeight="700" fill="#1A1A1A">GIT</text>
      </g>

      {/* Four-leaf clover body */}
      <g transform="translate(100 100)">
        {/* stem */}
        <path d="M 0 40 Q -4 60 -2 80" stroke="#0F5132" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* leaves - four hearts */}
        <path
          d="M 0 0 C 0 -18 -22 -30 -32 -20 C -42 -10 -34 12 -12 20 C -6 22 0 22 0 12 Z"
          fill="#0F5132" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round"
        />
        <path
          d="M 0 0 C 18 0 30 -22 20 -32 C 10 -42 -12 -34 -20 -12 C -22 -6 -22 0 -12 0 Z"
          transform="translate(0 0)"
          fill="#1a7a4b" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round"
        />
        <path
          d="M 0 0 C 0 18 22 30 32 20 C 42 10 34 -12 12 -20 C 6 -22 0 -22 0 -12 Z"
          fill="#0F5132" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round"
        />
        <path
          d="M 0 0 C -18 0 -30 22 -20 32 C -10 42 12 34 20 12 C 22 6 22 0 12 0 Z"
          fill="#1a7a4b" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round"
        />
        {/* center dot */}
        <circle cx="0" cy="0" r="4" fill="#0a3d24" />
      </g>

      {/* Face — eyes + smug grin */}
      <g transform="translate(100 100)">
        {/* winking left eye (closed) */}
        <path d="M -14 -4 Q -8 -8 -2 -4" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* right eye open with raised brow */}
        <circle cx="10" cy="-4" r="2.8" fill="#1A1A1A" />
        <path d="M 4 -12 Q 10 -16 16 -12" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* smug grin */}
        <path d="M -8 8 Q 0 16 12 10" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* cheek */}
        <circle cx="-14" cy="6" r="3" fill="#FF3D81" opacity="0.6" />
      </g>

      {/* Flat cap tilted */}
      <g transform="translate(100 70) rotate(-14)">
        <ellipse cx="0" cy="8" rx="34" ry="6" fill="#1A1A1A" />
        <path
          d="M -30 4 Q -28 -14 0 -16 Q 28 -14 30 4 Z"
          fill="#1A1A1A"
        />
        <path d="M -14 -14 L 14 -14" stroke="#3a3a3a" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

/** Compact favicon-safe variant (drops the ticket & cap details). */
export function GaryGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g transform="translate(50 55)">
        <path d="M 0 0 C 0 -16 -20 -26 -28 -18 C -36 -10 -28 8 -10 16 C -4 18 0 18 0 10 Z" fill="#0F5132" />
        <path d="M 0 0 C 16 0 26 -20 18 -28 C 10 -36 -8 -28 -16 -10 C -18 -4 -18 0 -10 0 Z" fill="#0F5132" />
        <path d="M 0 0 C 0 16 20 26 28 18 C 36 10 28 -8 10 -16 C 4 -18 0 -18 0 -10 Z" fill="#0F5132" />
        <path d="M 0 0 C -16 0 -26 20 -18 28 C -10 36 8 28 16 10 C 18 4 18 0 10 0 Z" fill="#0F5132" />
        <circle cx="0" cy="0" r="3" fill="#F5B700" />
      </g>
    </svg>
  );
}