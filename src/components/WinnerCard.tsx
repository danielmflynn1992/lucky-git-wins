import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Winner } from "@/lib/winners-api";
import { formatWinnerDate } from "@/lib/winners-api";
import { cn } from "@/lib/utils";

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Tiny 499-cell coupon with the winning number lit up. Decorative. */
function MiniCoupon({ total, winner }: { total: number; winner: number }) {
  const cells = Math.max(total, winner);
  return (
    <div aria-hidden className="bg-[var(--color-ink-black)] p-[2px]">
      <div
        className="grid gap-[1px]"
        style={{ gridTemplateColumns: "repeat(25, minmax(0, 1fr))" }}
      >
        {Array.from({ length: cells }, (_, i) => {
          const n = i + 1;
          const win = n === winner;
          return (
            <span
              key={n}
              className={cn(
                "aspect-square",
                win && "relative z-10 outline outline-1 outline-[var(--color-ink-black)]",
              )}
              style={{
                background: win
                  ? "var(--color-ink-red)"
                  : "color-mix(in srgb, var(--color-paper) 88%, var(--color-ink-blue))",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function InlineVerify({ seed, hash, drawId }: { seed: string; hash: string; drawId: string }) {
  const [state, setState] = useState<"idle" | "checking" | "ok" | "bad">("idle");
  const run = async () => {
    setState("checking");
    try {
      const computed = await sha256Hex(seed);
      setState(computed === hash ? "ok" : "bad");
    } catch {
      setState("bad");
    }
  };
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={run}
        className="border border-[var(--color-ink-black)] bg-[var(--color-ink-yellow)] text-[var(--color-ink-black)] px-2.5 py-1 font-display uppercase tracking-[0.14em] text-[10px]"
      >
        {state === "checking" ? "Checking…" : "Verify this draw"}
      </button>
      {state === "ok" && (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-blue)]">
          Hash matches. Seed was sealed before close.
        </span>
      )}
      {state === "bad" && (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-red)]">
          Hash mismatch — tell us immediately.
        </span>
      )}
      <Link
        to="/draws/$id/verify"
        params={{ id: drawId }}
        className="font-body uppercase tracking-[0.16em] text-[10px] font-bold text-[var(--color-ink-blue)] underline underline-offset-2"
      >
        Full verification page →
      </Link>
    </div>
  );
}

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
  const slang = slangForPrize(w.prize);
  const hasVerification =
    !!w.verification_hash && !!w.seed_revealed && w.qualifying_pool_size != null;
  const canRehash = !!w.seed_revealed && !!w.seed_hash;

  return (
    <article className="flex flex-col border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)] overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink-blue)]"
      >
        <header className="bg-[var(--color-ink-red)] text-[var(--color-paper)] px-5 py-1.5 flex items-center justify-between gap-2">
          <span className="font-body font-bold uppercase tracking-[0.16em] text-[10px]">
            Winner
          </span>
          <span className="flex items-center gap-2">
            <span className="font-mono tabular-nums text-[10px] opacity-95">
              {formatWinnerDate(w.drawn_at)}
            </span>
            <ChevronDown
              className="h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-[220ms]"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
              aria-hidden
            />
          </span>
        </header>
        {w.isDemo && (
          <div className="w-full bg-[var(--color-ink-blue)] text-[var(--color-paper)] px-5 py-1 font-body uppercase tracking-[0.16em] text-[10px] whitespace-nowrap overflow-hidden text-ellipsis">
            Demo data — removed at launch
          </div>
        )}

        <dl className="px-5 py-2">
          <div className="leader-row">
            <dt className="label text-[9px] whitespace-nowrap">NAME</dt>
            <span className="leader-row__fill" aria-hidden />
            <dd className="font-mono text-[12px] text-[var(--color-ink-black)] text-right truncate min-w-0">
              <b>{w.winner_display_name}</b>
              {w.winner_town ? <span> · {w.winner_town}</span> : null}
            </dd>
          </div>
          <div className="leader-row">
            <dt className="label text-[9px] whitespace-nowrap">TICKET</dt>
            <span className="leader-row__fill" aria-hidden />
            <dd className="font-mono text-[12px] text-[var(--color-ink-black)] text-right truncate min-w-0">
              <b>#{w.winning_number}</b>
            </dd>
          </div>
          <div className="leader-row">
            <dt className="label text-[9px] whitespace-nowrap">PRIZE</dt>
            <span className="leader-row__fill" aria-hidden />
            <dd className="font-mono text-[12px] text-[var(--color-ink-black)] text-right leading-snug break-words min-w-0">
              <b>{w.prize}</b>
              {slang && (
                <span className="block font-mono text-[10px] text-[var(--color-ink-blue)]">
                  {slang}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </button>

      <div
        id={panelId}
        role="region"
        aria-hidden={!expanded}
        className="motion-safe:transition-[height] motion-safe:duration-[220ms] motion-safe:ease-out overflow-hidden"
        style={{ height: expanded ? panelHeight : 0 }}
      >
        <div ref={panelRef} className="border-t-[1.5px] border-dashed border-[var(--color-ink-black)] relative pb-3">
          {w.image ? (
            <div className="relative mx-5 mt-3 mb-8">
              <div className="prize-treatment pointer-events-none relative z-0 aspect-[4/3]">
                <img
                  src={w.image}
                  alt={w.prize}
                  loading="lazy"
                  width={1280}
                  height={960}
                />
              </div>
              {/* PAID OUT stamp — anchored to the image bottom-right, overlapping
                  by ~18px so most of the mark lands on cream and stays legible. */}
              <span
                aria-hidden
                className="pointer-events-none absolute z-20 font-display uppercase tracking-[0.18em] whitespace-nowrap text-[20px] text-[var(--color-ink-red)] border-2 border-[var(--color-ink-red)] px-2.5 py-0.5 select-none mix-blend-multiply leading-none"
                style={{
                  right: "20px",
                  bottom: "-14px",
                  transform: "rotate(-8deg)",
                  opacity: 0.85,
                  filter: "url(#stamp-noise)",
                }}
              >
                Paid Out
              </span>
            </div>
          ) : null}

          {showWinnerPhoto ? (
            <div className={cn("px-5 flex justify-center relative", w.image ? "-mt-10 z-10" : "pt-4") }>
              <figure
                className="relative bg-[var(--color-card-white)] p-3 pb-10 shadow-[0_10px_24px_rgba(0,0,0,0.28)] border border-[var(--color-paper-edge)] w-full max-w-[320px]"
                style={{ transform: "rotate(-2deg)" }}
              >
                <span
                  aria-hidden
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--color-ink-red)] shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                />
                <div className="aspect-square overflow-hidden bg-[var(--color-paper-deep)]">
                  <img
                    src={w.winner_photo_url!}
                    alt={`${w.winner_display_name} with prize`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="mt-2 font-mono text-[11px] text-center text-[var(--color-ink-black)]">
                  {w.winner_display_name}
                  {w.winner_town ? ` · ${w.winner_town}` : ""}
                </figcaption>
              </figure>
            </div>
          ) : null}

          {w.winner_quote ? (
            <blockquote className="mx-5 mt-3 font-body italic text-[13px] text-[var(--color-ink-black)] leading-snug">
              “{w.winner_quote}”
            </blockquote>
          ) : null}

          {hasVerification ? (
            <>
              <div className="mx-5 mt-3 rule-dotted" aria-hidden />
              <div className="px-5 pt-2 pb-4">
                <div className="label text-[9px] text-[var(--color-ink-blue)] mb-1">Verification</div>
                <MiniCoupon total={w.total_tickets} winner={w.winning_number} />
                <div className="mt-1 mb-2 font-mono text-[10px] tabular-nums text-[var(--color-ink-black)]">
                  Winning ticket <b className="text-[var(--color-ink-red)]">#{String(w.winning_number).padStart(3, "0")}</b>
                  {" · "}
                  {new Date(w.drawn_at).toLocaleString("en-GB")}
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[10px] text-[var(--color-ink-black)]">
                  <dt className="text-[var(--color-ink-grey)]">Commit</dt>
                  <dd className="truncate" title={w.verification_hash}>{w.verification_hash.slice(0, 24)}…</dd>
                  {w.seed_hash ? (
                    <>
                      <dt className="text-[var(--color-ink-grey)]">Seed hash</dt>
                      <dd className="truncate" title={w.seed_hash}>{w.seed_hash.slice(0, 24)}…</dd>
                    </>
                  ) : null}
                  <dt className="text-[var(--color-ink-grey)]">Seed</dt>
                  <dd className="truncate" title={w.seed_revealed}>{w.seed_revealed.slice(0, 24)}…</dd>
                  <dt className="text-[var(--color-ink-grey)]">Pool</dt>
                  <dd>{w.qualifying_pool_size} qualifying</dd>
                </dl>
                {canRehash && <InlineVerify seed={w.seed_revealed} hash={w.seed_hash} drawId={w.id} />}
                <Link
                  to="/draws/$id/reveal"
                  params={{ id: w.id }}
                  className="mt-2 inline-block font-body uppercase tracking-[0.16em] text-[10px] font-bold text-[var(--color-ink-blue)] underline underline-offset-2"
                >
                  Watch the full reveal →
                </Link>
              </div>
            </>
          ) : (
            <div className="pb-4" />
          )}
        </div>
      </div>
    </article>
  );
}
