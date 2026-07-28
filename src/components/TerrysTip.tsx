import { Link } from "@tanstack/react-router";
import terryImg from "../assets/terry-cutout.webp.asset.json";

/**
 * Terry's Tip of the Week — rotates on the ISO week number so everyone sees
 * the same tip at the same time. Every tip points at responsible play; none
 * of them sell anything.
 */
const TIPS = [
  "Terry says: set a budget, stick to it, and never trust a man selling watches out of a suitcase.",
  "Terry says: it's a couple of quid and a laugh. If it stops being either, have a word with yourself — or with us.",
  "Terry says: the odds are on every card because you deserve to know them. Read them.",
  "Terry says: skint? Sit this one out. The stall's here next week.",
  "Terry says: winners are drawn by a machine. Terry has never once influenced it, whatever he claims on Fridays.",
] as const;

/** ISO week number — stable for everyone in the same week. */
function isoWeek(d = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - start.getTime()) / 86_400_000 + 1) / 7);
}

export function TerrysTip({ className = "" }: { className?: string }) {
  const tip = TIPS[isoWeek() % TIPS.length];
  return (
    <Link
      to="/responsible-play"
      className={`group block border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] hover:bg-[var(--color-ink-yellow)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink-red)] ${className}`}
    >
      {/* Masthead — cut-out Terry sits directly on the blue bar, no frame. */}
      <div className="flex items-center gap-2 bg-[var(--color-ink-blue)] h-10 pl-2 pr-3">
        <img
          src={terryImg.url}
          alt="Terry, the Lucky Git Comps mascot"
          width={101}
          height={128}
          decoding="async"
          loading="lazy"
          className="pointer-events-none h-9 w-auto shrink-0 select-none object-contain"
        />
        <span className="font-body font-bold uppercase tracking-[0.16em] text-[9px] text-[var(--color-paper)]">
          Terry's tip of the week
        </span>
      </div>
      <div className="flex items-start gap-3 p-3">
        <div className="min-w-0">
          <p className="font-body text-sm leading-snug text-[var(--color-ink-black)]">{tip}</p>
          <span className="mt-1.5 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-blue)] underline">
            Playing sensibly →
          </span>
        </div>
      </div>
    </Link>
  );
}