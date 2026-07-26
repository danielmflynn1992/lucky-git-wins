import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Menu, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WaxSeal } from "./Logo";
import { useAuth } from "@/hooks/use-auth";
import { useBasket } from "@/hooks/use-basket";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LiveOddsTicker } from "./LiveOddsTicker";

const leftLinks = [
  { to: "/competitions", label: "Get Tickets" },
  { to: "/free-entry", label: "Free Entry" },
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

  // Scroll-shrink: once the user has scrolled past ~80px, the seal shrinks
  // and settles fully inside the header bar. prefers-reduced-motion listeners
  // still receive the state change, but the .wax-seal-transition rule below
  // drops the animation duration to 0 for those users.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <header className="sticky top-0 z-40 shadow-[0_2px_10px_-4px_rgba(60,50,30,0.25)]">
      {/* Tier 0 — live ticker, topmost element on the page, dark green strip. */}
      <LiveOddsTicker />

      {/* Tier 1 (only tier below the ticker) — hamburger left, wax seal
          centred (overhanging), then right-side nav + account links + basket.
          overflow-visible so the seal can drop below the bar. No bottom
          border — the buffer band below carries the same paper colour and a
          soft shadow separates the header from page content. */}
      <div className="bg-card/95 backdrop-blur-md relative overflow-visible">
        <div className="mx-auto max-w-7xl px-4 md:px-6 h-14 md:h-16 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 relative">
          {/* Left nav (desktop) — sits alongside the hamburger; hamburger takes
              over on smaller widths so the seal stays visually centred. */}
          <nav className="hidden lg:flex items-center justify-end gap-6 min-w-0 pr-4">
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

          {/* Hamburger — always on the left, at every breakpoint, per spec. */}
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

          {/* Centred wax seal — overhangs the header's bottom edge by half
              its size, then shrinks and settles inside the bar on scroll.
              The min-w reserves clear space in the grid centre column so
              left/right nav links can't crash into the emblem. */}
          <div className="justify-self-center shrink-0 relative z-50 pointer-events-auto min-w-[96px] md:min-w-[132px] flex justify-center">
            <div className={`relative flex justify-center ${scrolled ? "items-center" : "items-end"}`}>
              <WaxSeal
                size={
                  scrolled
                    ? "h-14 w-14"
                    : "h-[76px] w-[76px] md:h-[96px] md:w-[96px]"
                }
                className={
                  scrolled
                    ? "translate-y-0"
                    : "translate-y-[38px] md:translate-y-[48px]"
                }
              />
            </div>
          </div>

          {/* Right: primary nav (desktop) + auth (small caps, reduced size)
              + basket. All at every breakpoint where visible. */}
          <div className="flex items-center justify-end gap-5 md:gap-7 min-w-0">
            <nav className="hidden lg:flex items-center gap-6 pl-4">
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
            {/* Auth links merged in from the deleted utility row — small caps,
                reduced size, sit right of the primary nav and before the
                basket icon. Hidden on mobile (surfaced in the drawer instead). */}
            <div className="hidden md:flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/60">
              {signedIn ? (
                <>
                  <Link to="/account" className="hover:text-clover transition-colors">Account</Link>
                  <button onClick={() => supabase.auth.signOut()} className="hover:text-clover transition-colors">Sign out</button>
                </>
              ) : (
                !loading && (
                  <>
                    <Link to="/auth" search={{ redirect: undefined }} className="hover:text-clover transition-colors">Login</Link>
                    <Link to="/auth" search={{ redirect: undefined }} className="hover:text-clover transition-colors">Register</Link>
                  </>
                )
              )}
            </div>
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
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-urgent text-urgent-foreground text-[11px] font-mono font-bold flex items-center justify-center ring-2 ring-card tabular-nums"
                >
                  {basketCount > 99 ? "99+" : basketCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Buffer band — 32px cream strip directly beneath the nav row, same
          colour as the header. The seal overhangs into this band so it sits
          on an uninterrupted surface. No border, no content. */}
      <div aria-hidden="true" className="h-8 bg-card pointer-events-none" />

      {/* Content offset spacer — reserves buffer + half the seal height so
          the first element of page content is never occluded by the seal. */}
      <div aria-hidden="true" className="h-[38px] md:h-[48px] pointer-events-none" />

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
                  <Link to="/auth" search={{ redirect: undefined }} onClick={() => setOpen(false)} className="text-foreground/85 hover:text-clover">Login</Link>
                  <Link to="/auth" search={{ redirect: undefined }} onClick={() => setOpen(false)} className="text-foreground/85 hover:text-clover">Register</Link>
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