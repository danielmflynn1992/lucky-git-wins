import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Menu, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";
import { useBasket } from "@/hooks/use-basket";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const leftLinks = [
  { to: "/competitions", label: "Get Tickets" },
  { to: "/odds", label: "Best Odds" },
  { to: "/winners", label: "Winners" },
  { to: "/how-it-works", label: "How It Works" },
];
const rightLinks = [
  { to: "/past-draws", label: "Results" },
  { to: "/promise", label: "The 499 Promise" },
  { to: "/faq", label: "FAQ" },
  { to: "/", label: "Contact" },
];
const allLinks = [...leftLinks, ...rightLinks];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { session, loading } = useAuth();
  const signedIn = !!session;
  const { count: basketCount, slug: basketSlug } = useBasket();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { setOpen(false); }, [pathname]);

  // Toast on basket count change (skip initial hydration).
  const prevCountRef = useRef<number | null>(null);
  const [liveMsg, setLiveMsg] = useState("");
  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = basketCount;
    if (prev === null || prev === basketCount) return;
    const delta = basketCount - prev;
    const plural = (n: number) => `${n} ticket${n === 1 ? "" : "s"}`;
    const suffix =
      basketCount === 0
        ? "Basket empty."
        : `Basket: ${plural(basketCount)}.`;
    if (delta > 0) {
      toast.success(`Added ${plural(delta)}`, { description: suffix });
      setLiveMsg(`Added ${plural(delta)}. ${suffix}`);
    } else {
      toast(`Removed ${plural(-delta)}`, { description: suffix });
      setLiveMsg(`Removed ${plural(-delta)}. ${suffix}`);
    }
  }, [basketCount]);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus management + Escape + focus trap while the panel is open.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const trigger = toggleRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute("aria-hidden"))
        : [];
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        trigger?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      {/* Tier 1 — promo strip */}
      <div className="bg-hot text-hot-foreground text-center text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.14em] py-2.5 px-4">
        <Link to="/how-it-works" className="hover:underline underline-offset-4">
          REFER A MATE = FREE TICKETS
        </Link>
      </div>

      {/* Tier 2 — utility (socials left, auth right) */}
      <div className="bg-ink text-cream">
        <div className="mx-auto max-w-7xl px-4 h-10 flex items-center justify-between text-[11px] md:text-xs">
          <div className="flex items-center gap-4 text-cream/80">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-gold transition-colors"><Instagram className="h-[15px] w-[15px]" /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-gold transition-colors"><Facebook className="h-[15px] w-[15px]" /></a>
            <a href="mailto:hello@luckygitcomps.co.uk" aria-label="Email" className="hover:text-gold transition-colors"><Mail className="h-[15px] w-[15px]" /></a>
          </div>
          <div className="flex items-center gap-5 uppercase tracking-[0.16em] font-bold">
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
        <div className="mx-auto max-w-7xl px-4 md:px-6 h-16 md:h-24 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
          {/* Left nav */}
          <nav className="hidden lg:flex items-center justify-end gap-7 min-w-0">
            {leftLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-[13px] font-bold uppercase tracking-[0.14em] text-foreground/85 hover:text-clover transition-colors whitespace-nowrap"
                activeProps={{ className: "text-clover" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu toggle (left) */}
          <button
            ref={toggleRef}
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden justify-self-start p-2 rounded-md hover:bg-muted text-foreground/80"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-haspopup="menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Centered logo */}
          <div className="justify-self-center shrink-0">
            <Logo />
          </div>

          {/* Right nav + cart */}
          <div className="flex items-center justify-end gap-5 md:gap-7 min-w-0">
            <nav className="hidden lg:flex items-center gap-7">
              {rightLinks.map((l) => (
                <Link
                  key={l.to + l.label}
                  to={l.to}
                  className="text-[13px] font-bold uppercase tracking-[0.14em] text-foreground/85 hover:text-clover transition-colors whitespace-nowrap"
                  activeProps={{ className: "text-clover" }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link
              to="/checkout"
              search={basketSlug ? { slug: basketSlug } : undefined}
              aria-label={basketCount > 0 ? `Basket, ${basketCount} ticket${basketCount === 1 ? "" : "s"}` : "Basket, empty"}
              className={
                "relative inline-flex shrink-0 items-center justify-center h-10 w-10 rounded-full border transition-colors " +
                (basketCount > 0
                  ? "border-clover text-clover hover:bg-clover hover:text-primary-foreground"
                  : "border-border text-foreground/70 hover:border-clover hover:text-clover")
              }
            >
              <ShoppingBag className="h-5 w-5" />
              {basketCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-hot text-hot-foreground text-[11px] font-mono font-bold flex items-center justify-center ring-2 ring-card tabular-nums"
                >
                  {basketCount > 99 ? "99+" : basketCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Screen-reader live region — announces basket changes globally */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMsg}
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="lg:hidden border-t border-border bg-card"
        >
          {/* Primary nav — same order as desktop (left links then right links) */}
          <nav className="px-2 py-2 flex flex-col">
            {allLinks.map((l) => (
              <Link
                key={l.to + l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className="relative pl-4 pr-3 py-3 text-[13px] font-bold uppercase tracking-[0.14em] text-foreground/85 hover:bg-muted hover:text-clover rounded-md border-l-2 border-transparent"
                activeProps={{
                  className:
                    "text-clover bg-clover/10 border-clover",
                  "aria-current": "page",
                }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Utility: auth (mirrors desktop tier 2 right side) */}
          <div className="border-t border-border px-4 py-3 flex items-center gap-4 text-[12px] font-bold uppercase tracking-[0.16em]">
            {signedIn ? (
              <>
                <Link to="/account" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 text-foreground/85 hover:text-clover">
                  <User className="h-4 w-4" /> Account
                </Link>
                <button
                  onClick={() => { setOpen(false); supabase.auth.signOut(); }}
                  className="ml-auto text-foreground/85 hover:text-clover"
                >
                  Sign out
                </button>
              </>
            ) : (
              !loading && (
                <>
                  <Link to="/auth" onClick={() => setOpen(false)} className="text-foreground/85 hover:text-clover">Login</Link>
                  <Link to="/auth" onClick={() => setOpen(false)} className="text-foreground/85 hover:text-clover">Register</Link>
                </>
              )
            )}
          </div>

          {/* Socials (mirrors desktop tier 2 left side) */}
          <div className="border-t border-border px-4 py-3 flex items-center gap-5 text-foreground/70">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-clover"><Instagram className="h-[18px] w-[18px]" /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-clover"><Facebook className="h-[18px] w-[18px]" /></a>
            <a href="mailto:hello@luckygitcomps.co.uk" aria-label="Email" className="hover:text-clover"><Mail className="h-[18px] w-[18px]" /></a>
          </div>
        </div>
      )}
    </header>
  );
}