import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Competition } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";
import { Countdown } from "./Countdown";
import { QuickAddDialog } from "./QuickAddDialog";
import { ChevronRight, Plus } from "lucide-react";
import { LetterboxImage } from "./LetterboxImage";
import { lifecycleOf, formatDrawTime } from "@/lib/site-stats";
import { OddsStamp, SoldCounter } from "./TicketOdds";

export function CompRow({ c }: { c: Competition }) {
  const pct = Math.round((c.ticketsSold / c.totalTickets) * 100);
  const remaining = c.totalTickets - c.ticketsSold;
  const phase = lifecycleOf(c);
  const drawn = phase === "drawn";
  const closed = phase !== "live";
  const [quickOpen, setQuickOpen] = useState(false);
  return (
    <>
    <Link
      to={drawn ? "/results" : "/competitions/$slug"}
      params={drawn ? undefined : { slug: c.slug }}
      className={
        "group flex items-center gap-3 sm:gap-4 rounded-lg bg-card border border-border p-3 shadow-sm hover:shadow-md hover:border-clover/50 transition-all overflow-hidden min-w-0 max-w-full [overflow-wrap:anywhere] " +
        (closed ? "opacity-70 saturate-[0.25]" : "")
      }
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
        <h3 className="font-display text-[20px] font-bold leading-tight text-foreground truncate">{c.title}</h3>
        <div className="mt-1.5 flex items-center gap-3 flex-wrap">
          <div className="font-display font-black text-lg tabular-nums text-foreground">
            {gbp(c.pricePerTicket)}
            <span className="text-[10px] font-mono font-normal text-muted-foreground uppercase tracking-wider ml-1">/ticket</span>
          </div>
          <OddsStamp total={c.totalTickets} size="sm" />
        </div>
        <div className="mt-1.5 max-w-xs">
          <SoldCounter sold={c.ticketsSold} total={c.totalTickets} />
        </div>
        <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground/80">
          Closes {new Date(c.endsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · Max {c.maxPerPerson} per person
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <Countdown target={c.endsAt} compact />
        {closed ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-ink-grey)] text-[var(--color-paper)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-right">
            {drawn ? "Drawn — see result" : `Closed — drawing ${formatDrawTime(c.endsAt)}`}
          </span>
        ) : (
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
        )}
      </div>
    </Link>
    <QuickAddDialog comp={c} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </>
  );
}