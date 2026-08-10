import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { Competition } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";
import { Countdown } from "./Countdown";
import { QuickAddDialog } from "./QuickAddDialog";
import { Plus, ArrowRight } from "lucide-react";
import { LetterboxImage } from "./LetterboxImage";
import { StampMark } from "./StampMark";
import { Perforation } from "./Perforation";
import { PrizeImage } from "./PrizeImage";
import { lifecycleOf, formatDrawTime } from "@/lib/site-stats";

const pad = (n: number, w = 4) => n.toString().padStart(w, "0");

/**
 * CompCard — pools-coupon entry.
 * Red masthead → prize name in Anton → dotted rule → ruled image → form-style
 * label/value rows in Courier → perforated tear-off with CTAs.
 * Restraint: at most one stamp per card.
 */
export function CompCard({ c }: { c: Competition }) {
  const pct = Math.round((c.ticketsSold / c.totalTickets) * 100);
  const phase = lifecycleOf(c);
  const drawn = phase === "drawn";
  const closed = phase !== "live";
  const soldOut = pct >= 100;
  const almostGone = pct >= 80 && !soldOut;
  const remaining = c.totalTickets - c.ticketsSold;
  const fresh = c.ticketsSold === 0 && !closed;
  const [quickOpen, setQuickOpen] = useState(false);
  const serialWidth = 4;
  const navigate = useNavigate();
  const goToDetail = () =>
    navigate({ to: "/competitions/$slug", params: { slug: c.slug } });

  return (
    <article
      className={
        "paper group relative flex h-full flex-col overflow-hidden min-w-0 max-w-full [overflow-wrap:anywhere] cursor-pointer [container-type:inline-size] border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] " +
        (closed ? "opacity-70 saturate-[0.25]" : "")
      }
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
        className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink-red)]"
        tabIndex={0}
      >
        <span className="sr-only">{c.title}</span>
      </Link>

      {/* RED MASTHEAD */}
      <header className="relative z-10 bg-[var(--color-ink-red)] text-[var(--color-paper)] px-3 py-1.5 flex items-baseline justify-between gap-2 min-w-0">
        <span className="font-body font-bold uppercase tracking-[0.16em] text-[9px] min-w-0 truncate opacity-95">
          {c.category}
        </span>
        <span className="font-mono tabular-nums text-[9px] whitespace-nowrap shrink-0 opacity-95">
          № {pad(1, serialWidth)}–{pad(c.totalTickets, serialWidth)}
        </span>
      </header>

      {/* Prize title in Anton */}
      <div className="relative z-10 px-3 pt-2 pb-1 min-w-0">
        <h3
          className="font-display uppercase leading-[0.95] tracking-[0.01em] text-[var(--color-ink-black)] break-words hyphens-auto line-clamp-2"
          style={{ fontSize: "clamp(1.25rem, 5.4cqi, 1.5rem)", minHeight: "calc(2em * 0.95)" }}
        >
          {c.title}
        </h3>
      </div>

      <div className="mx-3 rule-dotted" aria-hidden="true" />

      {/* Prize image on the printed stage — enforced 4:3 + treatment. */}
      <div className="relative z-0 mx-3 mt-2 mb-6">
        <div className="pointer-events-none">
          <PrizeImage
            src={(c as unknown as { thumbUrl?: string }).thumbUrl || c.image}
            alt={c.title}
            title={c.title}
            eyebrow={c.category}
            size="card"
          />
        </div>
        {closed ? (
          <span className="pointer-events-none absolute z-[6]" style={{ right: "14px", bottom: "-14px" }}>
            <StampMark variant="GONE" size="lg" angle={-8} />
          </span>
        ) : soldOut ? (
          <span className="pointer-events-none absolute z-[6]" style={{ right: "14px", bottom: "-14px" }}>
            <StampMark variant="GONE" size="lg" angle={-8} />
          </span>
        ) : almostGone ? (
          <span className="pointer-events-none absolute z-[6]" style={{ right: "14px", bottom: "-10px" }}>
            <StampMark variant="LIVE" size="sm" angle={-4} />
          </span>
        ) : fresh ? (
          <span
            className="pointer-events-none absolute z-[6] border-2 border-[var(--color-ink-blue)] bg-[var(--color-paper-raised)] px-1.5 py-0.5 font-display uppercase tracking-[0.14em] text-[9px] text-[var(--color-ink-blue)] rotate-[-4deg]"
            style={{ right: "14px", bottom: "-10px" }}
          >
            Fresh on the stall
          </span>
        ) : null}
      </div>

      {/* FORM-STYLE DATA BLOCK */}
      <div className="relative z-10 pointer-events-none px-5 pt-3 flex flex-1 flex-col gap-2 min-w-0 overflow-hidden">
        <dl className="min-w-0">
          <FormRow label="STAKE" value={<span className="font-bold text-[var(--color-ink-red)]">{gbp(c.pricePerTicket)}</span>} />
          <FormRow label="ODDS" value={<>1 in <b>{c.totalTickets}</b></>} />
          <FormRow label="SOLD" value={fresh ? <span className="text-[var(--color-ink-blue)]">First one's yours</span> : <b>{c.ticketsSold.toLocaleString()}</b>} />
          <FormRow label="LEFT" value={<b>{remaining.toLocaleString()}</b>} />
          <FormRow label="CLOSES" value={<Countdown target={c.endsAt} compact />} />
        </dl>

        <div className="pt-1">
          <div className="flex justify-between text-[9px] font-mono tabular-nums text-[var(--color-ink-grey)] mb-1">
            <span>{c.ticketsSold.toLocaleString()} / {c.totalTickets.toLocaleString()}</span>
            <span className="font-bold text-[var(--color-ink-red)]">{pct}%</span>
          </div>
          <div className="h-2 border border-[var(--color-ink-black)] bg-[var(--color-paper)]">
            <div className="h-full bg-[var(--color-ink-red)]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* PERFORATED TEAR-OFF with CTAs */}
      <div className="relative z-10 mt-3">
        {closed ? (
          <p className="px-3 pb-2 text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--color-ink-grey)] leading-tight">
            {drawn
              ? "Drawn. Result's published, verify it yourself."
              : `Closed — drawing ${formatDrawTime(c.endsAt)}. The automatic draw does the rest.`}
          </p>
        ) : soldOut ? (
          <p className="px-3 pb-2 text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--color-ink-red)] leading-tight">
            {c.totalTickets} gits had a go. One of them's about to be insufferable.
          </p>
        ) : (
          <p className="px-3 pb-2 text-[8px] font-mono uppercase tracking-[0.14em] text-[var(--color-ink-grey)]/70 leading-tight">
            No refunds, no rollovers, no funny business.
          </p>
        )}
        <p className="px-3 pb-2 text-[8px] font-mono uppercase tracking-[0.12em] text-[var(--color-ink-grey)]/80 leading-tight">
          Closes {new Date(c.endsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · Max {c.maxPerPerson} per person ·{" "}
          <Link
            to="/competitions/$slug"
            params={{ slug: c.slug }}
            hash="rules"
            data-no-card-click
            onClick={(e) => e.stopPropagation()}
            className="underline underline-offset-2 pointer-events-auto"
          >
            Rules
          </Link>
        </p>
        <Perforation color="var(--color-ink-black)" />
        {closed ? (
          drawn ? (
            <Link
              to="/results"
              data-no-card-click
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto flex items-center justify-center gap-1.5 bg-[var(--color-ink-grey)] text-[var(--color-paper)] px-3 py-2.5 font-display uppercase tracking-[0.14em] text-xs whitespace-nowrap hover:bg-[var(--color-ink-black)]"
            >
              <span>Drawn — see result</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </Link>
          ) : (
            <Link
              to="/competitions/$slug"
              params={{ slug: c.slug }}
              data-no-card-click
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto flex items-center justify-center gap-1.5 bg-[var(--color-ink-blue)] text-[var(--color-paper)] px-3 py-2.5 font-display uppercase tracking-[0.14em] text-xs whitespace-nowrap hover:bg-[var(--color-ink-black)]"
            >
              <span>Closed — drawing {formatDrawTime(c.endsAt)}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </Link>
          )
        ) : (
        <div className="grid grid-cols-[1fr_auto] items-stretch">
          <div className="flex items-center justify-center gap-1.5 bg-[var(--color-ink-red)] text-[var(--color-paper)] px-3 py-2.5 font-display uppercase tracking-[0.14em] text-xs whitespace-nowrap">
            <span>Enter</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </div>
          <button
            type="button"
            aria-label={`Quick add tickets for ${c.title}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickOpen(true); }}
            className="pointer-events-auto border-l-2 border-[var(--color-ink-black)] bg-[var(--color-paper)] px-3 font-display uppercase tracking-[0.14em] text-xs inline-flex items-center gap-1.5 hover:bg-[var(--color-ink-yellow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink-red)]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add</span>
          </button>
        </div>
        )}
      </div>

      <QuickAddDialog comp={c} open={quickOpen} onClose={() => setQuickOpen(false)} />
    </article>
  );
}

function FormRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="leader-row">
      <dt className="label text-[9px] whitespace-nowrap">{label}</dt>
      <span className="leader-row__fill" aria-hidden="true" />
      <dd className="font-mono text-[12px] tabular-nums text-[var(--color-ink-black)] text-right whitespace-nowrap min-w-0 truncate">
        {value}
      </dd>
    </div>
  );
}
