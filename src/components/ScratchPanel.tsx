/**
 * ScratchPanel — silver scratch-off with a keyboard-accessible reveal button.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export function ScratchPanel({
  children,
  label = "Scratch to reveal",
  onReveal,
  className = "",
}: {
  children: ReactNode;
  label?: string;
  onReveal?: () => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const drawn = useRef(0);
  const total = useRef(1);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * devicePixelRatio;
    c.height = rect.height * devicePixelRatio;
    const ctx = c.getContext("2d")!;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, "#b8b8b8"); g.addColorStop(0.5, "#e0e0e0"); g.addColorStop(1, "#a8a8a8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * rect.width, Math.random() * rect.height, 1, 1);
    }
    ctx.fillStyle = "rgba(30,30,30,0.55)";
    ctx.font = "600 12px 'Archivo', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label.toUpperCase(), rect.width / 2, rect.height / 2);
    total.current = rect.width * rect.height;
  }, [label]);

  const scratch = (x: number, y: number) => {
    const c = canvasRef.current; if (!c || revealed) return;
    const ctx = c.getContext("2d")!;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    drawn.current += Math.PI * 400;
    if (drawn.current / total.current > 0.35) reveal();
  };

  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
    onReveal?.();
  };

  return (
    <div className={`relative border-2 border-[var(--color-ink-black)] bg-[var(--color-paper)] ${className}`}>
      <div className="p-4" aria-live="polite">{children}</div>
      {!revealed && (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-grab touch-none"
            onPointerMove={(e) => {
              if (e.buttons !== 1 && e.pointerType === "mouse") return;
              const rect = e.currentTarget.getBoundingClientRect();
              scratch(e.clientX - rect.left, e.clientY - rect.top);
            }}
            onPointerDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              scratch(e.clientX - rect.left, e.clientY - rect.top);
            }}
          />
          <button
            type="button"
            onClick={reveal}
            className="absolute bottom-1 right-1 z-10 border border-[var(--color-ink-black)] bg-[var(--color-paper)] px-2 py-0.5 text-[10px] font-display uppercase tracking-[0.14em]"
          >
            Reveal
          </button>
        </>
      )}
    </div>
  );
}