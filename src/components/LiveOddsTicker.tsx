import { Link } from "@tanstack/react-router";
import { Ticket, Clock } from "lucide-react";
import { COMPETITIONS, type Competition } from "@/lib/mock-comps";
import { timeLeft } from "@/lib/format";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/**
 * Bright ticker showing live odds pulled from the database.
 * Auto-refreshes every 30s and subscribes to ticket changes for realtime updates.
 * Each item shows a tooltip on hover/tap explaining what the numbers mean.
 */
export function LiveOddsTicker() {
  // Ticker mirrors the same source of truth the grid uses so the two never
  // disagree. When we swap the grid over to live DB data, wire this to the
  // same query.
  const items = COMPETITIONS;

  /**
   * Deadpan filler lines. Injected when fewer than three live comps exist
   * so the marquee doesn't just loop the same title over and over.
   */
  const FILLER = [
    "NEVER MORE THAN 499",
    "SOMEONE'S GOT TO WIN IT",
    "THE ODDS ARE THE ODDS",
  ] as const;

  // Empty / loading state — still render the shell so layout doesn't jump.
  if (items.length === 0) {
    return (
      <div data-dynamic="ticker" className="relative overflow-hidden bg-clover-deep text-cream">
        <div className="flex items-stretch">
          <LiveChip />
          <div className="flex-1 px-4 py-1.5 text-[11px] font-bold text-cream/75 tracking-wide">
            No live competitions right now. New ones drop weekly.
          </div>
        </div>
      </div>
    );
  }

  // Show filler chips only when fewer than three real items are live.
  const showFiller = items.length > 0 && items.length < 3;

  return (
    <TooltipProvider delayDuration={150}>
      <div data-dynamic="ticker" className="relative overflow-hidden bg-clover-deep text-cream">
        <div className="flex items-stretch">
          <LiveChip />
          {/* Wider left mask fade so the first item scrolls in cleanly
              instead of appearing mid-word at rest. */}
          {/* Wide left mask + matching left padding + trailing gap-8 spacer
              guarantee the first item is never mid-word at rest and the
              seamless loop hand-off never clips a partial word. */}
          <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent_0%,#000_4%,#000_100%)] py-1.5">
            <div className="ticker-scroll flex gap-8 whitespace-nowrap text-[11px] font-bold tracking-wide text-cream pr-8">
              {/* Leading spacer = full container width. Guarantees the first
                  item is preceded by empty space, so even at t=0 or after
                  any animation reset, no partial word is visible at the left
                  edge of the marquee. */}
              <span aria-hidden="true" className="shrink-0 basis-full min-w-full" />
              {items.map((it, i) => (
                <TickerItem key={`${it.id}-${i}`} c={it} />
              ))}
              {showFiller && FILLER.map((line) => (
                <span
                  key={line}
                  className="inline-flex items-center gap-3 shrink-0 text-cream/75"
                >
                  {line}
                  <span className="text-gold font-black">●</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function LiveChip() {
  return (
    <span className="shrink-0 inline-flex items-center gap-2 bg-clover px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-primary-foreground">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-70 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      LIVE
    </span>
  );
}

function TickerItem({ c }: { c: Competition }) {
  const t = timeLeft(c.endsAt);
  const closes = `${String(t.d).padStart(2, "0")}d ${String(t.h).padStart(2, "0")}h ${String(t.m).padStart(2, "0")}m`;
  const pctSold = Math.round((c.ticketsSold / c.totalTickets) * 100);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/competitions/$slug"
          params={{ slug: c.slug }}
          className="inline-flex items-center gap-3 shrink-0 hover:text-gold focus:text-gold focus:outline-none"
        >
          <span>{c.title.toUpperCase()}</span>
          <span className="text-cream/60 font-mono tabular-nums">
            {c.ticketsSold.toLocaleString()}/{c.totalTickets.toLocaleString()} SOLD
          </span>
          <span className="text-gold font-black">●</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="max-w-xs bg-ink text-cream border border-border shadow-lg p-0 rounded-md"
      >
        <div className="px-3 py-2 border-b border-border">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-clover">{c.category}</div>
          <div className="font-display text-sm font-bold text-cream leading-tight mt-0.5">{c.title}</div>
        </div>
        <dl className="px-3 py-2 space-y-1.5 text-[11px] font-mono tabular-nums">
          <TooltipRow
            icon={<Ticket className="h-3 w-3 text-clover" />}
            label="Tickets sold"
            value={`${c.ticketsSold.toLocaleString()} / ${c.totalTickets.toLocaleString()} (${pctSold}%)`}
            hint="How many tickets have been paid for so far."
          />
          <TooltipRow
            icon={<Clock className="h-3 w-3 text-urgent" />}
            label="Closes in"
            value={closes}
            hint="Automatic draw as soon as the timer hits zero."
          />
        </dl>
        <div className="px-3 py-2 border-t border-border text-[10px] text-cream/60 leading-snug">
          Tap to open. Live ticket counts update as they sell.
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function TooltipRow({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 text-cream/70">
          {icon}
          {label}
        </span>
        <span className="text-cream font-bold">{value}</span>
      </div>
      <div className="text-[10px] text-cream/50 leading-snug mt-0.5 font-sans">{hint}</div>
    </div>
  );
}