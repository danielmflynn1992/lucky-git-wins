import { useEffect, useState } from "react";
import { timeLeft } from "@/lib/format";

export function Countdown({ target, compact = false }: { target: string; compact?: boolean }) {
  // Initialise lazily so the first paint (SSR and client) already shows real
  // digits instead of dashes; the interval then ticks it every second.
  const [t, setT] = useState(() => timeLeft(target));
  useEffect(() => {
    setT(timeLeft(target));
    const i = setInterval(() => setT(timeLeft(target)), 1000);
    return () => clearInterval(i);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const urgent = t.urgent;
  const digits = `${pad(t.d)}d ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`;
  return (
    <div
      data-dynamic="countdown"
      suppressHydrationWarning
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono font-bold tabular-nums shadow-sm ${
        compact ? "text-[11px]" : "text-xs"
      } ${
        urgent
          ? "bg-urgent text-urgent-foreground"
          : "bg-[var(--color-ink-blue)] text-[var(--color-paper)]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${urgent ? "bg-white animate-pulse" : "bg-[var(--color-ink-yellow)]"}`} />
      <span suppressHydrationWarning>{digits}</span>
    </div>
  );
}