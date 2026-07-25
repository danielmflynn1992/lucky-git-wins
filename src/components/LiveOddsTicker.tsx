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
    <div className="relative overflow-hidden border-y border-clover/20 bg-black text-clover">
      <div className="flex items-stretch py-0">
        <span className="shrink-0 inline-flex items-center gap-2 bg-clover/10 border-r border-clover/25 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-clover">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-clover opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-clover" />
          </span>
          LIVE
        </span>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)] py-2">
          <div className="ticker-scroll flex gap-10 whitespace-nowrap font-mono text-[11px] tracking-[0.15em] tabular-nums">
            {loop.map((it, i) => (
              <span key={i} className="inline-flex items-center gap-3 shrink-0">
                <span className="text-clover font-semibold">{it.title}</span>
                <span className="text-clover/30">▲</span>
                <span className="text-cream/80">{it.sold}</span>
                <span className="text-clover/30">▲</span>
                <span className="text-clover">{it.odds}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}