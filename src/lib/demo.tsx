/**
 * Single source of truth for example ("demo") records.
 *
 * Demo competitions run through exactly the same draw pipeline as real ones —
 * real seed, real hash, real winning ticket. The only difference is applied
 * here, at render time: labelling, a blanked winner and exclusion from every
 * public statistic. No page is allowed to invent its own demo rule.
 */
import type { ReactNode } from "react";

export const DEMO_WINNER_NAME = "—";
export const DEMO_WINNER_TOWN = "Example entry";
export const DEMO_RIBBON_LABEL = "Example draw";
export const DEMO_VERIFY_BANNER =
  "Example draw — the verification is real, the prize wasn't.";
export const DEMO_COMP_BANNER =
  "Example competition. The pipeline is real — entries, close, automatic draw and verification all run for real. No prize is awarded.";

/** The one check. Anything carrying is_demo / isDemo is an example record. */
export function isDemo(
  record: { is_demo?: boolean | null; isDemo?: boolean | null } | null | undefined,
): boolean {
  if (!record) return false;
  return Boolean(record.is_demo ?? record.isDemo);
}

/** Desaturated imagery for example records. */
export const demoImageStyle = { filter: "saturate(0.35)" } as const;

export function demoImageProps(record: Parameters<typeof isDemo>[0]) {
  return isDemo(record) ? { style: demoImageStyle } : {};
}

export function ExampleRibbon({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] whitespace-nowrap border-2 border-[var(--color-ink-red)] bg-[var(--color-paper)]/85 px-6 py-1.5 font-display uppercase tracking-[0.2em] text-[13px] text-[var(--color-ink-red)] " +
        className
      }
    >
      {DEMO_RIBBON_LABEL}
    </span>
  );
}

export function ExampleBanner({ children }: { children?: ReactNode }) {
  return (
    <div
      role="note"
      className="border-[1.5px] border-[var(--color-ink-red)] bg-[var(--color-ink-red)]/10 px-3 py-2 font-mono text-[12px] text-[var(--color-ink-red)]"
    >
      <b className="font-display uppercase tracking-[0.16em] text-[11px]">Example</b>{" "}
      {children ?? DEMO_COMP_BANNER}
    </div>
  );
}
