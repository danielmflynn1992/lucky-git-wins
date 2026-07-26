import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Competition } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";
import { Countdown } from "./Countdown";
import { QuickAddDialog } from "./QuickAddDialog";
import { ChevronRight, Plus } from "lucide-react";
import { LetterboxImage } from "./LetterboxImage";

export function CompRow({ c }: { c: Competition }) {
  const pct = Math.round((c.ticketsSold / c.totalTickets) * 100);
  const remaining = c.totalTickets - c.ticketsSold;
  const [quickOpen, setQuickOpen] = useState(false);
  return (
    <>
    <Link
      to="/competitions/$slug"
      params={{ slug: c.slug }}
      className="group flex items-center gap-3 sm:gap-4 rounded-lg bg-card border border-border p-3 shadow-sm hover:shadow-md hover:border-clover/50 transition-all overflow-hidden min-w-0 max-w-full [overflow-wrap:anywhere]"
    >
      {/* Thumb */}
      <LetterboxImage
        src={c.image}
        alt={c.title}
        style={c.letterboxStyle ?? "blur"}
        blur="md"
        className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-md"
        width={200}
        height={200}
      />

      {/* Middle */}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-clover truncate">{c.category}</div>
        <h3 className="font-display text-sm sm:text-base font-bold leading-tight text-foreground truncate">{c.title}</h3>
        <div className="mt-1.5 flex items-center gap-3 flex-wrap">
          <div className="font-display font-black text-lg tabular-nums text-foreground">
            {gbp(c.pricePerTicket)}
            <span className="text-[10px] font-mono font-normal text-muted-foreground uppercase tracking-wider ml-1">/ticket</span>
          </div>
          <div className="hidden sm:block h-1 flex-1 min-w-16 max-w-32 rounded-full bg-border overflow-hidden">
            <div className="h-full shimmer" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] font-mono tabular-nums text-muted-foreground font-semibold">{remaining.toLocaleString()} left</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Countdown target={c.endsAt} compact />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Quick add tickets for ${c.title}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickOpen(true); }}
            className="inline-flex items-center gap-1 rounded-md bg-gold text-gold-foreground px-2.5 py-2 text-xs font-bold uppercase tracking-wide hover:bg-gold/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
          <div className="inline-flex items-center gap-1 rounded-md bg-clover text-primary-foreground px-3 py-2 text-xs font-bold uppercase tracking-wide group-hover:bg-clover-deep transition-colors">
            Enter <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
    <QuickAddDialog comp={c} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  );
}