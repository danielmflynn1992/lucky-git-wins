import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Minus, Plus, Shuffle, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gbp } from "@/lib/format";
import { newReservationToken, reserveLuckyDip } from "@/lib/competitions-api";
import type { Competition } from "@/lib/mock-comps";

interface Props {
  comp: Competition;
  open: boolean;
  onClose: () => void;
  /** Cap qty; defaults to 25. */
  maxQty?: number;
}

export function QuickAddDialog({ comp, open, onClose, maxQty = 25 }: Props) {
  const navigate = useNavigate();
  const [qty, setQty] = useState(5);
  const [answered, setAnswered] = useState<number | null>(null);
  const [reserving, setReserving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const canProceed = answered !== null && answered === comp.skillQuestion.correct;
  const total = comp.pricePerTicket * qty;

  const close = () => {
    if (reserving) return;
    setQty(5); setAnswered(null); setErr(null);
    onClose();
  };

  const submit = async () => {
    if (!canProceed) { setErr("Answer the skill question correctly to continue."); return; }
    setErr(null); setReserving(true);
    try {
      const token = newReservationToken();
      const numbers = await reserveLuckyDip(comp.slug, qty, token, answered!);
      sessionStorage.setItem("lgc:reservation", JSON.stringify({
        token,
        slug: comp.slug,
        numbers,
        skillAnswer: answered,
        skillQuestion: comp.skillQuestion.q,
        skillAnswerText: comp.skillQuestion.options[answered!],
        expires: Date.now() + 15 * 60_000,
      }));
      window.dispatchEvent(new Event("lgc:basket-change"));
      navigate({ to: "/checkout", search: { slug: comp.slug, qty: numbers.length } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Reservation failed.");
      setReserving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={close}
    >
      <div
        className="bg-background rounded-3xl border-2 border-border w-full max-w-md p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          disabled={reserving}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-xs font-bold uppercase tracking-widest text-clover">Quick add · Lucky Dip</div>
        <h3 className="mt-1 font-display text-2xl font-black leading-tight pr-8">{comp.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Random numbers assigned. Pick a specific one? Open the competition page.
        </p>

        {/* Quantity stepper */}
        <div className="mt-5 rounded-2xl border-2 border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Tickets</div>
              <div className="flex items-baseline gap-2">
                <div className="font-display font-black text-4xl tabular-nums">{qty}</div>
                <div className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                  <Shuffle className="h-3 w-3" /> lucky dip
                </div>
              </div>
            </div>
            <div className="inline-flex items-center rounded-full border-2 border-border overflow-hidden">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={reserving || qty <= 1}
                className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="w-10 text-center font-mono font-bold tabular-nums">{qty}</div>
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={reserving || qty >= maxQty}
                className="h-10 w-10 inline-flex items-center justify-center hover:bg-muted disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {[1, 5, 10, 25].filter((n) => n <= maxQty).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQty(n)}
                disabled={reserving}
                className={`px-3 py-1 rounded-full border text-xs font-bold font-mono tabular-nums transition-colors ${
                  qty === n ? "bg-ink text-cream border-ink" : "bg-card border-border text-muted-foreground hover:border-clover hover:text-clover"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <div className="text-xs text-muted-foreground">{gbp(comp.pricePerTicket)} × {qty}</div>
            <div className="font-display font-black text-2xl tabular-nums">{gbp(total)}</div>
          </div>
        </div>

        {/* Skill question */}
        <div className="mt-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-clover">Skill question · required</div>
          <p className="mt-1 font-display text-lg font-black leading-snug">{comp.skillQuestion.q}</p>
          <div className="mt-3 space-y-2">
            {comp.skillQuestion.options.map((opt, i) => {
              const chosen = answered === i;
              const right = chosen && i === comp.skillQuestion.correct;
              const wrong = chosen && i !== comp.skillQuestion.correct;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAnswered(i)}
                  disabled={reserving}
                  className={`w-full text-left rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between ${
                    right ? "border-clover bg-clover/10" : wrong ? "border-hot bg-hot/10" : "border-border bg-card hover:border-clover/40"
                  }`}
                >
                  <span>{String.fromCharCode(65 + i)}. {opt}</span>
                  {right && <CheckCircle2 className="h-4 w-4 text-clover" />}
                  {wrong && <AlertTriangle className="h-4 w-4 text-hot" />}
                </button>
              );
            })}
          </div>
          {answered !== null && (
            <div className={`mt-2 text-xs font-bold ${canProceed ? "text-clover" : "text-hot"}`}>
              {canProceed ? "Correct. You can continue." : "Not quite — pick another answer."}
            </div>
          )}
        </div>

        {err && (
          <div className="mt-3 text-xs text-hot flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <Button variant="cream" onClick={close} className="flex-1" disabled={reserving}>Cancel</Button>
          <Button variant="gold" size="lg" disabled={!canProceed || reserving} onClick={submit} className="flex-1">
            {reserving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Locking…</>) : <>Add {qty} · {gbp(total)}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}