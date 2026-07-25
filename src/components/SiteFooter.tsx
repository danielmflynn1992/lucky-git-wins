import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-clover-pattern text-cream">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo variant="stacked" />
          <p className="mt-4 text-sm text-cream/70 max-w-xs">
            A proper UK prize competition site. Cheeky on the outside, deadly serious about drawing winners.
          </p>
        </div>
        <div>
          <h4 className="font-display text-gold text-lg mb-3">Play</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/competitions" className="hover:text-gold">Live Competitions</Link></li>
            <li><Link to="/live-draws" className="hover:text-gold">Live Draws</Link></li>
            <li><Link to="/winners" className="hover:text-gold">Winners Wall</Link></li>
            <li><Link to="/how-it-works" className="hover:text-gold">How it works</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-gold text-lg mb-3">Legit</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/free-postal-entry" className="hover:text-gold font-semibold">Free Postal Entry Route</Link></li>
            <li><Link to="/terms" className="hover:text-gold">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-gold">Privacy Policy</Link></li>
            <li><Link to="/responsible-play" className="hover:text-gold">Responsible Play</Link></li>
            <li><Link to="/faq" className="hover:text-gold">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-gold text-lg mb-3">Us</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-gold">About</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact & Support</Link></li>
          </ul>
          <p className="mt-6 text-xs text-cream/50">
            Lucky Git Comps Ltd. Registered in England & Wales.<br />
            18+ only. Please play responsibly.
          </p>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Lucky Git Comps. Someone's got to win it.
      </div>
    </footer>
  );
}