import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell } from "lucide-react";
import { StampSeal, Wordmark } from "./Logo";
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
    <footer className="grain relative mt-24 bg-ink text-cream border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex flex-col items-start gap-3">
            <StampSeal size={100} tone="cream" />
            <Wordmark className="text-[18px] text-cream" />
          </div>
          <p className="mt-4 text-sm text-cream/85 max-w-xs leading-relaxed">
            The odds, out in the open. A UK prize competition platform built on automated, verifiable draws and a public results log.
          </p>

          {/* Compact drop-reminder capture — replaces the old homepage block. */}
          <form onSubmit={handleSubscribe} className="mt-6 max-w-xs">
            <label htmlFor="footer-drop-email" className="block text-[11px] font-mono uppercase tracking-[0.2em] text-cream/80 mb-2">
              Get a nudge before each drop
            </label>
            <div className="flex gap-2">
              <input
                id="footer-drop-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@somewhere.co.uk"
                className="flex-1 min-w-0 rounded-md border border-cream/25 bg-transparent px-3 py-2 text-sm text-cream placeholder:text-cream/50 focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={subscribing}
                aria-label="Subscribe to drop reminders"
                className="inline-flex items-center gap-1.5 rounded-md bg-gold text-ink px-3 py-2 text-xs font-display font-extrabold uppercase tracking-wider hover:bg-gold-deep disabled:opacity-60 shrink-0"
              >
                <Bell className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
        <div>
          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/80 mb-4">Play</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/competitions" className="hover:text-gold">Live Competitions</Link></li>
            <li><Link to="/winners" className="hover:text-gold">Winners Wall</Link></li>
            <li><Link to="/how-it-works" className="hover:text-gold">How it works</Link></li>
            <li><Link to="/free-entry" className="hover:text-gold font-bold">Free entry (no purchase)</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/80 mb-4">Legit</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/terms" className="hover:text-gold">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-gold">Privacy Policy</Link></li>
            <li><Link to="/responsible-play" className="hover:text-gold">Responsible Play</Link></li>
            <li><Link to="/legal-structure" className="hover:text-gold">Legal structure</Link></li>
            <li><Link to="/faq" className="hover:text-gold">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/80 mb-4">Us</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="hover:text-gold">About</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact & Support</Link></li>
          </ul>
          <p className="mt-6 text-xs text-cream/85 leading-relaxed">
            Lucky Git Comps Ltd. Registered in England & Wales.<br />
            18+ only. Please play responsibly.
          </p>
        </div>
      </div>
      <div className="border-t border-cream/20 py-4 text-center text-[11px] font-mono tracking-wider text-cream/85">
        © {new Date().getFullYear()} LUCKYGITCOMPS · SOMEONE'S GOT TO WIN IT
      </div>
    </footer>
  );
}