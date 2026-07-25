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
  const cell = (n: number | null, l: string) => (
    <div className={`flex flex-col items-center ${compact ? "min-w-[38px]" : "min-w-[54px]"}`}>
      <div className={`font-display tabular-nums font-bold ${compact ? "text-xl" : "text-3xl"} leading-none`}>{n === null ? "--" : pad(n)}</div>
      <div className={`uppercase tracking-widest text-[9px] mt-1 opacity-70`}>{l}</div>
    </div>
  );

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 ${
        t?.urgent ? "bg-hot text-hot-foreground urgent-pulse" : "bg-ink text-cream"
      }`}
    >
      {cell(t?.d ?? null, "days")}
      <span className="opacity-40">:</span>
      {cell(t?.h ?? null, "hrs")}
      <span className="opacity-40">:</span>
      {cell(t?.m ?? null, "min")}
      {!compact && (
        <>
          <span className="opacity-40">:</span>
          {cell(t?.s ?? null, "sec")}
        </>
      )}
    </div>
  );
}