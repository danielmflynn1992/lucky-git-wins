import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: "Pop an email in first." })
  .email({ message: "That's not an email address, sunshine." })
  .max(255, { message: "That email's far too long." });

/**
 * Cream printed reply-slip newsletter block. Homepage-only — the footer no
 * longer renders it, so it appears exactly once per session.
 */
export function NewsletterSlip() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }
    setError(null);
    setSubscribing(true);
    const { error: insertError } = await supabase
      .from("drop_subscribers")
      .insert({ email: parsed.data });
    setSubscribing(false);
    if (insertError && !/duplicate/i.test(insertError.message)) {
      toast.error("Couldn't sign you up — try again in a bit.");
      setError("Couldn't sign you up — try again in a bit.");
      return;
    }
    setEmail("");
    setDone(true);
    toast.success("You're on the list.");
  };

  return (
    <section aria-label="Weekly drop reminders" className="mx-auto max-w-2xl px-4 mt-8 md:mt-12">
      <div
        className="relative border-[2px] bg-[var(--color-newsprint-warm)]"
        style={{ borderColor: "var(--color-ink-black)" }}
      >
        <div
          aria-hidden
          className="absolute -top-[9px] left-0 right-0 h-[16px]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 8px 8px, var(--color-paper) 4px, transparent 5px)",
            backgroundSize: "16px 16px",
            backgroundRepeat: "repeat-x",
          }}
        />
        <div
          className="px-5 py-2 font-display uppercase tracking-[0.18em] text-[13px]"
          style={{
            background: "var(--color-coupon-red)",
            color: "var(--color-on-dark-fg)",
            fontFamily: "'Anton', 'Archivo Black', system-ui, sans-serif",
          }}
        >
          New Comps · Weekly
        </div>
        <form onSubmit={handleSubscribe} className="p-5 sm:p-6">
          {done ? (
            <div>
              <p
                className="font-display uppercase tracking-[0.14em] text-[15px]"
                style={{ color: "var(--color-ink-black)" }}
              >
                You're on the list. One nudge per drop, promise.
              </p>
              <p className="mt-2 font-mono text-[11px]" style={{ color: "var(--color-ink-blue)" }}>
                We only use your email for drop reminders. Unsubscribe any time — see our privacy notice.
              </p>
            </div>
          ) : (
          <>
          <label
            htmlFor="home-drop-email"
            className="block text-[11px] font-mono uppercase tracking-[0.2em] mb-3"
            style={{ color: "var(--color-ink-black)" }}
          >
            Pop your email in — one nudge per drop, no spam.
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="home-drop-email"
              type="email"
              aria-invalid={!!error}
              aria-describedby="home-drop-note"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
              placeholder="you@somewhere.co.uk"
              className="flex-1 min-w-0 px-3 py-3 text-base focus:outline-none focus:ring-2"
              style={{
                background: "var(--color-newsprint)",
                color: "var(--color-ink-black)",
                border: `2px solid ${error ? "var(--color-coupon-red)" : "var(--color-ink-black)"}`,
                borderRadius: 0,
              }}
            />
            <button
              type="submit"
              disabled={subscribing}
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-extrabold uppercase tracking-[0.18em] disabled:opacity-60 sm:w-auto w-full"
              style={{
                background: "var(--color-coupon-red)",
                color: "var(--color-on-dark-fg)",
                border: "2px solid var(--color-ink-black)",
                borderRadius: 0,
                fontFamily: "'Anton','Archivo Black',system-ui,sans-serif",
              }}
            >
              {subscribing ? "Signing up…" : "Go on then"}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 font-mono text-[11px]" style={{ color: "var(--color-coupon-red)" }}>
              {error}
            </p>
          )}
          <p id="home-drop-note" className="mt-3 font-mono text-[10px]" style={{ color: "var(--color-ink-blue)" }}>
            Email used for drop reminders only. No selling it on, unsubscribe any time.
          </p>
          </>
          )}
        </form>
      </div>
    </section>
  );
}
