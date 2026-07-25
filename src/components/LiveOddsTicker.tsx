import { COMPETITIONS } from "@/lib/mock-comps";

/**
 * Ambient horizontal ticker showing live comp data.
 * Signals "transparent data platform" instead of "raffle stall".
 */
export function LiveOddsTicker() {
  const items = COMPETITIONS.map((c) => {
    const odds = Math.round(c.totalTickets / Math.max(1, c.ticketsSold || 1));
    return {
      title: c.title.toUpperCase(),
      sold: `${c.ticketsSold.toLocaleString()}/${c.totalTickets.toLocaleString()} SOLD`,
      odds: `ODDS 1:${odds.toLocaleString()}`,
    };
  });
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-b border-border bg-background text-foreground/80">
      <div className="flex items-center gap-2 py-2">
        <span className="ml-3 shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.25em] text-clover">
          <span className="h-1.5 w-1.5 rounded-full bg-clover animate-pulse" /> Live
        </span>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
          <div className="ticker-scroll flex gap-10 whitespace-nowrap font-mono text-[11px] tracking-[0.1em] tabular-nums">
            {loop.map((it, i) => (
              <span key={i} className="inline-flex items-center gap-3 shrink-0">
                <span className="text-foreground/90">{it.title}</span>
                <span className="text-foreground/30">·</span>
                <span>{it.sold}</span>
                <span className="text-foreground/30">·</span>
                <span className="text-clover">{it.odds}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}