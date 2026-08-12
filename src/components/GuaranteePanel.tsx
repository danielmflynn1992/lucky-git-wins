/**
 * Our Guarantee — an official-notice panel. Every promise here is one the
 * platform actually keeps in code: draws fire automatically on the published
 * date, pools never re-list, and the cash alternative is a stated figure.
 */
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import terryImg from "@/assets/terry-panel.png.asset.json";

const LINES: { head: string; body: string }[] = [
  {
    head: "The draw happens on the date shown",
    body: "We never extend, never roll over, never re-list. If a pool doesn't sell out, the draw still runs and someone still wins.",
  },
  {
    head: "Winner drawn automatically at close",
    body: "Prize or the full cash alternative at the stated value — never a percentage of sales.",
  },
  {
    head: "Cash prizes paid within 48 hours by bank transfer",
    body: "No vouchers, no waiting on a cheque, no quiet renegotiation.",
  },
];

export function GuaranteePanel({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby="our-guarantee"
      className="relative border-[3px] border-double border-[var(--color-ink-blue)] bg-[var(--color-paper-raised)]"
    >
      <div className="bg-[var(--color-ink-blue)] px-4 py-1.5 text-center">
        <h2
          id="our-guarantee"
          className="font-display uppercase tracking-[0.24em] text-[11px] text-[var(--color-paper)]"
        >
          Our Guarantee
        </h2>
      </div>

      <div className="p-4 sm:p-5">
        <ul className="space-y-3">
          {LINES.map((l) => (
            <li key={l.head} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center border-2 border-[var(--color-ink-red)] text-[var(--color-ink-red)] mix-blend-multiply -rotate-[8deg]"
                style={{ filter: "url(#stamp-noise)" }}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <p className="font-display uppercase tracking-[0.08em] text-[13px] leading-tight text-[var(--color-ink-black)]">
                  {l.head}
                </p>
                <p className="mt-0.5 font-body text-[13px] leading-snug text-[var(--color-ink-grey)]">
                  {l.body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Signed off by the man himself. */}
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-dashed border-[var(--color-ink-black)]/40 pt-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-grey)]">
              Signed, on the stall
            </p>
            <p className="font-display uppercase tracking-[0.08em] text-[15px] text-[var(--color-ink-blue)]">
              Terry
            </p>
            {!compact && (
              <p className="mt-1 font-body text-[12px] text-[var(--color-ink-grey)]">
                Doubt any of it?{" "}
                <Link to="/guarantee" className="underline">Read the whole guarantee</Link>.
              </p>
            )}
          </div>
          <img
            src={terryImg.url}
            alt="Terry, thumbs up"
            width={230}
            height={312}
            loading="lazy"
            decoding="async"
            className="h-16 w-auto shrink-0 select-none object-contain sm:h-20"
          />
        </div>
      </div>
    </section>
  );
}
