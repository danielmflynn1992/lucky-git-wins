/**
 * The Draw Board — a replayable, deterministic visual reveal of a draw that
 * already happened. Theatre on top of the maths: every frame is driven by the
 * stored draw record, so two people replaying it see the identical sequence.
 * No draw logic lives here.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Loader2, RotateCcw, Volume2, VolumeX, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { drawBoardBySlugQuery, drawBoardByDrawIdQuery, type DrawBoardData } from "@/lib/draw-board-api";
import { Perforation } from "@/components/Perforation";
import { ExampleBanner } from "@/lib/demo";
import terryImg from "@/assets/terry-panel.png.asset.json";

/* ─────────────────────────── timings (ms) ─────────────────────────── */
const T_HEADER = 200;
const T_STAMP_DATE = 700;
const T_FLUTTER = 1200;
const T_LOCK_0 = 3000;
const T_LOCK_STEP = 1500;
const T_WINNER_STAMP = T_LOCK_0 + T_LOCK_STEP * 2 + 350;
const T_NAME = T_WINNER_STAMP + 600;

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function ukDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/London",
  });
}
function ukTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
  });
}

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ─────────────────────────── mechanical sound ─────────────────────────── */
function useFlapSound(muted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const ctx = () => {
    if (typeof window === "undefined") return null;
    const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctor = W.AudioContext ?? W.webkitAudioContext;
    if (!Ctor) return null;
    ctxRef.current ??= new Ctor();
    return ctxRef.current;
  };
  return useCallback(
    (kind: "flap" | "clunk") => {
      if (muted) return;
      const ac = ctx();
      if (!ac) return;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(kind === "clunk" ? 90 : 320, now);
      osc.frequency.exponentialRampToValueAtTime(kind === "clunk" ? 45 : 180, now + 0.06);
      gain.gain.setValueAtTime(kind === "clunk" ? 0.16 : 0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "clunk" ? 0.18 : 0.05));
      osc.connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    },
    [muted],
  );
}

/* ─────────────────────────── split-flap digit ─────────────────────────── */
function Flap({
  value,
  spinning,
  locked,
}: {
  value: string;
  spinning: boolean;
  locked: boolean;
}) {
  const [shown, setShown] = useState(spinning ? "0" : value);
  const [flip, setFlip] = useState(0);

  useEffect(() => {
    if (!spinning) {
      setShown(value);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(DIGITS[i % 10]!);
      setFlip((f) => f + 1);
    }, 70);
    return () => clearInterval(id);
  }, [spinning, value]);

  return (
    <span
      className={
        "relative inline-flex h-[clamp(56px,17vw,104px)] w-[clamp(40px,12vw,74px)] items-center justify-center overflow-hidden border-2 border-[var(--color-ink-black)] bg-[#141414] font-mono font-black tabular-nums text-[clamp(30px,10vw,58px)] leading-none text-[#F3E7C8] " +
        (locked ? "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : "")
      }
    >
      {/* centre hinge line */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[2px] -translate-y-1/2 bg-black/70" />
      <span key={spinning ? flip : `l-${value}`} className="draw-flap-face">
        {shown}
      </span>
    </span>
  );
}

/* ─────────────────────────── the board ─────────────────────────── */
type Phase = "pending" | "drawing" | "drawn";

function phaseOf(data: DrawBoardData): Phase {
  if (data.draw) return "drawn";
  if (data.endsAt && new Date(data.endsAt).getTime() <= Date.now()) return "drawing";
  return "pending";
}

function DrawBoardView({ data }: { data: DrawBoardData }) {
  const phase = phaseOf(data);
  const draw = data.draw;
  const target = String(draw?.winningNumber ?? 0).padStart(3, "0").split("");

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [muted, setMuted] = useState(true);
  const playSound = useFlapSound(muted);
  const [runId, setRunId] = useState(0);
  const [t, setT] = useState(prefersReduced ? Number.MAX_SAFE_INTEGER : 0);

  // Clock for the reveal timeline. Runs once per playthrough.
  useEffect(() => {
    if (phase !== "drawn" || prefersReduced) return;
    setT(0);
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      setT(elapsed);
      if (elapsed > T_NAME + 2600) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [phase, runId, prefersReduced]);

  const lockedCount =
    phase !== "drawn" ? 0 : Math.max(0, Math.min(3, Math.floor((t - T_LOCK_0) / T_LOCK_STEP) + 1));
  const fluttering = phase === "drawing" || (phase === "drawn" && t >= T_FLUTTER && lockedCount < 3);
  const stamped = phase === "drawn" && t >= T_WINNER_STAMP;
  const nameChars =
    phase === "drawn" && t >= T_NAME ? Math.floor((t - T_NAME) / 45) : 0;

  // Mechanical audio, tied to the same timeline.
  const lastLock = useRef(0);
  useEffect(() => {
    if (phase !== "drawn") return;
    if (lockedCount > lastLock.current) {
      lastLock.current = lockedCount;
      playSound("clunk");
    }
    if (lockedCount === 0) lastLock.current = 0;
  }, [lockedCount, phase, playSound]);

  useEffect(() => {
    if (!fluttering || muted) return;
    const id = setInterval(() => playSound("flap"), 140);
    return () => clearInterval(id);
  }, [fluttering, muted, playSound]);

  const winnerLine = draw
    ? [draw.winnerDisplayName, draw.winnerTown].filter(Boolean).join(" — ")
    : "";

  const replay = () => {
    lastLock.current = 0;
    setRunId((n) => n + 1);
  };

  return (
    <section
      id="draw-board"
      aria-label="The Draw Board"
      className="border-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]"
    >
      <div className="flex items-center justify-between gap-2 bg-[var(--color-ink-blue)] px-3 py-1.5">
        <span className="font-display uppercase tracking-[0.16em] text-[11px] text-[var(--color-paper)]">
          The Draw Board
        </span>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-pressed={!muted}
          className="inline-flex items-center gap-1 font-mono uppercase tracking-[0.14em] text-[10px] text-[var(--color-paper)]/85 hover:text-[var(--color-paper)]"
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>

      {data.isDemo && (
        <div className="p-3 pb-0">
          <ExampleBanner />
        </div>
      )}

      {/* Wooden framed board */}
      <div className="p-3 sm:p-5">
        <div
          className={"draw-board-frame relative " + (stamped && t < T_WINNER_STAMP + 500 ? "draw-board-shake" : "")}
        >
          <div className="bg-[#101010] p-3 sm:p-5">
            <div className={"text-center " + (phase === "drawn" && t < T_HEADER ? "opacity-0" : "draw-board-stampin")}>
              <div className="font-display uppercase tracking-[0.18em] text-[11px] sm:text-[13px] text-[#E9DCB8]">
                Official draw — Competition No. {data.compNumber}
              </div>
              <div
                className={
                  "mt-1 font-mono uppercase tracking-[0.14em] text-[10px] text-[#E9DCB8]/70 " +
                  (phase === "drawn" && t < T_STAMP_DATE ? "opacity-0" : "opacity-100")
                }
              >
                {phase === "drawn"
                  ? `Drawn ${ukDate(draw!.drawnAt)} at ${ukTime(draw!.drawnAt)}`
                  : phase === "drawing"
                    ? "Draw in progress"
                    : `Closes ${ukDate(data.endsAt)} at ${ukTime(data.endsAt)}`}
              </div>
            </div>

            <div className="mt-4 flex items-end justify-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                {target.map((d, i) => (
                  <Flap
                    key={`${runId}-${i}`}
                    value={phase === "drawn" ? d : "—"}
                    spinning={phase === "drawing" || (phase === "drawn" && fluttering && i >= lockedCount)}
                    locked={phase === "drawn" && i < lockedCount}
                  />
                ))}
              </div>
              {/* Terry, existing asset only */}
              <img
                src={terryImg.url}
                alt="Terry, the Lucky Git Comps mascot, watching the board"
                width={230}
                height={312}
                loading="lazy"
                decoding="async"
                className="hidden sm:block h-[clamp(70px,14vw,120px)] w-auto select-none object-contain"
              />
            </div>

            <div className="mt-3 min-h-[42px] text-center">
              {phase === "pending" && (
                <div className="font-display uppercase tracking-[0.2em] text-[12px] text-[#E9DCB8]">
                  Draw pending · Sold {data.soldCount}/{data.totalTickets}
                </div>
              )}
              {phase === "drawing" && (
                <div className="font-display uppercase tracking-[0.2em] text-[12px] text-[#FFD447]">
                  Draw in progress
                </div>
              )}
              {phase === "drawn" && (
                <div className="font-mono text-[13px] text-[#E9DCB8]">
                  {nameChars > 0 ? (
                    <>
                      {winnerLine.slice(0, nameChars)}
                      {nameChars < winnerLine.length && <span className="draw-caret">▍</span>}
                    </>
                  ) : (
                    <span className="opacity-0">placeholder</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {stamped && (
            <span aria-hidden className="draw-winner-stamp">Winner</span>
          )}
        </div>

        {/* Screen-reader equivalent — no animation required. */}
        <p className="sr-only">
          {phase === "drawn"
            ? `Official draw, competition number ${data.compNumber}. Winning ticket number ${draw!.winningNumber}. Winner ${winnerLine || "not published"}. Drawn ${ukDate(draw!.drawnAt)} at ${ukTime(draw!.drawnAt)}.`
            : phase === "drawing"
              ? "Entries are closed and the automatic draw is running."
              : `Draw pending. ${data.soldCount} of ${data.totalTickets} tickets sold.`}
        </p>

        {phase === "drawn" && !prefersReduced && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={replay}
              className="inline-flex items-center gap-1.5 border-2 border-[var(--color-ink-black)] bg-[var(--color-ink-yellow)] px-4 py-2.5 font-display uppercase tracking-[0.14em] text-[11px] text-[var(--color-ink-black)] hover:bg-[var(--color-paper)]"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Replay draw
            </button>
          </div>
        )}

        <p className="mt-3 text-center font-body text-[13px] text-[var(--color-ink-grey)]">
          Every draw is locked in before it happens and checked after. No fingers on the
          scales — Terry's watching.
        </p>
      </div>

      <Perforation color="var(--color-ink-black)" className="opacity-40" />

      <TrustStrip data={data} phase={phase} />
    </section>
  );
}

/* ─────────────────────────── trust strip + check ─────────────────────────── */
function TrustStrip({ data, phase }: { data: DrawBoardData; phase: Phase }) {
  const draw = data.draw;
  const steps = [
    {
      done: Boolean(data.seedPublishedAt),
      label: `Seed published before draw — ${ukDate(data.seedPublishedAt)} at ${ukTime(data.seedPublishedAt)}`,
    },
    {
      done: phase !== "pending",
      label:
        phase === "pending"
          ? `Entries locking — ${data.soldCount} of ${data.totalTickets} tickets sold`
          : `Entries locked — ${draw?.totalSold ?? data.soldCount} of ${data.totalTickets} tickets sold`,
    },
    {
      done: phase === "drawn",
      label:
        phase === "drawn"
          ? `Winning number generated — ${ukDate(draw!.drawnAt)} at ${ukTime(draw!.drawnAt)}`
          : "Winning number generated — pending",
    },
  ];

  return (
    <div className="p-3 sm:p-5">
      <ol className="grid gap-2 sm:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.label}
            className={
              "flex items-start gap-2 border border-dashed px-3 py-2 font-mono text-[11px] leading-snug " +
              (s.done
                ? "border-[var(--color-ink-blue)] bg-[var(--color-paper)] text-[var(--color-ink-blue)]"
                : "border-[var(--color-ink-grey)]/50 bg-[var(--color-paper)]/60 text-[var(--color-ink-grey)]")
            }
          >
            {s.done ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <span aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-current" />
            )}
            <span>{s.label}</span>
          </li>
        ))}
      </ol>

      {phase === "drawn" && draw && <CheckItYourself draw={draw} compId={data.competitionId} />}
    </div>
  );
}

function CheckItYourself({
  draw,
  compId,
}: {
  draw: NonNullable<DrawBoardData["draw"]>;
  compId: string | null;
}) {
  const [state, setState] = useState<"idle" | "checking" | "ok" | "bad">("idle");
  const [computed, setComputed] = useState<string | null>(null);
  const [serverNote, setServerNote] = useState<string | null>(null);
  const [showMaths, setShowMaths] = useState(false);

  const run = async () => {
    setState("checking");
    try {
      const hash = await sha256Hex(draw.seedRevealed);
      setComputed(hash);
      const clientOk = hash.toLowerCase() === draw.seedHash.toLowerCase();
      let serverOk = clientOk;
      try {
        const res = await fetch(`/api/public/verify-draw?drawId=${encodeURIComponent(draw.id)}`);
        const json = (await res.json()) as { status?: string; reason?: string };
        if (json.status) {
          serverOk = json.status === "pass";
          setServerNote(json.reason ?? null);
        }
      } catch {
        setServerNote(null);
      }
      setState(clientOk && serverOk ? "ok" : "bad");
    } catch {
      setState("bad");
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={run}
        disabled={state === "checking"}
        className="w-full border-2 border-[var(--color-ink-black)] bg-[var(--color-ink-blue)] px-4 py-3 font-display uppercase tracking-[0.16em] text-[12px] text-[var(--color-paper)] hover:bg-[var(--color-ink-black)] disabled:opacity-70"
      >
        {state === "checking" ? (
          <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking…</span>
        ) : (
          "Check this draw yourself"
        )}
      </button>

      {state === "ok" && (
        <div className="mt-3 flex items-start gap-3 border-2 border-[var(--color-ink-blue)] bg-[var(--color-paper)] p-4">
          <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-[var(--color-ink-blue)]" />
          <div>
            <p className="font-display uppercase tracking-[0.12em] text-[13px] text-[var(--color-ink-blue)]">
              This draw checks out.
            </p>
            <p className="mt-1 font-body text-[13px] text-[var(--color-ink-black)]">
              The winning number was locked in before anyone could change it — including us.
            </p>
            {serverNote && (
              <p className="mt-1 font-mono text-[10px] text-[var(--color-ink-grey)]">{serverNote}</p>
            )}
          </div>
        </div>
      )}

      {state === "bad" && (
        <div className="mt-3 flex items-start gap-3 border-2 border-[var(--color-ink-red)] bg-[var(--color-ink-red)]/10 p-4">
          <XCircle className="mt-0.5 h-7 w-7 shrink-0 text-[var(--color-ink-red)]" />
          <div>
            <p className="font-display uppercase tracking-[0.12em] text-[13px] text-[var(--color-ink-red)]">
              This draw does not check out.
            </p>
            <p className="mt-1 font-body text-[13px] text-[var(--color-ink-black)]">
              Tell us immediately — something has been changed after the fact.
            </p>
          </div>
        </div>
      )}

      {state !== "idle" && state !== "checking" && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowMaths((v) => !v)}
            aria-expanded={showMaths}
            className="inline-flex items-center gap-1 font-body text-[12px] font-bold text-[var(--color-ink-blue)] underline underline-offset-2"
          >
            Show the maths (for the curious)
            <ChevronDown className={"h-3.5 w-3.5 transition-transform " + (showMaths ? "rotate-180" : "")} />
          </button>
          {showMaths && (
            <div className="mt-2 space-y-2 border border-[var(--color-ink-black)]/30 bg-[var(--color-paper)] p-3 font-mono text-[11px] break-all text-[var(--color-ink-black)]">
              <Row label="Sealed hash, published before close">{draw.seedHash || "—"}</Row>
              <Row label="Revealed seed">{draw.seedRevealed || "—"}</Row>
              <Row label="SHA-256 of the revealed seed (computed in your browser)">
                {computed ?? "—"}
              </Row>
              <Row label="Entries in the pool">{draw.poolSize.toLocaleString()}</Row>
              <Row label="Winning ticket">#{String(draw.winningNumber).padStart(3, "0")}</Row>
              {compId && (
                <Link
                  to="/draws/$id/reveal"
                  params={{ id: draw.id }}
                  className="inline-block font-body text-[12px] font-bold text-[var(--color-ink-blue)] underline"
                >
                  Full step-by-step derivation →
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-body text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-grey)]">{label}</div>
      <div>{children}</div>
    </div>
  );
}

/* ─────────────────────────── containers ─────────────────────────── */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-[1.5px] border-dashed border-[var(--color-ink-black)]/40 bg-[var(--color-paper-raised)] p-6 text-center font-mono text-[12px] text-[var(--color-ink-grey)]">
      {children}
    </div>
  );
}

/** Board for a competition page, live-updating when the draw lands. */
export function DrawBoardForCompetition({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(drawBoardBySlugQuery(slug));

  const competitionId = data?.competitionId ?? null;
  const hasDraw = Boolean(data?.draw);

  useEffect(() => {
    if (!competitionId || hasDraw) return;
    const channel = supabase
      .channel(`draw-board-${competitionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "draws", filter: `competition_id=eq.${competitionId}` },
        () => void qc.invalidateQueries({ queryKey: ["draw-board"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [competitionId, hasDraw, qc]);

  if (isLoading) return <Frame>Loading the board…</Frame>;
  if (!data) return null;
  return <DrawBoardView data={data} />;
}

/** Board for a single draw — Winners Wall and homepage Latest Result. */
export function DrawBoardForDraw({ drawId }: { drawId: string }) {
  const { data, isLoading } = useQuery(drawBoardByDrawIdQuery(drawId));
  if (isLoading) return <Frame>Loading the board…</Frame>;
  if (!data) return null;
  return <DrawBoardView data={data} />;
}
