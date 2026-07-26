import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-cream border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo variant="stacked" />
          <p className="mt-4 text-sm text-cream/60 max-w-xs leading-relaxed">
            The odds, out in the open. A UK prize competition platform built on automated, verifiable draws and a public results log.
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/50 mb-4">Play</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/competitions" className="hover:text-gold">Live Competitions</Link></li>
            <li><Link to="/winners" className="hover:text-gold">Winners Wall</Link></li>
            <li><Link to="/how-it-works" className="hover:text-gold">How it works</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/50 mb-4">Legit</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/terms" className="hover:text-gold">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-gold">Privacy Policy</Link></li>
            <li><Link to="/responsible-play" className="hover:text-gold">Responsible Play</Link></li>
            <li><Link to="/faq" className="hover:text-gold">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/50 mb-4">Us</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="hover:text-gold">About</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact & Support</Link></li>
          </ul>
          <p className="mt-6 text-xs text-cream/70 leading-relaxed">
            Lucky Git Comps Ltd. Registered in England & Wales.<br />
            18+ only. Please play responsibly.
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-[11px] font-mono tracking-wider text-cream/70">
        © {new Date().getFullYear()} LUCKYGITCOMPS · SOMEONE'S GOT TO WIN IT
      </div>
    </footer>
  );
}