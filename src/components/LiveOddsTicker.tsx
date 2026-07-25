import { COMPETITIONS, WINNERS } from "@/lib/mock-comps";
import { Trophy, Timer } from "lucide-react";

/**
 * Bright "Latest Winners / Draws Tonight" ticker.
 * White strip under nav, bold black text, emerald dividers.
 */
export function LiveOddsTicker() {
  const drawsTonight = [...COMPETITIONS]
    .sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt))
    .slice(0, 3)
    .map((c) => ({ type: "draw" as const, text: `${c.title.toUpperCase()} — DRAWING SOON` }));

  const winners = WINNERS.slice(0, 5).map((w) => ({
    type: "win" as const,
    text: `${w.name.toUpperCase()} FROM ${w.town.toUpperCase()} WON ${w.prize.toUpperCase()}`,
  }));

  const items = [...winners, ...drawsTonight];
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden bg-white border-b border-border">
      <div className="flex items-stretch">
        <span className="shrink-0 inline-flex items-center gap-2 bg-clover px-3 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-70 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          LIVE
        </span>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)] py-2">
          <div className="ticker-scroll flex gap-8 whitespace-nowrap text-xs font-bold tracking-wide text-ink">
            {loop.map((it, i) => (
              <span key={i} className="inline-flex items-center gap-3 shrink-0">
                {it.type === "win" ? (
                  <Trophy className="h-3.5 w-3.5 text-gold" />
                ) : (
                  <Timer className="h-3.5 w-3.5 text-hot" />
                )}
                <span>{it.text}</span>
                <span className="text-clover font-black">●</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}