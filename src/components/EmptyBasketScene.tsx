/**
 * EmptyBasketScene — a blank entry coupon, nothing marked.
 * The zero-item fallback for /checkout and the basket drawer. Geometry and
 * type only: no character illustration (Terry is image assets only).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
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

export function EmptyBasketScene({ compact = false }: { compact?: boolean }) {
  // Random per visit, but chosen after mount so SSR and client agree.
  const [headline, setHeadline] = useState(HEADLINES[0]);
  useEffect(() => {
    setHeadline(HEADLINES[Math.floor(Math.random() * HEADLINES.length)]);
  }, []);

  const { data: comps = [] } = useQuery(allCompetitionsQueryOptions);
  const nearlyGone = useMemo(() => {
    // The query already returns only live, non-demo competitions.
    const live = comps.filter((c) => c.totalTickets > 0);
    const scored = live
      .map((c) => ({ c, pct: (c.ticketsSold / c.totalTickets) * 100, left: c.totalTickets - c.ticketsSold }))
      .filter((x) => x.pct >= 80)
      .sort((a, b) => b.pct - a.pct);
    return scored[0] ?? null;
  }, [comps]);

  return (
    <div className="text-center">
      <BlankCoupon compact={compact} />

      <h1
        className={
          "mt-5 font-display tracking-tight " +
          (compact ? "text-xl" : "text-3xl md:text-4xl")
        }
      >
        {headline}
      </h1>

      {!compact && (
        <p className="mt-2 text-muted-foreground">Pick a comp and I'll get the stamp out.</p>
      )}

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild variant="gold" size={compact ? "default" : "lg"} className="w-full sm:w-auto">
          <Link to="/competitions">Have a look at the comps</Link>
        </Button>
        {!compact && nearlyGone && (
          <Button
            asChild
            variant="cream"
            size="lg"
            className="h-auto w-full max-w-full whitespace-normal rounded-none border-2 border-[#1B2A4A] bg-[#F5EFE0] px-5 py-3 text-center font-bold leading-snug text-[#1B2A4A] shadow-none hover:bg-[#EFE6D2] sm:w-auto"
          >
            <Link to="/competitions/$slug" params={{ slug: nearlyGone.c.slug }}>
              <span>
                Nearly gone: {nearlyGone.c.title} · {nearlyGone.left} left
              </span>
              <ChevronRight className="ml-1 h-4 w-4 shrink-0" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * BlankCoupon — 499 empty squares, a stamp resting on its pad. Pure geometry.
 * The pulsing square is picked once on mount so SSR and client agree.
 */
function BlankCoupon({ compact = false }: { compact?: boolean }) {
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);
  useEffect(() => {
    setPulseIndex(Math.floor(Math.random() * 499));
  }, []);

  return (
    <div
      className={
        "empty-coupon relative mx-auto " + (compact ? "max-w-[220px] pr-6" : "max-w-[300px] pr-8")
      }
      role="img"
      aria-label="A blank Lucky Git Comps entry coupon: 499 empty squares, none marked, with an idle rubber stamp resting on its ink pad."
    >
      <div className="empty-coupon-sheet relative -rotate-[1.5deg] border-2 border-[#1B2A4A] bg-[#F5EFE0] shadow-[0_10px_24px_-12px_rgba(11,20,15,0.45)]">
        {/* aged paper texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:radial-gradient(rgba(27,42,74,0.10)_0.5px,transparent_0.5px)] [background-size:4px_4px]" />

        <div className="bg-[#1B2A4A] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-[#F5EFE0]">
          Lucky Git Comps · Entry Coupon
        </div>
        <div className="flex items-end gap-2 border-b border-[#1B2A4A]/40 px-2 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-[#1B2A4A]/70">
          <span>Marks</span>
          <span className="h-[9px] flex-1 border-b border-[#1B2A4A]/50" />
        </div>

        <div className="grid grid-cols-[repeat(22,minmax(0,1fr))] gap-px p-2">
          {Array.from({ length: 499 }).map((_, i) => (
            <span
              key={i}
              className={
                "aspect-square border border-[#1B2A4A]/45 bg-transparent transition-colors duration-150 hover:bg-[#1B2A4A]/20" +
                (i === pulseIndex ? " coupon-square-pulse" : "")
              }
            />
          ))}
        </div>

        {/* faint red ink smudge */}
        <span className="pointer-events-none absolute -bottom-1 left-6 h-4 w-16 rotate-[-9deg] rounded-[50%] bg-[#C8102E] opacity-[0.12]" />
      </div>

      {/* rubber stamp on its pad, overlapping the coupon corner */}
      <div className="pointer-events-none absolute -right-1 top-2 rotate-[8deg]">
        <div className="mx-auto h-5 w-3 rounded-t-full bg-[#241C16]" />
        <div className="mx-auto h-1.5 w-8 rounded-sm bg-[#241C16]" />
        <div className="mx-auto h-2.5 w-6 bg-[#8A6A45]" />
        <div className="mt-1 h-4 w-12 border-2 border-[#1B2A4A] bg-[#2E3B57]" />
      </div>
    </div>
  );
}