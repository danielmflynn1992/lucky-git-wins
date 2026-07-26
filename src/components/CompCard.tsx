import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { Competition } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";
import { Countdown } from "./Countdown";
import { QuickAddDialog } from "./QuickAddDialog";
import { Repeat2, Zap, Plus, ArrowRight } from "lucide-react";
import { NoDeadCompsBadge } from "./NoDeadCompsBadge";
import { LetterboxImage } from "./LetterboxImage";
import { BrassTag } from "./BrassTag";
import { PlateBorder } from "./PlateBorder";
import { Guilloche } from "./Guilloche";
import { Ribbon } from "./Ribbon";

const pad = (n: number, w = 4) => n.toString().padStart(w, "0");

export function CompCard({ c }: { c: Competition }) {
  const pct = Math.round((c.ticketsSold / c.totalTickets) * 100);
  const almostGone = pct >= 80;
  const remaining = c.totalTickets - c.ticketsSold;
  const [quickOpen, setQuickOpen] = useState(false);
  const serialWidth = 4;
  // Stretched-link pattern (see previous notes): card is a <div>, an absolute
  // <Link> is the primary click target, interactive controls sit above.
  return (
    <PlateBorder
      variant="flush"
      className="paper group relative flex h-full flex-col overflow-hidden min-w-0 max-w-full [overflow-wrap:anywhere] plate-border--lift"
    >
      <Link
        to="/competitions/$slug"
        params={{ slug: c.slug }}
        aria-label={c.title}
        className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink-green)]/60"
        tabIndex={0}
      >
        <span className="sr-only">{c.title}</span>
      </Link>

      {/* Tag row */}
      <div className="pointer-events-none absolute top-3 left-3 z-20 flex gap-1.5 max-w-[60%]">
        {c.instantWin && (
          <BrassTag size="xs">
            <Zap className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">Instant win</span>
          </BrassTag>
        )}
        {almostGone && (
          <span className="hidden sm:inline-block bg-urgent text-urgent-foreground px-2 py-0.5 text-[10px] font-display uppercase tracking-[0.14em] shadow-sm whitespace-nowrap rounded-[2px]">
            Only {remaining} left
          </span>
        )}
      </div>
      <div className="pointer-events-none absolute top-3 right-3 z-20">
        <Countdown target={c.endsAt} compact />
      </div>
      {/* Verified shield sits bottom-left of the image so it can't collide
          with the countdown pill in the top-right. */}
      <div className="pointer-events-none absolute z-20" style={{ left: 14, top: 'auto', bottom: 'calc(100% - (100% * 4 / 5) + 14px)' }} aria-hidden="true">
        <NoDeadCompsBadge />
      </div>

      {/* Prize field: engraved guilloche background behind the letterboxed image,
          framed as an inset plate — the "vignette on a share certificate" pattern. */}
      <div className="relative z-0 m-2 overflow-hidden border border-[var(--color-ink-green)]/70 outline outline-1 outline-offset-[2px] outline-[var(--color-ink-green)]/40 bg-[var(--color-paper-deep)]">
        <Guilloche className="text-[var(--color-ink-green)]" strength="faint" variant="rosette" />
        <LetterboxImage
          src={c.image}
          alt={c.title}
          style={c.letterboxStyle ?? "blur"}
          className="aspect-[5/4] relative z-[1]"
          imgClassName="transition-transform duration-500 group-hover:scale-[1.05]"
          width={1280}
          height={1024}
        />
      </div>

      {/* Ribbon title — the engraved banner across the plate. */}
      <div className="relative z-10 -mt-4 mb-1 flex justify-center px-3 pointer-events-none">
        <Ribbon as="h3" className="max-w-full">
          <span
            className="block text-[13px] sm:text-base leading-tight"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              maxWidth: "26ch",
            }}
          >
            {c.title}
          </span>
        </Ribbon>
      </div>

      {/* Serial ticket range — banknote treatment. */}
      <div className="relative z-10 px-3 sm:px-4 pt-1 space-y-0.5 text-[var(--color-ink-grey)]">
        <div
          className="font-display text-[10px] sm:text-[11px] uppercase tracking-[0.08em] whitespace-nowrap"
          style={{ fontVariant: "small-caps" }}
        >
          {c.category}
        </div>
        <div className="serial-num text-[11px] sm:text-xs whitespace-nowrap tabular-nums">
          № {pad(1, serialWidth)} – {pad(c.totalTickets, serialWidth)}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 pointer-events-none p-3 sm:p-4 flex flex-1 flex-col gap-2 sm:gap-3 min-w-0 overflow-hidden text-n-900">
        {/* Parchment data plate */}
        <div className="rounded-[2px] bg-[var(--color-paper-raised)] border border-[var(--color-ink-green)]/25 p-3 space-y-2 min-w-0">
          <div>
            <div className="flex justify-between gap-2 text-[10px] sm:text-[11px] font-mono tabular-nums text-n-600 mb-1 min-w-0">
              <span className="font-semibold text-n-800 whitespace-nowrap">{c.ticketsSold.toLocaleString()} sold</span>
              <span className="font-bold shrink-0" style={{ color: "var(--color-ink-green-deep)" }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-ink-green)]/10 overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${pct}%`, background: "var(--color-ink-green)" }} />
            </div>
          </div>
          {/* Price + remaining stack on mobile so the £ price never wraps
              mid-number; they sit side-by-side from sm up where there's room. */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 sm:gap-2 pt-1 min-w-0">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.12em] text-n-600 font-semibold whitespace-nowrap">Tickets from</div>
              <div
                className="font-display leading-none tabular-nums whitespace-nowrap text-[26px] sm:text-3xl md:text-4xl"
                style={{ color: "var(--color-ink-green-deep)" }}
              >
                {gbp(c.pricePerTicket)}
              </div>
            </div>
            <div className="min-w-0 sm:text-right shrink-0">
              <div className="text-[10px] uppercase tracking-[0.12em] text-n-600 font-semibold whitespace-nowrap">Remaining</div>
              <div className="font-mono tabular-nums text-sm font-bold text-n-900 whitespace-nowrap">{remaining.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* CTA row. Enter Now is visual — the card-wide Link handles the click.
            Stack vertically on narrow viewports so neither label clips. */}
        <div className="mt-auto flex flex-col sm:grid sm:grid-cols-2 gap-1.5 min-w-0 items-stretch">
          <div
            className="min-w-0 h-10 sm:h-9 rounded-[2px] text-n-100 px-3 font-display text-xs uppercase tracking-[0.08em] leading-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all"
            style={{ background: "var(--color-ink-green)" }}
          >
            <span>Enter Now</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </div>
          <button
            type="button"
            aria-label={`Quick add tickets for ${c.title}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickOpen(true); }}
            className="pointer-events-auto min-w-0 h-10 sm:h-9 px-3 font-display text-xs uppercase tracking-[0.08em] leading-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap border-2 border-[var(--color-ink-green)] text-[var(--color-ink-green-deep)] bg-[var(--color-paper-raised)] hover:bg-[var(--color-ink-green)] hover:text-[var(--color-paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Add</span>
          </button>
        </div>

        {/* Trust badges */}
        <div className="hidden sm:flex items-center justify-between gap-2 pt-1 text-[10px] font-semibold text-n-600 uppercase tracking-[0.14em]">
          <NoDeadCompsBadge variant="row" />
          <span className="inline-flex items-center gap-1"><Repeat2 className="h-3 w-3" style={{ color: "var(--color-ink-green)" }} /> No Rollovers</span>
        </div>
      </div>

      <QuickAddDialog comp={c} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </PlateBorder>
  );
}