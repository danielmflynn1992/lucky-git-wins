import { Link } from "@tanstack/react-router";
import type { Competition } from "@/lib/mock-comps";
import { gbp, shortNumber } from "@/lib/format";
import { Countdown } from "./Countdown";

export function CompCard({ c }: { c: Competition }) {
  const pct = Math.round((c.ticketsSold / c.totalTickets) * 100);
  const almostGone = pct >= 80;
  const odds = Math.round(c.totalTickets / Math.max(1, c.ticketsSold || 1));
  return (
    <Link
      to="/competitions/$slug"
      params={{ slug: c.slug }}
      className="group relative flex flex-col rounded-md bg-card overflow-hidden border border-white/10 hover:border-clover/60 transition-colors duration-150"
    >
      {/* Tag row — flat, single-accent */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        {c.instantWin && (
          <span className="rounded-sm bg-gold/95 text-gold-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            Instant win
          </span>
        )}
        {almostGone && (
          <span className="rounded-sm bg-hot text-hot-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            Last {c.totalTickets - c.ticketsSold}
          </span>
        )}
      </div>

      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={c.image}
          alt={c.title}
          loading="lazy"
          width={1280}
          height={960}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.15em] font-medium text-muted-foreground mb-1">{c.category}</div>
            <h3 className="font-display text-base leading-snug truncate">{c.title}</h3>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">from</div>
            <div className="font-mono font-medium text-base leading-none tabular-nums">{gbp(c.pricePerTicket)}</div>
          </div>
        </div>

        {/* Progress — slim line + tabular readout */}
        <div>
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-foreground/70 mb-1">
            <span>{c.ticketsSold.toLocaleString()} / {c.totalTickets.toLocaleString()}</span>
            <span className="text-clover">{pct}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full shimmer" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Odds</div>
            <div className="font-mono tabular-nums text-sm">1 : {odds.toLocaleString()}</div>
          </div>
          <Countdown target={c.endsAt} compact />
        </div>
      </div>
    </Link>
  );
}