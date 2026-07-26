import { Link, useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const goToDetail = () => navigate({ to: "/competitions/$slug", params: { slug: c.slug } });
  // Belt-and-braces: a stretched <Link> handles the standard case (keyboard,
  // middle-click, "open in new tab"), and an onClick on the outer card catches
  // any pointer that lands on decorative layers above the link's stacking
  // context. Interactive children opt out via [data-no-card-click] or by
  // being a native <button>/<a>.
  return (
    <PlateBorder
      variant="flush"
      className="paper group relative flex h-full flex-col overflow-hidden min-w-0 max-w-full [overflow-wrap:anywhere] plate-border--lift cursor-pointer [container-type:inline-size]"
      onClick={(e) => {
        const t = e.target as HTMLElement;
        if (t.closest("a,button,input,select,textarea,label,[data-no-card-click]")) return;
        goToDetail();
      }}
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
      {/* Prize field: engraved guilloche background behind the letterboxed image,
          framed as an inset plate — the "vignette on a share certificate" pattern. */}
      <div className="pointer-events-none relative z-0 m-2 overflow-hidden border border-[var(--color-ink-green)]/70 outline outline-1 outline-offset-[2px] outline-[var(--color-ink-green)]/40 bg-[var(--color-paper-deep)]">
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
      <div className="relative z-10 -mt-4 mb-1 flex justify-center px-1 sm:px-3 pointer-events-none">
        <Ribbon as="h3" className="max-w-full">
          <span className="block leading-[1.15] break-words hyphens-auto">
            {c.title}
          </span>
        </Ribbon>
      </div>

      {/* Serial ticket range — banknote treatment. */}
      <div className="pointer-events-none relative z-10 px-3 sm:px-4 pt-1 space-y-0.5 text-[var(--color-ink-grey)]">
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
          {/* Price + remaining — a two-column grid keeps labels on one baseline
              and values on another so the £ price and the remaining count never
              collide, regardless of card width. minmax(0,1fr) lets each column
              shrink; the price uses a fluid clamp capped low enough that a
              4-digit remaining count (e.g. 1,234) still fits beside it. */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 pt-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.12em] text-n-600 font-semibold truncate">Tickets from</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-n-600 font-semibold text-right truncate">Remaining</div>
            <div
              className="font-display leading-none tabular-nums whitespace-nowrap text-[clamp(1.25rem,6.5cqi,2rem)] min-w-0"
              style={{ color: "var(--color-ink-green-deep)" }}
            >
              {gbp(c.pricePerTicket)}
            </div>
            <div className="font-mono tabular-nums text-sm font-bold text-n-900 whitespace-nowrap text-right self-end">
              {remaining.toLocaleString()}
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