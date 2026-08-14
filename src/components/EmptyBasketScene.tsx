/**
 * EmptyBasketScene — a single unmarked ticket stub, type-led.
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
      <UnmarkedStub compact={compact} />

      <h1
        className={
          "mx-auto mt-8 max-w-[16ch] font-display tracking-tight " +
          (compact ? "text-xl" : "text-[32px] leading-[1.1] md:text-4xl")
        }
      >
        {headline}
      </h1>

      {!compact && (
        <p className="mt-3 text-muted-foreground">Pick a comp and I'll get the stamp out.</p>
      )}

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
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
 * UnmarkedStub — one small ticket stub: border, perforated edge, type.
 * Exported as the site-wide empty-state device.
 */
export function UnmarkedStub({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        "empty-stub relative mx-auto flex flex-col justify-center border-2 border-[#1B2A4A] bg-[#F5EFE0] pl-6 pr-4 shadow-[0_10px_24px_-12px_rgba(11,20,15,0.45)] " +
        (compact ? "h-[74px] max-w-[210px]" : "h-[90px] max-w-[260px]")
      }
      role="img"
      aria-label="An unmarked Lucky Git Comps ticket stub."
    >
      {/* perforated left edge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[10px] w-[2px]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, #1B2A4A 0 4px, transparent 4px 9px)",
        }}
      />
      <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#1B2A4A]">
        Lucky Git Comps
      </div>
      <div className="my-1.5 h-px w-full bg-[#1B2A4A]/50" />
      <div
        className={
          "font-display uppercase leading-none tracking-[0.18em] text-[#1B2A4A] " +
          (compact ? "text-xl" : "text-2xl")
        }
      >
        Unmarked
      </div>
    </div>
  );
}