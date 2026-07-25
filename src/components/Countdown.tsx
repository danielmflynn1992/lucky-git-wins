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
    ? compact
      ? `${pad(t.d)}d ${pad(t.h)}:${pad(t.m)}`
      : `${pad(t.d)}d ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`
    : compact ? "--d --:--" : "--d --:--:--";
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-sm border px-2 py-1 font-mono tabular-nums ${
        compact ? "text-xs" : "text-sm"
      } ${urgent ? "border-hot/50 text-hot bg-hot/10" : "border-border text-foreground/80 bg-white/[0.02]"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${urgent ? "bg-hot animate-pulse" : "bg-clover"}`} />
      <span className="font-medium">{digits}</span>
    </div>
  );
}