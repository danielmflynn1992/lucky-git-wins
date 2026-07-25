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
      className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono tabular-nums ${
        compact ? "text-xs" : "text-sm"
      } ${urgent ? "border-hot text-hot bg-hot/5" : "border-white/10 text-foreground bg-card"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${urgent ? "bg-hot" : "bg-clover"}`} />
      <span className="font-medium">{digits}</span>
    </div>
  );
}