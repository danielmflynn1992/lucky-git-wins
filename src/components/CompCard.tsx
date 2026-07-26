import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Competition } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";
import { Countdown } from "./Countdown";
import { QuickAddDialog } from "./QuickAddDialog";
import { Repeat2, Zap, Plus, ArrowRight } from "lucide-react";
import { NoDeadCompsBadge } from "./NoDeadCompsBadge";

export function CompCard({ c }: { c: Competition }) {
  const pct = Math.round((c.ticketsSold / c.totalTickets) * 100);
  const almostGone = pct >= 80;
  const remaining = c.totalTickets - c.ticketsSold;
  const [quickOpen, setQuickOpen] = useState(false);
  return (
    <>
    <Link
      to="/competitions/$slug"
      params={{ slug: c.slug }}
      className="group relative flex h-full flex-col rounded-lg bg-card border border-border overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 min-w-0 max-w-full [overflow-wrap:anywhere]"
    >
      {/* Tag row */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5">
        {c.instantWin && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold text-gold-foreground px-1.5 sm:px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <Zap className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">Instant win</span>
          </span>
        )}
        <NoDeadCompsBadge />
        {almostGone && (
          <span className="hidden sm:inline-block rounded-full bg-hot text-hot-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">
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
      <div className="p-2.5 sm:p-4 flex flex-1 flex-col gap-2 sm:gap-3 min-w-0 overflow-hidden">
        <div className="min-w-0 min-h-[2.75rem] sm:min-h-[3.25rem]">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.15em] font-semibold text-clover mb-0.5 sm:mb-1 truncate">{c.category}</div>
          <h3 className="font-display text-sm sm:text-lg font-bold leading-snug text-foreground line-clamp-2 break-words">{c.title}</h3>
        </div>

        {/* Grey data box */}
        <div className="rounded-md bg-muted/60 border border-border/60 p-2 sm:p-3 space-y-1.5 sm:space-y-2 min-w-0">
          <div>
            <div className="flex justify-between gap-2 text-[10px] sm:text-[11px] font-mono tabular-nums text-muted-foreground mb-1 min-w-0">
              <span className="font-semibold text-foreground/80 truncate">{c.ticketsSold.toLocaleString()} sold</span>
              <span className="text-clover font-bold shrink-0">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full shimmer transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 pt-0.5 sm:pt-1 min-w-0">
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">Tickets from</div>
              <div className="font-display font-extrabold text-xl sm:text-3xl leading-none tracking-[-0.04em] tabular-nums text-foreground">{gbp(c.pricePerTicket)}</div>
            </div>
            <div className="text-right shrink-0 min-w-0">
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Remaining</div>
              <div className="font-mono tabular-nums text-xs sm:text-sm font-bold text-foreground">{remaining.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* CTA row — equal-width buttons, never push the card */}
        <div className="mt-auto grid grid-cols-2 gap-1.5 min-w-0 items-stretch">
          <div className="min-w-0 h-9 inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md bg-clover text-primary-foreground px-1 font-display font-extrabold text-[11px] sm:text-xs uppercase tracking-[-0.02em] leading-none shadow-sm group-hover:bg-clover-deep group-hover:shadow-md group-focus-visible:bg-clover-deep group-focus-visible:ring-2 group-focus-visible:ring-clover/40 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-card transition-all">
            <span>Enter Now</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </div>
          <button
            type="button"
            aria-label={`Quick add tickets for ${c.title}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickOpen(true); }}
            className="min-w-0 h-9 rounded-md bg-gold text-gold-foreground px-1 font-display font-extrabold text-[11px] sm:text-xs uppercase tracking-[-0.02em] leading-none inline-flex items-center justify-center gap-1 whitespace-nowrap shadow-sm hover:bg-gold/90 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-all"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> Add
          </button>
        </div>

        {/* Trust badges */}
        <div className="hidden sm:flex items-center justify-between gap-2 pt-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          <NoDeadCompsBadge variant="row" />
          <span className="inline-flex items-center gap-1"><Repeat2 className="h-3 w-3 text-clover" /> No Rollovers</span>
        </div>
      </div>
    </Link>
    <QuickAddDialog comp={c} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  );
}