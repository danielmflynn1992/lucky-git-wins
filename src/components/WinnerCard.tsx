import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Winner } from "@/lib/winners-api";
import { formatWinnerDate } from "@/lib/winners-api";

function slangForPrize(prize: string): string | null {
  // Pull the biggest £-figure out of the prize label ("Rolex + £2,000" → 2000)
  const nums = [...prize.matchAll(/£\s*([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, "")));
  if (nums.length === 0) return null;
  const amount = Math.max(...nums);
  const map: Record<number, string> = {
    25: "a pony", 50: "a bullseye", 100: "a ton", 500: "a monkey",
    1000: "a bag of sand", 25000: "a lot of monkeys",
  };
  return map[amount] ?? null;
}

/**
 * Coupon-styled winner card. Collapsed: red WINNER masthead → date → NAME,
 * TICKET, PRIZE rows → chevron + TAP TO OPEN hint. Expanded reveals prize
 * image (halftone stage), polaroid winner photo when consented, verification
 * block, quote, and PAID OUT rubber stamp. Only one card open at a time when
 * `openId`/`onToggle` are wired by the parent.
 */
export function WinnerCard({
  w,
  expanded: controlledExpanded,
  onToggle,
}: {
  w: Winner;
  expanded?: boolean;
  onToggle?: (id: string) => void;
}) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const isControlled = typeof controlledExpanded === "boolean";
  const expanded = isControlled ? controlledExpanded : uncontrolled;
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(0);

  useEffect(() => {
    if (!panelRef.current) return;
    const ro = new ResizeObserver(() => {
      if (panelRef.current) setPanelHeight(panelRef.current.scrollHeight);
    });
    ro.observe(panelRef.current);
    return () => ro.disconnect();
  }, []);

  const toggle = () => {
    if (isControlled) onToggle?.(w.id);
    else setUncontrolled((v) => !v);
  };

  const showWinnerPhoto = w.photo_consent && !!w.winner_photo_url;
  const polaroidSrc = showWinnerPhoto ? w.winner_photo_url! : w.image;
  const slang = slangForPrize(w.prize);

  return (
    <article className="flex flex-col border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink-blue)]"
      >
        <header className="bg-[var(--color-ink-red)] text-[var(--color-paper)] px-3 py-1.5 flex items-baseline justify-between gap-2">
          <span className="font-body font-bold uppercase tracking-[0.16em] text-[10px]">Winner</span>
          <span className="font-mono tabular-nums text-[10px] opacity-95">
            {formatWinnerDate(w.drawn_at)}
          </span>
        </header>

        <dl className="px-3 pt-2 pb-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="label text-[9px] whitespace-nowrap self-center">NAME</dt>
          <dd className="font-mono text-[12px] text-[var(--color-ink-black)] text-right self-center truncate">
            <b>{w.winner_display_name}</b>
            {w.winner_town ? <span> · {w.winner_town}</span> : null}
          </dd>
          <dt className="label text-[9px] whitespace-nowrap self-center">TICKET</dt>
          <dd className="font-mono text-[12px] text-[var(--color-ink-black)] text-right self-center truncate">
            <b>#{w.winning_number}</b>
          </dd>
          <dt className="label text-[9px] whitespace-nowrap self-start pt-[3px]">PRIZE</dt>
          <dd className="font-mono text-[12px] text-[var(--color-ink-black)] text-right self-start leading-snug break-words">
            <b>{w.prize}</b>
            {slang && (
              <span className="block font-mono text-[10px] text-[var(--color-ink-blue)]">
                {slang}
              </span>
            )}
          </dd>
        </dl>

        <div className="mx-3 mt-1 rule-dotted" aria-hidden />
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <p className="font-mono text-[11px] text-[var(--color-ink-grey)] truncate">
            {w.competition_title}
          </p>
          <span className="flex items-center gap-1.5 shrink-0">
            <span
              className="font-body uppercase tracking-[0.18em] text-[9px] text-[var(--color-ink-grey)] microtext"
            >
              {expanded ? "Tap to close" : "Tap to open"}
            </span>
            <ChevronDown
              className="h-3.5 w-3.5 text-[var(--color-ink-blue)] motion-safe:transition-transform motion-safe:duration-[220ms]"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
              aria-hidden
            />
          </span>
        </div>
      </button>

      <div
        id={panelId}
        role="region"
        aria-hidden={!expanded}
        className="motion-safe:transition-[height] motion-safe:duration-[220ms] motion-safe:ease-out overflow-hidden"
        style={{ height: expanded ? panelHeight : 0 }}
      >
        <div ref={panelRef} className="border-t-[1.5px] border-dashed border-[var(--color-ink-black)] relative">
          {w.image ? (
            <div className="prize-treatment pointer-events-none relative z-0 mx-3 mt-3 aspect-[4/3]">
              <img
                src={w.image}
                alt={w.prize}
                loading="lazy"
                width={1280}
                height={960}
              />
            </div>
          ) : null}

          {polaroidSrc ? (
            <div className="px-3 pt-4 flex justify-center">
              <figure
                className="bg-[var(--color-card-white)] p-2 pb-6 shadow-[0_4px_10px_rgba(0,0,0,0.18)] border border-[var(--color-paper-edge)] max-w-[180px]"
                style={{ transform: "rotate(-2.5deg)" }}
              >
                <div className="aspect-square overflow-hidden bg-[var(--color-paper-deep)]">
                  <img
                    src={polaroidSrc}
                    alt={showWinnerPhoto ? `${w.winner_display_name} with prize` : w.prize}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="mt-1 font-mono text-[10px] text-center text-[var(--color-ink-black)]">
                  {showWinnerPhoto ? w.winner_display_name : "prize photo"}
                </figcaption>
              </figure>
            </div>
          ) : null}

          {w.winner_quote ? (
            <blockquote className="mx-3 mt-3 font-body italic text-[13px] text-[var(--color-ink-black)] leading-snug">
              “{w.winner_quote}”
            </blockquote>
          ) : null}

          <div className="mx-3 mt-3 rule-dotted" aria-hidden />
          <div className="px-3 pt-2 pb-4">
            <div className="label text-[9px] text-[var(--color-ink-blue)] mb-1">Verification</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[10px] text-[var(--color-ink-black)]">
              <dt className="text-[var(--color-ink-grey)]">Commit</dt>
              <dd className="truncate" title={w.verification_hash}>{w.verification_hash.slice(0, 24)}…</dd>
              <dt className="text-[var(--color-ink-grey)]">Seed</dt>
              <dd className="truncate" title={w.seed_revealed}>{w.seed_revealed.slice(0, 24)}…</dd>
              <dt className="text-[var(--color-ink-grey)]">Pool</dt>
              <dd>{w.qualifying_pool_size ?? "—"} qualifying</dd>
            </dl>
            <Link
              to="/draws/$id/reveal"
              params={{ id: w.id }}
              className="mt-2 inline-block font-body uppercase tracking-[0.16em] text-[10px] font-bold text-[var(--color-ink-blue)] underline underline-offset-2"
            >
              Verify this draw →
            </Link>
          </div>

          <span
            aria-hidden
            className="pointer-events-none absolute bottom-2 right-2 font-display uppercase tracking-[0.18em] text-[18px] text-[#6b21a8]/80 border-[2.5px] border-[#6b21a8]/80 px-2 py-0.5 rotate-[-8deg] select-none"
            style={{ fontFamily: "var(--font-display, inherit)" }}
          >
            Paid Out
          </span>
        </div>
      </div>
    </article>
  );
}
