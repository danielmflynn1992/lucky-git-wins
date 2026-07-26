/**
 * ArcadeReveal — draw-reveal cabinet.
 * Seed/hash resolve in segment-display green, ending on the winning
 * number in Alfa Slab One at enormous scale. The one dark moment on the site.
 */
import { useEffect, useState } from "react";

export function ArcadeReveal({
  seed,
  hash,
  winning,
  compTitle,
}: {
  seed: string;
  hash: string;
  winning: number;
  compTitle: string;
}) {
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 600);
    const t2 = setTimeout(() => setStage(2), 1800);
    const t3 = setTimeout(() => setStage(3), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="arcade rounded-none border-[10px] border-[#1c1c1c] p-8 md:p-14 text-center">
      <div className="text-[10px] font-mono tracking-[0.3em] opacity-60 uppercase">Automatic Draw · {compTitle}</div>

      <div className="mt-8 space-y-3 text-left mx-auto max-w-md font-mono text-xs">
        <Row label="SEED"   value={seed}                                              ready={stage >= 1} />
        <Row label="HASH"   value={hash}                                              ready={stage >= 2} />
        <Row label="RESULT" value={stage >= 3 ? String(winning).padStart(4, "0") : "----"} ready={stage >= 3} />
      </div>

      {stage >= 3 && (
        <div className="mt-12">
          <div className="text-[10px] font-mono tracking-[0.3em] opacity-60 uppercase">Winning number</div>
          <div
            className="arcade-segment leading-none"
            style={{ fontFamily: "'Alfa Slab One', serif", fontSize: "clamp(6rem, 22vw, 14rem)" }}
          >
            {String(winning).padStart(4, "0")}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, ready }: { label: string; value: string; ready: boolean }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-white/10 pb-2">
      <span className="opacity-60 w-16 shrink-0">{label}</span>
      <span className={`arcade-segment break-all ${ready ? "" : "opacity-40"}`}>{value}</span>
    </div>
  );
}