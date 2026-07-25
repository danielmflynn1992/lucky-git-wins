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
      className="group relative flex flex-col rounded-3xl bg-card overflow-hidden shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(15,81,50,0.35)] transition-all duration-200 border-2 border-ink/5"
    >
      {/* Stickers */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {c.hot && (
          <span className="sticker-tilt-l inline-flex items-center rounded-lg bg-hot text-hot-foreground px-2.5 py-1 text-xs font-black uppercase tracking-wide shadow-[var(--shadow-sticker)]">
            🔥 Hot
          </span>
        )}
        {c.instantWin && (
          <span className="sticker-tilt-r inline-flex items-center rounded-lg bg-gold text-gold-foreground px-2.5 py-1 text-xs font-black uppercase tracking-wide shadow-[var(--shadow-sticker)]">
            ⚡ Instant Win
          </span>
        )}
        {almostGone && (
          <span className="sticker-tilt-l inline-flex items-center rounded-lg bg-ink text-cream px-2.5 py-1 text-xs font-black uppercase tracking-wide shadow-[var(--shadow-sticker)]">
            Almost Gone!
          </span>
        )}
      </div>

      {/* Price sticker */}
      <div className="absolute top-3 right-3 z-10">
        <div className="sticker-tilt-r bg-cream border-2 border-ink rounded-xl px-3 py-1.5 shadow-[var(--shadow-sticker)]">
          <div className="text-[9px] uppercase tracking-widest font-bold opacity-70 leading-none">from</div>
          <div className="font-display font-black text-lg leading-tight">{gbp(c.pricePerTicket)}</div>
        </div>
      </div>

      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={c.image}
          alt={c.title}
          loading="lazy"
          width={1280}
          height={960}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-clover/70 mb-1">{c.category}</div>
          <h3 className="font-display text-lg leading-tight">{c.title}</h3>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span>{shortNumber(c.ticketsSold)} of {shortNumber(c.totalTickets)} sold</span>
            <span className="text-clover">{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full shimmer rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="text-xs">
            <div className="opacity-60 uppercase tracking-wider text-[9px] font-bold">Odds now</div>
            <div className="font-bold text-sm">1 in {odds.toLocaleString()}</div>
          </div>
          <Countdown target={c.endsAt} compact />
        </div>
      </div>
    </Link>
  );
}