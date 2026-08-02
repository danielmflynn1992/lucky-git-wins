/**
 * EntryStampSequence — the purchase confirmation moment, "The Stamp".
 * Three beats: the slam, the stub, Terry's verdict. ~2.5s, skippable on tap.
 * No confetti. Ever.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import terryImg from "@/assets/terry-panel.png.asset.json";
import { Button } from "@/components/ui/button";
import { Perforation } from "@/components/Perforation";
import { pickVerdict } from "@/lib/terry-verdicts";
import { playInkSquelch, playPaperSlide, playStampThud } from "@/lib/stamp-sound";
import { Volume2, VolumeX, Share2 } from "lucide-react";

const T_STILL = 700;      // coupon settled
const T_DESCEND = 1100;   // stamp starts falling
const T_IMPACT = 1280;    // contact
const T_STUB = 1400;      // beat 2
const T_VERDICT = 2000;   // beat 3

type Phase = 0 | 1 | 2 | 3; // 0 coupon in · 1 stamped · 2 stub · 3 verdict

export function EntryStampSequence({
  compTitle,
  numbers,
  entryRef,
  drawLine,
}: {
  compTitle: string;
  numbers: number[];
  entryRef: string;
  drawLine: string;
}) {
  const [phase, setPhase] = useState<Phase>(0);
  const [descending, setDescending] = useState(false);
  const [impact, setImpact] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const timers = useRef<number[]>([]);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const verdict = pickVerdict(entryRef + numbers.join(","), numbers, compTitle, entryRef);
  const [typed, setTyped] = useState("");

  const skip = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setDescending(true);
    setImpact(true);
    setPhase(3);
    setTyped(verdict);
  }, [verdict]);

  useEffect(() => {
    if (prefersReduced) { skip(); return; }
    const play = (fn: () => void) => () => { if (!mutedRef.current) fn(); };
    const push = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    push(play(playPaperSlide), 40);
    push(() => setDescending(true), T_DESCEND);
    push(() => { setImpact(true); setPhase(1); if (!mutedRef.current) { playStampThud(); playInkSquelch(); } }, T_IMPACT);
    push(() => setPhase(2), T_STUB);
    push(() => setPhase(3), T_VERDICT);
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Typewriter, 30ms/char.
  useEffect(() => {
    if (phase < 3 || typed === verdict) return;
    const id = window.setInterval(() => {
      setTyped((t) => (t.length >= verdict.length ? (window.clearInterval(id), t) : verdict.slice(0, t.length + 1)));
    }, 30);
    return () => window.clearInterval(id);
  }, [phase, verdict, typed]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
  };

  return (
    <div
      onClick={() => phase < 3 && skip()}
      className="relative isolate overflow-hidden border-[3px] border-[#0d0b09] bg-[#1a1614] px-4 py-10 sm:px-8 sm:py-14 text-center select-none"
      style={{
        backgroundImage:
          "repeating-linear-gradient(92deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 3px), repeating-linear-gradient(2deg, rgba(0,0,0,0.35) 0 2px, transparent 2px 6px), radial-gradient(120% 90% at 50% 0%, #241e19 0%, #1a1614 60%, #120f0d 100%)",
        animation: impact && phase < 2 ? "stampShake 120ms steps(4)" : undefined,
      }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleMute(); }}
        aria-label={muted ? "Unmute sound" : "Mute sound"}
        className="absolute right-3 top-3 z-30 inline-flex h-8 w-8 items-center justify-center border border-[#F1E7CE]/30 text-[#F1E7CE]/70 hover:text-[#F1E7CE]"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      <SkipHint show={phase < 3} />

      {/* ── BEAT 1 / 2 stage ─────────────────────────────────────────── */}
      <div className="relative mx-auto w-full max-w-md" style={{ minHeight: 260 }}>
        {phase < 2 ? (
          <Coupon
            compTitle={compTitle}
            numbers={numbers}
            entryRef={entryRef}
            jolt={impact}
            stamped={phase >= 1}
            descending={descending}
          />
        ) : (
          <Stub compTitle={compTitle} numbers={numbers} entryRef={entryRef} />
        )}
      </div>

      {/* ── BEAT 3 — Terry's verdict ─────────────────────────────────── */}
      <div className="mx-auto mt-8 min-h-[3.5rem] max-w-md">
        {phase >= 3 && (
          <p className="font-mono text-[13px] leading-relaxed text-[#F1E7CE]/85">
            {typed}
            {typed.length < verdict.length && (
              <span className="ml-0.5 inline-block" style={{ animation: "stampCaret 700ms steps(1) infinite" }}>_</span>
            )}
          </p>
        )}
      </div>

      {phase >= 3 && (
        <div className="mt-8" style={{ animation: "riseIn 400ms ease-out both" }}>
          <div className="flex flex-wrap justify-center gap-3">
            <ShareButton compTitle={compTitle} numbers={numbers} entryRef={entryRef} />
            <Button asChild variant="cream" size="lg" onClick={(e) => e.stopPropagation()}>
              <Link to="/competitions">Back to the stall</Link>
            </Button>
          </div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#F1E7CE]/50">
            {drawLine} We'll email you either way.
          </p>
        </div>
      )}
    </div>
  );
}

function SkipHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.24em] text-[#F1E7CE]/35">
      Tap to skip
    </div>
  );
}

/* ── The buyer's coupon ──────────────────────────────────────────────── */
function Coupon({
  compTitle, numbers, entryRef, jolt, stamped, descending,
}: {
  compTitle: string; numbers: number[]; entryRef: string;
  jolt: boolean; stamped: boolean; descending: boolean;
}) {
  return (
    <div className="relative">
      <div
        className="relative mx-auto w-full bg-[#F4EFE2] p-4 text-left shadow-[0_18px_40px_rgba(0,0,0,0.6)]"
        style={{
          animation: jolt
            ? "stampJolt 200ms ease-out"
            : "stampCouponSlide 700ms cubic-bezier(.2,.8,.25,1) both",
          transform: "rotate(-2deg)",
        }}
      >
        <div className="flex items-baseline justify-between border-b-2 border-[#111] pb-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#1B3A6B]">Entry coupon</span>
          <span className="font-mono text-[9px] tracking-[0.18em] text-[#111]/70">{entryRef}</span>
        </div>
        <div className="mt-2 font-display text-lg leading-tight text-[#111]">{compTitle}</div>
        <div className="mt-3 grid grid-cols-5 gap-1">
          {numbers.slice(0, 20).map((n) => (
            <span
              key={n}
              className="relative border border-[#111]/45 px-1 py-1 text-center font-mono text-[11px] tabular-nums text-[#111]"
            >
              {String(n).padStart(4, "0")}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#1B3A6B]"
                style={{ opacity: 0.75 }}
              >
                <svg viewBox="0 0 40 20" className="h-full w-full">
                  <path d="M4 14 L14 5 M6 6 L16 15" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          ))}
        </div>
        {numbers.length > 20 && (
          <div className="mt-1 font-mono text-[10px] text-[#111]/60">+{numbers.length - 20} more on the back</div>
        )}
        <Perforation color="rgba(17,17,17,0.4)" className="mt-3" />
      </div>

      {/* Ink impression */}
      {stamped && <InkMark />}

      {/* Descending rubber stamp + Terry's forearm */}
      {descending && !stamped && <StampHead />}
      {descending && <TerryArm />}
    </div>
  );
}

function StampHead() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ animation: "stampDescend 180ms cubic-bezier(.7,0,.9,.2) both" }}
    >
      <div className="h-16 w-40 border-[3px] border-[#0d0b09] bg-[#2b211a] shadow-[0_10px_30px_rgba(0,0,0,0.7)]" />
      <div className="mx-auto h-6 w-10 bg-[#3c2e24]" />
      <div className="mx-auto h-4 w-20 rounded-t-full bg-[#4a3a2c]" />
    </div>
  );
}

function TerryArm() {
  return (
    <img
      aria-hidden
      src={terryImg.url}
      alt=""
      className="pointer-events-none absolute -right-6 -top-10 z-10 h-40 w-auto opacity-90 mix-blend-luminosity"
      style={{ animation: "stampArmIn 900ms cubic-bezier(.7,0,.9,.2) both" }}
    />
  );
}

/** Distressed, off-register "ENTERED" with a roughened SVG mask and ink bleed. */
function InkMark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      style={{ animation: "stampInkBleed 200ms ease-out both", transform: "rotate(12deg)" }}
    >
      <svg viewBox="0 0 320 110" className="w-[86%]">
        <defs>
          <filter id="entered-rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="9" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
          </filter>
          <filter id="entered-bleed">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <mask id="entered-mask">
            <rect width="320" height="110" fill="white" />
            <g fill="black">
              <ellipse cx="60" cy="30" rx="26" ry="7" />
              <ellipse cx="220" cy="82" rx="34" ry="6" />
              <ellipse cx="150" cy="20" rx="18" ry="5" />
              <ellipse cx="280" cy="45" rx="14" ry="9" />
            </g>
          </mask>
        </defs>
        {/* bleed halo */}
        <g filter="url(#entered-bleed)" opacity="0.4">
          <rect x="6" y="10" width="308" height="90" fill="none" stroke="#CE2029" strokeWidth="7" />
          <text x="160" y="76" textAnchor="middle" fontFamily="Anton, Archivo, sans-serif" fontSize="58" fill="#CE2029">ENTERED</text>
        </g>
        {/* off-register second plate */}
        <g opacity="0.35" transform="translate(2.5,-2)">
          <text x="160" y="76" textAnchor="middle" fontFamily="Anton, Archivo, sans-serif" fontSize="58" fill="#7a1520">ENTERED</text>
        </g>
        <g mask="url(#entered-mask)" filter="url(#entered-rough)" opacity="0.92">
          <rect x="6" y="10" width="308" height="90" fill="none" stroke="#CE2029" strokeWidth="6" />
          <text x="160" y="76" textAnchor="middle" fontFamily="Anton, Archivo, sans-serif" fontSize="58" fill="#CE2029" letterSpacing="3">ENTERED</text>
        </g>
      </svg>
    </div>
  );
}

/* ── Beat 2 — the pocket stub ────────────────────────────────────────── */
function Stub({ compTitle, numbers, entryRef }: { compTitle: string; numbers: number[]; entryRef: string }) {
  return (
    <div
      className="mx-auto w-full max-w-sm bg-[#F4EFE2] text-left shadow-[0_14px_36px_rgba(0,0,0,0.6)]"
      style={{ animation: "stubSettle 460ms cubic-bezier(.2,1.4,.4,1) both" }}
    >
      <div className="flex items-stretch">
        <div className="flex-1 p-3">
          <div className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-[#1B3A6B]">Entry stub · {entryRef}</div>
          <div className="mt-1 font-display text-[15px] leading-tight text-[#111]">{compTitle}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {numbers.slice(0, 12).map((n) => (
              <span key={n} className="bg-[#111] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[#F4EFE2]">
                {String(n).padStart(4, "0")}
              </span>
            ))}
            {numbers.length > 12 && (
              <span className="font-mono text-[10px] text-[#111]/60">+{numbers.length - 12}</span>
            )}
          </div>
        </div>
        <Perforation orientation="vertical" color="rgba(17,17,17,0.45)" />
        <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 p-1.5">
          <img src={terryImg.url} alt="Terry" width={230} height={312} className="h-10 w-auto object-contain" />
          <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#111]/60">Terry</span>
        </div>
      </div>
      <Perforation color="rgba(17,17,17,0.45)" />
    </div>
  );
}

/* ── Share ───────────────────────────────────────────────────────────── */
function ShareButton({ compTitle, numbers, entryRef }: { compTitle: string; numbers: number[]; entryRef: string }) {
  const [busy, setBusy] = useState(false);
  const onShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    try {
      const blob = await renderShareImage(compTitle, numbers, entryRef);
      const file = blob ? new File([blob], "lucky-git-coupon.png", { type: "image/png" }) : null;
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (file && nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "Lucky Git Comps", text: `${compTitle} — entered.` });
      } else if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "lucky-git-coupon.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="gold" size="lg" onClick={onShare} disabled={busy}>
      <Share2 className="h-4 w-4" /> Share the coupon
    </Button>
  );
}

/** Pools-style share card, drawn on a canvas. */
async function renderShareImage(compTitle: string, numbers: number[], entryRef: string): Promise<Blob | null> {
  const W = 1080, H = 1080;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;

  g.fillStyle = "#F4EFE2"; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(17,17,17,0.05)";
  for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);

  g.fillStyle = "#CE2029"; g.fillRect(0, 0, W, 132);
  g.fillStyle = "#F4EFE2";
  g.font = "700 62px Anton, Archivo, sans-serif";
  g.textBaseline = "middle";
  g.fillText("LUCKY GIT COMPS", 48, 68);

  g.fillStyle = "#1B3A6B";
  g.font = "500 26px 'Courier Prime', monospace";
  g.fillText(`ENTRY REF ${entryRef}`, 48, 186);

  g.fillStyle = "#111";
  g.font = "700 54px Archivo, sans-serif";
  wrap(g, compTitle.toUpperCase(), 48, 260, W - 96, 62);

  // numbers grid
  const cols = 5, cw = (W - 96) / cols, ch = 78;
  let x = 48, y = 430;
  numbers.slice(0, 25).forEach((n, i) => {
    const cx = x + (i % cols) * cw, cy = y + Math.floor(i / cols) * ch;
    g.strokeStyle = "rgba(17,17,17,0.5)"; g.lineWidth = 2;
    g.strokeRect(cx, cy, cw - 12, ch - 12);
    g.fillStyle = "#111";
    g.font = "500 34px 'Courier Prime', monospace";
    g.fillText(String(n).padStart(4, "0"), cx + 18, cy + (ch - 12) / 2);
  });

  // stamp
  g.save();
  g.translate(W - 330, H - 250);
  g.rotate((12 * Math.PI) / 180);
  g.strokeStyle = "#CE2029"; g.lineWidth = 8;
  g.strokeRect(-20, -60, 400, 130);
  g.fillStyle = "#CE2029";
  g.font = "700 84px Anton, Archivo, sans-serif";
  g.fillText("ENTERED", 0, 8);
  g.restore();

  g.fillStyle = "rgba(17,17,17,0.65)";
  g.font = "500 24px 'Courier Prime', monospace";
  g.fillText("luckygitcomps · 18+ · play sensibly", 48, H - 56);

  return await new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = "", ly = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, ly); line = w; ly += lh; }
    else line = test;
  }
  if (line) g.fillText(line, x, ly);
}
