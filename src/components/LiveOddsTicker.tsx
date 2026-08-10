import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ticket, Clock, TrendingUp } from "lucide-react";
import { liveOddsQueryOptions, type LiveOdds } from "@/lib/competitions-api";
import { timeLeft, humanTimeLeft, exactTimeLeft } from "@/lib/format";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/**
 * Bright ticker showing live odds pulled from the database.
 * Auto-refreshes every 30s and subscribes to ticket changes for realtime updates.
 * Each item shows a tooltip on hover/tap explaining what the numbers mean.
 */
export function LiveOddsTicker() {
  // Same source of truth the grid and the odds board read from.
  const { data: items = [] } = useQuery(liveOddsQueryOptions);
  const deltas = useSalesDeltas(items);

  /**
   * Deadpan filler lines. Injected when fewer than three live comps exist
   * so the marquee doesn't just loop the same title over and over.
   */
  const FILLER = [
    "NEVER MORE THAN 499",
    "SOMEONE'S GOT TO WIN IT",
    "THE ODDS ARE THE ODDS",
  ] as const;

  // Show filler chips when fewer than three real items are live (including
  // the zero case, where the marquee is filler-only).
  const showFiller = items.length < 3;

  return (
    <TooltipProvider delayDuration={150}>
      <div data-dynamic="ticker" className="relative overflow-hidden bg-clover-deep text-cream">
        <div className="relative flex items-stretch" style={{ height: 28 }}>
          <div className="relative z-30 shrink-0 bg-clover-deep pr-3 flex items-center shadow-[8px_0_8px_-4px_var(--color-clover-deep)]">
            <LiveChip />
          </div>
          {/* Wider left mask fade so the first item scrolls in cleanly
              instead of appearing mid-word at rest. */}
          {/* Wide left mask + matching left padding + trailing gap-8 spacer
              guarantee the first item is never mid-word at rest and the
              seamless loop hand-off never clips a partial word. */}
          <div className="relative z-0 min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent_0%,#000_2%,#000_98%,transparent_100%)] flex items-center">
            <div className="ticker-scroll flex gap-8 whitespace-nowrap text-[11px] font-bold tracking-wide text-cream pl-3 pr-8">
              {items.map((it, i) => (
                <TickerItem key={`${it.slug}-${i}`} c={it} delta={deltas[it.slug] ?? 0} />
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

/**
 * Real movement only: diffs successive polls of the live ticket counts.
 * Nothing invented — if nothing has sold while you've been watching, the
 * delta stays at zero and the chip renders nothing.
 */
function useSalesDeltas(items: LiveOdds[]) {
  const prev = useRef<Record<string, number>>({});
  const [deltas, setDeltas] = useState<Record<string, number>>({});

  useEffect(() => {
    if (items.length === 0) return;
    const next: Record<string, number> = {};
    let changed = false;
    for (const it of items) {
      const before = prev.current[it.slug];
      if (before !== undefined && it.ticketsSold > before) {
        next[it.slug] = it.ticketsSold - before;
        changed = true;
      }
      prev.current[it.slug] = it.ticketsSold;
    }
    if (changed) {
      setDeltas((d) => ({ ...d, ...next }));
      const timer = setTimeout(() => setDeltas({}), 60_000);
      return () => clearTimeout(timer);
    }
  }, [items]);

  return deltas;
}

function TickerItem({ c, delta }: { c: LiveOdds; delta: number }) {
  const t = timeLeft(c.endsAt);
  const closes = `Closes in ${humanTimeLeft(t)}`;
  const exact = exactTimeLeft(t);
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
          {delta > 0 && (
            <span className="inline-flex items-center gap-1 text-gold font-mono tabular-nums">
              <TrendingUp className="h-3 w-3" />
              {delta} just sold
            </span>
          )}
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
            value={humanTimeLeft(t)}
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