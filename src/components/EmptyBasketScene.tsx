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
          <Button asChild variant="cream" size="lg">
            <Link to="/competitions/$slug" params={{ slug: nearlyGone.slug }}>
              Nearly gone: {nearlyGone.title}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

/** Quiet-shift stall scene: feet up, tea, folded paper, an idle rubber stamp. */
function TerryOnBreak({ awake, className = "" }: { awake: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={"terry-break h-auto " + className + (awake ? " is-awake" : "")}
      role="img"
      aria-label="Terry behind the stall counter on his break: feet up, mug of tea, folded newspaper, a blank coupon and an idle rubber stamp."
    >
      {/* paper ground */}
      <rect width="320" height="220" fill="var(--color-paper-raised, #F4EFE2)" />
      <g stroke="rgba(17,17,17,0.08)" strokeWidth="1">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1="0" y1={i * 16 + 6} x2="320" y2={i * 16 + 6} />
        ))}
      </g>

      <g fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {/* back awning */}
        <path d="M18 26 h284 M28 26 v14 M292 26 v14" />
        <path d="M28 40 q16 12 32 0 q16 12 32 0 q16 12 32 0 q16 12 32 0 q16 12 32 0 q16 12 32 0 q16 12 32 0"
              fill="var(--color-ink-red, #c0392b)" fillOpacity="0.18" />

        {/* Terry group — sits up slightly when nudged */}
        <g className="terry-body">
          {/* chair + torso */}
          <path d="M84 168 v-34 q0-16 16-16 h30 q16 0 16 16 v34" fill="rgba(27,58,107,0.12)" />
          {/* head */}
          <circle cx="115" cy="100" r="17" fill="var(--color-paper, #FBF3E2)" />
          {/* cap, slightly askew */}
          <path d="M97 94 q18-18 38-6 l2 6 z" fill="#1B3A6B" fillOpacity="0.75" />
          <path d="M95 95 h30" />
          {/* eyes — blink */}
          <g className="terry-eyes">
            <circle cx="109" cy="101" r="1.9" fill="#111" />
            <circle cx="121" cy="101" r="1.9" fill="#111" />
          </g>
          <path d="M109 109 q6 4 12 0" />
          {/* arm holding mug */}
          <path className="terry-arm" d="M132 132 q22 4 30-10" />
          {/* legs up on the counter */}
          <path className="terry-legs" d="M100 168 q-6 26 34 26 h46" />
          <path className="terry-legs" d="M180 194 l14-6 M180 194 l14 6" />
        </g>

        {/* counter */}
        <path d="M150 190 h158 M162 190 v22 M296 190 v22" />

        {/* mug + steam */}
        <g className="terry-mug">
          <path d="M166 168 h22 v14 q0 8-11 8 q-11 0-11-8 z" fill="var(--color-paper, #FBF3E2)" />
          <path d="M188 171 q9 0 9 6 q0 6-9 6" />
        </g>
        <g className="terry-steam" stroke="rgba(17,17,17,0.45)" strokeWidth="1.6" fill="none">
          <path className="steam-1" d="M172 164 q5-7 0-13 q-5-6 0-12" />
          <path className="steam-2" d="M182 164 q5-7 0-13 q-5-6 0-12" />
        </g>

        {/* folded newspaper, corner lifting in the draught */}
        <g className="terry-paper">
          <path d="M206 182 h48 v-18 h-48 z" fill="var(--color-paper, #FBF3E2)" />
          <path d="M212 170 h34 M212 175 h26" strokeWidth="1.4" />
          <path className="paper-corner" d="M254 164 l-10 4 l10 6 z" fill="rgba(17,17,17,0.08)" />
        </g>

        {/* blank coupon + idle rubber stamp — nothing to stamp */}
        <g>
          <path d="M262 184 h34 v-16 h-34 z" fill="var(--color-paper, #FBF3E2)" />
          <path d="M266 173 h26 M266 178 h26" strokeWidth="1.2" />
          <path d="M276 164 h18 v-9 h-18 z" fill="rgba(17,17,17,0.12)" />
          <path d="M282 155 h6 v-6 h-6 z" />
          <path d="M279 149 h12" />
        </g>
      </g>
    </svg>
  );
}