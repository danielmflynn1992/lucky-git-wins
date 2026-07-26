import { useEffect, useState } from "react";
import { timeLeft } from "@/lib/format";

export function Countdown({ target, compact = false }: { target: string; compact?: boolean }) {
  const [t, setT] = useState<ReturnType<typeof timeLeft> | null>(null);
  useEffect(() => {
    setT(timeLeft(target));
    const i = setInterval(() => setT(timeLeft(target)), 1000);
    return () => clearInterval(i);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const urgent = t?.urgent;
  const digits = t
    ? `${pad(t.d)}d ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`
    : "--d --:--:--";
  return (
    <div
      data-dynamic="countdown"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono font-bold tabular-nums shadow-sm ${
        compact ? "text-[11px]" : "text-xs"
      } ${
        urgent
          ? "bg-urgent text-urgent-foreground"
          : "bg-ink text-cream"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${urgent ? "bg-white animate-pulse" : "bg-clover"}`} />
      <span>{digits}</span>
    </div>
  );
}