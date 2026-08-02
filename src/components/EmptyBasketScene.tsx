/**
 * EmptyBasketScene — "Terry's on his break".
 * The zero-item fallback for /checkout and the basket drawer. Terry is
 * content, not disappointed: no guilt, no exclamation marks, no bouncing.
 * Drawn inline as SVG so the small idle motions (steam, blink, newspaper
 * corner) can loop calmly and be switched off under reduced motion.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { allCompetitionsQueryOptions } from "@/lib/competitions-api";

const HEADLINES = [
  "Nowt in the basket. I'll be here.",
  "Quiet one tonight.",
  "Basket's emptier than my fridge.",
  "Stall's open. Nobody's shopping.",
  "Not a single mark on that coupon.",
  "Take your time. I'm not going anywhere.",
  "No rush. Tea's still hot.",
];

const WAKE_LINE = "Alright, alright. What we having?";

export function EmptyBasketScene({ compact = false }: { compact?: boolean }) {
  // Random per visit, but chosen after mount so SSR and client agree.
  const [headline, setHeadline] = useState(HEADLINES[0]);
  useEffect(() => {
    setHeadline(HEADLINES[Math.floor(Math.random() * HEADLINES.length)]);
  }, []);

  const [awake, setAwake] = useState(false);
  const wakeTimer = useRef<number | null>(null);
  useEffect(() => () => { if (wakeTimer.current) window.clearTimeout(wakeTimer.current); }, []);

  const wake = () => {
    setAwake(true);
    if (wakeTimer.current) window.clearTimeout(wakeTimer.current);
    wakeTimer.current = window.setTimeout(() => setAwake(false), 5000);
  };

  const { data: comps = [] } = useQuery(allCompetitionsQueryOptions);
  const nearlyGone = useMemo(() => {
    // The query already returns only live, non-demo competitions.
    const live = comps.filter((c) => c.totalTickets > 0);
    const scored = live
      .map((c) => ({ c, pct: (c.ticketsSold / c.totalTickets) * 100 }))
      .filter((x) => x.pct >= 80)
      .sort((a, b) => b.pct - a.pct);
    return scored[0]?.c ?? null;
  }, [comps]);

  return (
    <div className={compact ? "text-center" : "text-center"}>
      <button
        type="button"
        onClick={wake}
        aria-label="Give Terry a nudge"
        className="mx-auto block w-full max-w-md cursor-pointer bg-transparent p-0"
      >
        <TerryOnBreak awake={awake} className={compact ? "mx-auto w-48" : "mx-auto w-full max-w-sm"} />
      </button>

      <h1
        className={
          "mt-5 font-display tracking-tight " +
          (compact ? "text-xl" : "text-3xl md:text-4xl")
        }
      >
        {headline}
      </h1>

      <div className="mt-2 min-h-[1.5rem]" aria-live="polite">
        {awake ? (
          <p className="font-mono text-sm text-[var(--color-ink-red,#c0392b)]">{WAKE_LINE}</p>
        ) : (
          !compact && (
            <p className="text-muted-foreground">Pick a comp and I'll get the stamp out.</p>
          )
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="gold" size={compact ? "default" : "lg"}>
          <Link to="/competitions">Have a look at the comps</Link>
        </Button>
        {!compact && nearlyGone && (
          <Button
            asChild
            size="lg"
            className="rounded-none border-2 border-[#1B2A4A] bg-[#F5EFE0] px-5 font-bold text-[#1B2A4A] shadow-none hover:bg-[#EFE6D2]"
          >
            <Link
              to="/competitions/$slug"
              params={{ slug: nearlyGone.slug }}
              className="inline-flex items-center gap-2"
            >
              <span>
                Nearly gone: {nearlyGone.title} ·{" "}
                {Math.max(nearlyGone.totalTickets - nearlyGone.ticketsSold, 0)} left
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Quiet-shift stall scene, drawn to match the header-logo Terry: heavy black
 * ink outlines, flat brand fills (red / cream / navy), halftone dot shading on
 * the shadow side and a 1px red misregistration ghost. Chair tipped back, feet
 * crossed on the counter, mug in one hand, folded paper in the other.
 */
const RED = "#C8102E";
const CREAM = "#F5EFE0";
const NAVY = "#1B2A4A";

function TerryOnBreak({ awake, className = "" }: { awake: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 320 156"
      className={"terry-break h-auto " + className + (awake ? " is-awake" : "")}
      role="img"
      aria-label="Terry on his break behind the market stall: chair tipped back, feet crossed on the counter, mug of tea in one hand and a folded newspaper in the other, with a blank coupon and an idle rubber stamp beside him."
    >
      <defs>
        {/* aged pools-coupon grid */}
        <pattern id="tb-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill={CREAM} />
          <path d="M10 0 V10 M0 10 H10" stroke={NAVY} strokeOpacity="0.1" strokeWidth="0.7" />
        </pattern>
        {/* halftone shading dots */}
        <pattern id="tb-halftone" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1.4" cy="1.4" r="1.05" fill="#111" fillOpacity="0.28" />
        </pattern>
        <pattern id="tb-stripe" width="26" height="8" patternUnits="userSpaceOnUse">
          <rect width="13" height="8" fill={RED} />
          <rect x="13" width="13" height="8" fill={CREAM} />
        </pattern>
      </defs>

      {/* aged paper ground */}
      <rect width="320" height="156" fill="url(#tb-grid)" />
      <rect width="320" height="156" fill="#C8A96A" fillOpacity="0.12" />

      {/* misregistration ghost of the main forms */}
      <g transform="translate(1.4,-1.4)" opacity="0.22" fill={RED} stroke="none">
        <rect x="14" y="8" width="292" height="17" />
        <rect x="30" y="112" width="264" height="9" />
      </g>

      <g stroke="#111" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {/* awning + posts */}
        <rect x="14" y="8" width="292" height="17" fill="url(#tb-stripe)" />
        <path
          d="M14 25 q13.27 11 26.55 0 q13.27 11 26.55 0 q13.27 11 26.55 0 q13.27 11 26.55 0 q13.27 11 26.55 0 q13.27 11 26.55 0 q13.27 11 26.55 0 q13.27 11 26.55 0 q13.27 11 26.55 0 q13.27 11 26.55 0 q13.27 11 26.55 0"
          fill="url(#tb-stripe)"
        />
        <rect x="24" y="25" width="7" height="122" fill={CREAM} />
        <rect x="289" y="25" width="7" height="122" fill={CREAM} />

        {/* chair, tipped back on two legs, and Terry */}
        <g className="terry-body">
          <path d="M86 122 l6-52 M92 70 h16" fill="none" />
          <path d="M84 122 l14 -14 M120 122 l-4 -12" fill="none" />

          {/* legs, crossed, resting on the counter */}
          <path d="M138 100 q30 6 48 7 q8 1 12 3" fill="none" strokeWidth="9" stroke={NAVY} />
          <path d="M138 108 q32 9 50 3 q8 -3 12 -1" fill="none" strokeWidth="9" stroke={NAVY} />
          {/* crossed shoes resting on the counter edge */}
          <path d="M196 100 q4 -4 8 -1 q2 3 8 4 q6 1 6 5 h-24 z" fill="#111" />
          <path d="M198 109 q4 -4 8 -1 q2 3 8 4 q6 1 6 5 h-24 z" fill="#111" />

          {/* red jacket */}
          <path d="M100 116 q-4 -34 12 -44 h22 q16 8 14 44 z" fill={RED} />
          <path d="M126 74 q10 16 8 42" fill="none" strokeWidth="1.6" />
          {/* sheepskin collar */}
          <path
            d="M104 76 q6 -10 16 -8 q10 -2 16 8 q-8 8 -16 6 q-9 2 -16 -6 z"
            fill={CREAM}
          />
          {/* halftone shadow side of the jacket */}
          <path d="M132 74 q14 10 12 42 h-12 z" fill="url(#tb-halftone)" stroke="none" />

          {/* head */}
          <circle cx="120" cy="52" r="17" fill={CREAM} />
          <path d="M133 42 a17 17 0 0 1 -3 25 q10 -12 3 -25 z" fill="url(#tb-halftone)" stroke="none" />
          {/* dark quiff sweeping forward + cap pushed back off the forehead */}
          <path d="M104 46 q3 -16 20 -14 q10 1 13 8 q-9 -4 -18 -1 q-9 3 -12 9 z" fill="#111" />
          <path d="M114 33 q17 -7 27 4 l2 5 q-16 -7 -30 -3 z" fill={NAVY} />
          <path d="M114 33 q17 -7 27 4" fill="none" strokeWidth="1.6" />
          {/* arched brow, eyes, smirk, jaw */}
          <g className="terry-eyes">
            <path d="M110 49 q4 -4 8 -1" fill="none" strokeWidth="2" />
            <circle cx="114" cy="53" r="2" fill="#111" stroke="none" />
            <path d="M124 50 q4 -3 7 0" fill="none" strokeWidth="2" />
            <circle cx="127" cy="54" r="2" fill="#111" stroke="none" />
          </g>
          <path d="M112 62 q8 5 15 -2" fill="none" strokeWidth="2" />
          <path d="M108 63 q10 9 22 2" fill="none" strokeWidth="1.4" />

          {/* arm + hand on the mug */}
          <path d="M136 88 q16 4 20 12" fill="none" strokeWidth="8" stroke={RED} />
          <g className="terry-mug">
            <path d="M150 98 h20 v12 q0 7 -10 7 q-10 0 -10 -7 z" fill={CREAM} />
            <path d="M170 101 q8 0 8 5 q0 5 -8 5" fill="none" />
          </g>

          {/* arm + folded newspaper */}
          <path d="M104 90 q-10 2 -14 8" fill="none" strokeWidth="8" stroke={RED} />
          <g className="terry-paper">
            <path d="M62 108 h42 v-30 h-42 z" fill={CREAM} />
            <text
              x="65"
              y="86"
              fontSize="4.2"
              fontFamily="monospace"
              fontWeight="700"
              fill="#111"
              stroke="none"
            >
              POOLS LATEST
            </text>
            <path d="M66 92 h34 M66 96 h34 M66 100 h24" strokeWidth="1" />
            <path className="paper-corner" d="M104 78 l-11 4 l11 7 z" fill="url(#tb-halftone)" />
          </g>
        </g>

        {/* steam */}
        <g className="terry-steam" stroke="#111" strokeOpacity="0.5" strokeWidth="1.6" fill="none">
          <path className="steam-1" d="M156 94 q5 -7 0 -13 q-5 -6 0 -11" />
          <path className="steam-2" d="M166 94 q5 -7 0 -13 q-5 -6 0 -11" />
        </g>

        {/* counter */}
        <rect x="30" y="112" width="264" height="9" fill={NAVY} />
        <rect x="30" y="121" width="264" height="26" fill={CREAM} />
        <path d="M30 129 h264" strokeWidth="1.2" strokeOpacity="0.5" />

        {/* blank 499 coupon */}
        <g>
          <rect x="228" y="94" width="34" height="18" fill={CREAM} />
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 8 }).map((__, c) => (
              <rect
                key={`${r}-${c}`}
                x={230 + c * 4}
                y={96 + r * 4}
                width="3"
                height="3"
                strokeWidth="0.5"
                fill="none"
              />
            )),
          )}
        </g>
        {/* ink bottle, rubber stamp on its pad */}
        <g>
          <rect x="265" y="102" width="9" height="10" fill={NAVY} />
          <rect x="267" y="98" width="5" height="4" fill="#111" />
          <rect x="276" y="106" width="16" height="6" fill={NAVY} />
          <rect x="279" y="99" width="10" height="7" fill="#111" />
          <rect x="281" y="93" width="6" height="6" fill={CREAM} />
        </g>
        {/* biro on a string, tethered to the stall post */}
        <g>
          <path d="M31 100 q6 6 8 10" strokeWidth="1" fill="none" />
          <path d="M39 110 l16 -3" strokeWidth="3" stroke={NAVY} />
          <path d="M55 107 l4 -1" strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}