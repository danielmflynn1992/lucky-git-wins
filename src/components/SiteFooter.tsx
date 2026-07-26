import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lockup } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    const { error } = await supabase.from("drop_subscribers").insert({ email: email.trim() });
    setSubscribing(false);
    if (error && !/duplicate/i.test(error.message)) {
      toast.error("Couldn't sign you up — try again in a bit.");
      return;
    }
    setEmail("");
    toast.success("You're on the list. We'll ping you before each drop.");
  };

  return (
    <footer className="relative mt-12 md:mt-20">
      {/* -------- NEWSLETTER REPLY-SLIP --------
          Cream printed reply-slip sitting on the paper surface ABOVE the
          dark footer. Perforated top edge, heavy 2px black rule border,
          red masthead. Deliberately not inside the ink-blue block. */}
      <section
        aria-label="Weekly drop reminders"
        className="mx-auto max-w-2xl px-4"
      >
        <div
          className="relative border-[2px] bg-[var(--color-newsprint-warm)]"
          style={{ borderColor: "var(--color-ink-black)" }}
        >
          {/* perforated top edge */}
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
          {/* red masthead */}
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
            <label
              htmlFor="footer-drop-email"
              className="block text-[11px] font-mono uppercase tracking-[0.2em] mb-3"
              style={{ color: "var(--color-ink-black)" }}
            >
              Pop your email in — one nudge per drop, no spam.
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="footer-drop-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@somewhere.co.uk"
                className="flex-1 min-w-0 px-3 py-3 text-base focus:outline-none focus:ring-2"
                style={{
                  background: "var(--color-newsprint)",
                  color: "var(--color-ink-black)",
                  border: "2px solid var(--color-ink-black)",
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
                {subscribing ? "Signing up…" : "Sign me up"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* -------- INK-BLUE LINK GRID -------- */}
      <div
        className="mt-8 md:mt-12"
        style={{
          background: "var(--color-ink-blue)",
          color: "var(--color-on-dark-fg)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 md:pt-8 md:pb-12 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div
              className="flex"
              style={{ color: "var(--color-on-dark-fg)" }}
            >
              <Lockup style={{ maxWidth: 260, width: "100%", height: "auto" }} />
            </div>
            <p
              className="mt-4 text-sm max-w-xs leading-relaxed"
              style={{ color: "var(--color-on-dark-fg)" }}
            >
              The odds, out in the open. A UK prize competition platform built on automated, verifiable draws and a public results log.
            </p>
          </div>
          <FooterCol
            heading="Play"
            links={[
              { to: "/competitions", label: "Competitions" },
              { to: "/winners", label: "Winners" },
              { to: "/about", label: "About" },
              { to: "/verify", label: "Verify" },
            ]}
          />
          <FooterCol
            heading="Legit"
            links={[
              { to: "/terms", label: "Terms & Conditions" },
              { to: "/privacy", label: "Privacy Policy" },
              { to: "/responsible-play", label: "Responsible Play" },
              { to: "/how-entry-works", label: "How entry works" },
              { to: "/faq", label: "FAQ" },
            ]}
          />
          <div>
            <FooterCol
              heading="Us"
              links={[
                { to: "/about", label: "About" },
                { to: "/contact", label: "Contact & Support" },
              ]}
            />
            <p
              className="mt-6 text-xs leading-relaxed"
              style={{ color: "var(--color-on-dark-fg)" }}
            >
              Lucky Git Comps Ltd. Registered in England & Wales.<br />
              <span
                className="inline-flex items-center gap-1 font-bold"
                style={{ color: "var(--color-marker)" }}
              >
                <span
                  aria-label="18 plus"
                  className="inline-flex items-center justify-center min-w-8 h-7 px-1.5 border-2 border-current text-xs font-black leading-none"
                >
                  18+
                </span>
                UK only. Please play responsibly.
              </span>
            </p>
          </div>
        </div>
        <div
          className="py-4 text-center text-[11px] font-mono tracking-wider"
          style={{
            borderTop: "1px solid color-mix(in oklab, var(--color-on-dark-fg) 22%, transparent)",
            color: "var(--color-on-dark-fg)",
          }}
        >
          © {new Date().getFullYear()} LUCKYGITCOMPS · SOMEONE'S GOT TO WIN IT
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { to: string; label: string; bold?: boolean }[];
}) {
  return (
    <div>
      <h4
        className="text-[11px] font-mono uppercase tracking-[0.22em] mb-4"
        style={{
          color: "var(--color-marker)",
          fontWeight: 700,
        }}
      >
        {heading}
      </h4>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="hover:underline underline-offset-4"
              style={{
                color: "var(--color-on-dark-fg)",
                fontWeight: l.bold ? 700 : 400,
              }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}