import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Menu, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const leftLinks = [
  { to: "/competitions", label: "Get Tickets" },
  { to: "/winners", label: "Winners" },
  { to: "/how-it-works", label: "How It Works" },
];
const rightLinks = [
  { to: "/past-draws", label: "Results" },
  { to: "/faq", label: "FAQ" },
  { to: "/", label: "Contact" },
];
const allLinks = [...leftLinks, ...rightLinks];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { session, loading } = useAuth();
  const signedIn = !!session;
  return (
    <header className="sticky top-0 z-40 shadow-sm">
      {/* Tier 1 — promo strip */}
      <div className="bg-hot text-hot-foreground text-center text-xs sm:text-sm font-semibold tracking-wide py-2 px-4">
        <Link to="/how-it-works" className="hover:underline underline-offset-4">
          REFER A MATE = FREE TICKETS
        </Link>
      </div>

      {/* Tier 2 — utility (socials left, auth right) */}
      <div className="bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 h-9 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-cream/80">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-gold transition-colors"><Instagram className="h-4 w-4" /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-gold transition-colors"><Facebook className="h-4 w-4" /></a>
            <a href="mailto:hello@luckygitcomps.co.uk" aria-label="Email" className="hover:text-gold transition-colors"><Mail className="h-4 w-4" /></a>
          </div>
          <div className="flex items-center gap-4 uppercase tracking-wider font-semibold">
            {signedIn ? (
              <>
                <Link to="/account" className="hover:text-gold transition-colors">Account</Link>
                <button onClick={() => supabase.auth.signOut()} className="hover:text-gold transition-colors">Sign out</button>
              </>
            ) : (
              !loading && (
                <>
                  <Link to="/auth" className="hover:text-gold transition-colors">Login</Link>
                  <Link to="/auth" className="hover:text-gold transition-colors">Register</Link>
                </>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tier 3 — main bar: nav | centered logo | cart */}
      <div className="bg-card/95 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-7xl px-4 h-20 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Left nav */}
          <nav className="hidden lg:flex items-center justify-end gap-6">
            {leftLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm font-semibold uppercase tracking-wider text-foreground/80 hover:text-clover transition-colors"
                activeProps={{ className: "text-clover" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu toggle (left) */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden justify-self-start p-2 rounded-md hover:bg-muted text-foreground/80"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Centered logo */}
          <div className="justify-self-center">
            <Logo />
          </div>

          {/* Right nav + cart */}
          <div className="flex items-center justify-end gap-6">
            <nav className="hidden lg:flex items-center gap-6">
              {rightLinks.map((l) => (
                <Link
                  key={l.to + l.label}
                  to={l.to}
                  className="text-sm font-semibold uppercase tracking-wider text-foreground/80 hover:text-clover transition-colors"
                  activeProps={{ className: "text-clover" }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link
              to="/checkout"
              aria-label="Basket"
              className="relative inline-flex items-center justify-center h-10 w-10 rounded-full border border-border hover:border-clover hover:text-clover transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-clover text-primary-foreground text-[10px] font-bold flex items-center justify-center">0</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="lg:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1">
          {allLinks.map((l) => (
            <Link
              key={l.to + l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className="px-3 py-3 text-sm font-semibold uppercase tracking-wider rounded-md hover:bg-muted text-foreground/80"
            >
              {l.label}
            </Link>
          ))}
          {!signedIn && !loading && (
            <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-3 text-sm font-semibold uppercase tracking-wider rounded-md hover:bg-muted text-foreground/80 inline-flex items-center gap-2">
              <User className="h-4 w-4" /> Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}