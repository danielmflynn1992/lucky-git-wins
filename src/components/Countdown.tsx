import { useEffect, useState } from "react";
import { timeLeft, humanTimeLeft, exactTimeLeft } from "@/lib/format";
import { isClosed } from "@/lib/site-stats";

export function Countdown({ target, compact = false }: { target: string; compact?: boolean }) {
  // Initialise lazily so the first paint (SSR and client) already shows real
  // digits instead of dashes; the interval then ticks it every second.
  const [t, setT] = useState(() => timeLeft(target));
  useEffect(() => {
    setT(timeLeft(target));
    const i = setInterval(() => setT(timeLeft(target)), 1000);
    return () => clearInterval(i);
  }, [target]);

  const urgent = t.urgent;
  const human = humanTimeLeft(t);
  const exact = exactTimeLeft(t);

  // A live comp must never show 00d 00:00:00 — that state is "closed".
  if (isClosed(target) || t.total <= 0) {
    return (
      <span
        data-dynamic="countdown"
        suppressHydrationWarning
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono font-bold uppercase tracking-[0.12em] shadow-sm bg-[var(--color-ink-grey)] text-[var(--color-paper)] ${compact ? "text-[11px]" : "text-xs"}`}
      >
        Closed
      </span>
    );
  }

  return (
    <div
      data-dynamic="countdown"
      suppressHydrationWarning
      title={`Exactly ${exact} remaining`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono font-bold tabular-nums shadow-sm ${
        compact ? "text-[11px]" : "text-xs"
      } ${
        urgent
          ? "bg-urgent text-urgent-foreground"
          : "bg-[var(--color-ink-blue)] text-[var(--color-paper)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${urgent ? "bg-white animate-pulse" : "bg-[var(--color-ink-yellow)]"}`} />
      <span suppressHydrationWarning>Closes in {human}</span>
    </div>
  );
}