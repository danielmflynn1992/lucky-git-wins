import { Link } from "@tanstack/react-router";
import type { Competition } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";
import { Countdown } from "./Countdown";
import { ShieldCheck, Repeat2, Zap } from "lucide-react";

export function CompCard({ c }: { c: Competition }) {
  const pct = Math.round((c.ticketsSold / c.totalTickets) * 100);
  const almostGone = pct >= 80;
  const remaining = c.totalTickets - c.ticketsSold;
  const odds = Math.round(c.totalTickets / Math.max(1, c.ticketsSold || 1));
  return (
    <Link
      to="/competitions/$slug"
      params={{ slug: c.slug }}
      className="group relative flex flex-col rounded-lg bg-card border border-border overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Tag row */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        {c.instantWin && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold text-gold-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <Zap className="h-3 w-3" /> Instant win
          </span>
        )}
        {almostGone && (
          <span className="rounded-full bg-hot text-hot-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            Only {remaining} left
          </span>
        )}
      </div>
      <div className="absolute top-3 right-3 z-10">
        <Countdown target={c.endsAt} compact />
      </div>

      {/* Massive edge-to-edge prize image */}
      <div className="aspect-[5/4] overflow-hidden bg-muted">
        <img
          src={c.image}
          alt={c.title}
          loading="lazy"
          width={1280}
          height={1024}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-clover mb-1">{c.category}</div>
          <h3 className="font-display text-lg font-bold leading-tight text-foreground line-clamp-2">{c.title}</h3>
        </div>

        {/* Grey data box */}
        <div className="rounded-md bg-muted/60 border border-border/60 p-3 space-y-2">
          <div>
            <div className="flex justify-between text-[11px] font-mono tabular-nums text-muted-foreground mb-1">
              <span className="font-semibold text-foreground/80">{c.ticketsSold.toLocaleString()} sold</span>
              <span className="text-clover font-bold">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full shimmer transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex items-end justify-between pt-1">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tickets from</div>
              <div className="font-display font-extrabold text-3xl leading-none tracking-[-0.04em] tabular-nums text-foreground">{gbp(c.pricePerTicket)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Remaining</div>
              <div className="font-mono tabular-nums text-sm font-bold text-foreground">{remaining.toLocaleString()}</div>
              <div className="text-[10px] font-mono text-muted-foreground">1:{odds.toLocaleString()} odds</div>
            </div>
          </div>
        </div>

        {/* CTA — screams to be clicked */}
        <div className="rounded-md bg-clover text-primary-foreground text-center py-3 font-display font-extrabold text-base uppercase tracking-[-0.01em] group-hover:bg-clover-deep transition-colors">
          Enter Now →
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-between gap-2 pt-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-clover" /> Guaranteed Draw</span>
          <span className="inline-flex items-center gap-1"><Repeat2 className="h-3 w-3 text-clover" /> No Rollovers</span>
        </div>
      </div>
    </Link>
  );
}