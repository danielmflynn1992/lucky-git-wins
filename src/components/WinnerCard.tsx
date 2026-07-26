import type { Winner } from "@/lib/winners-api";
import { formatWinnerDate } from "@/lib/winners-api";

/**
 * Coupon-styled winner card. Red WINNER masthead → dotted rule → optional
 * 4:3 prize photo (omitted entirely when no image is available — never
 * renders a placeholder box) → label/value data rows.
 */
export function WinnerCard({ w }: { w: Winner }) {
  return (
    <article className="flex flex-col border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] overflow-hidden">
      <header className="bg-[var(--color-ink-red)] text-[var(--color-paper)] px-3 py-1.5 flex items-baseline justify-between gap-2">
        <span className="font-body font-bold uppercase tracking-[0.16em] text-[10px]">Winner</span>
        <span className="font-mono tabular-nums text-[10px] opacity-95">
          {formatWinnerDate(w.drawn_at)}
        </span>
      </header>

      {w.image ? (
        <div className="prize-treatment pointer-events-none relative z-0 mx-3 mt-2 aspect-[4/3]">
          <img
            src={w.image}
            alt={w.prize}
            loading="lazy"
            width={1280}
            height={960}
          />
        </div>
      ) : null}

      <div className="mx-3 mt-2 rule-dotted" aria-hidden />
      <dl className="px-3 pt-2 pb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="label text-[9px] whitespace-nowrap self-center">NAME</dt>
        <dd className="font-mono text-[12px] text-[var(--color-ink-black)] text-right self-center truncate">
          <b>{w.winner_display_name}</b>
          {w.winner_town ? <span> · {w.winner_town}</span> : null}
        </dd>
        <dt className="label text-[9px] whitespace-nowrap self-center">TICKET</dt>
        <dd className="font-mono text-[12px] text-[var(--color-ink-black)] text-right self-center truncate">
          <b>#{w.winning_number}</b>
        </dd>
        <dt className="label text-[9px] whitespace-nowrap self-center">PRIZE</dt>
        <dd className="font-mono text-[12px] text-[var(--color-ink-black)] text-right self-center truncate">
          <b>{w.prize}</b>
        </dd>
      </dl>
      <div className="mx-3 rule-dotted" aria-hidden />
      <p className="px-3 py-2 font-mono text-[11px] text-[var(--color-ink-grey)] truncate">
        {w.competition_title}
      </p>
    </article>
  );
}
