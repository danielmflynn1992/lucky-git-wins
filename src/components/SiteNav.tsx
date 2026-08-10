import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Menu, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LOCKUP_HORIZONTAL_URL, StampSeal } from "./Logo";
import { useAuth } from "@/hooks/use-auth";
import { useBasket } from "@/hooks/use-basket";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LiveOddsTicker } from "./LiveOddsTicker";

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
      toast.success("In the bag.", { description: `${plural(delta)} · ${suffix}` });
      setLiveMsg(`In the bag. ${plural(delta)}. ${suffix}`);
    } else {
      toast("Fair enough.", { description: `${plural(-delta)} · ${suffix}` });
      setLiveMsg(`Removed ${plural(-delta)}. ${suffix}`);
    }
  }, [basketCount]);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll-condense: over 80px scroll the masthead compresses from 68/80px to
  // 56px, the seal shrinks 44→34, and the flanking rules + guilloché fade out.
  // Motion is CSS-driven so `prefers-reduced-motion` disables it via the
  // `.mast-transition` utility in src/styles.css.
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
    <header className="sticky top-0 z-40 bg-card" data-scrolled={scrolled ? "true" : "false"}>
      {/* Tier 0 — live ticker, topmost element on the page, dark green strip. */}
      <LiveOddsTicker />

      {/* Single merged masthead row: burger left · logo centre · basket right.
          At rest it shows the full banner lockup; past 80px of scroll it
          collapses to a 52px compact bar with the square Terry mark. */}
      <div
        className="relative bg-card mast-transition"
        style={{ transition: "height 200ms ease" }}
      >
        <div
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 md:px-6"
          style={{ padding: scrolled ? "0 8px" : "5px 8px", minHeight: scrolled ? 52 : undefined }}
        >
          <button
            ref={toggleRef}
            onClick={() => setOpen((o) => !o)}
            className="shrink-0 p-2 rounded-md hover:bg-muted text-foreground/80"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-haspopup="menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link
            to="/"
            aria-label="Lucky Git Comps — home"
            className="min-w-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clover"
          >
            {scrolled ? (
              <StampSeal size={40} />
            ) : (
              <img
                src={LOCKUP_HORIZONTAL_URL}
                alt="Lucky Git Comps"
                draggable={false}
                className="block w-auto max-w-full select-none pointer-events-none"
                style={{ maxHeight: 72 }}
              />
            )}
          </Link>

          <Link
            to="/checkout"
            search={basketSlug ? { slug: basketSlug } : undefined}
            aria-label="Basket"
            className={
              "relative inline-flex items-center justify-center h-8 w-8 rounded-full border transition-colors shrink-0 " +
              (basketCount > 0
                ? "border-clover text-clover hover:bg-clover hover:text-primary-foreground"
                : "border-border text-foreground/70 hover:border-clover hover:text-clover")
            }
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Basket{basketCount > 0 ? `, ${basketCount} ticket${basketCount === 1 ? "" : "s"}` : ", empty"}</span>
            {basketCount > 0 && (
              <span
                aria-hidden
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-urgent text-urgent-foreground text-[10px] font-mono font-bold flex items-center justify-center ring-2 ring-card tabular-nums"
              >
                {basketCount > 99 ? "99+" : basketCount}
              </span>
            )}
          </Link>
        </div>

        {/* Desktop primary nav sits under the banner at rest only. */}
        {!scrolled && (
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center justify-center gap-5 pb-1 text-[0.8125rem] tracking-[0.12em] font-bold uppercase"
            style={{ color: "var(--color-ink-blue, #123)" }}
          >
            <Link to="/competitions" className="hover:text-clover transition-colors whitespace-nowrap">Competitions</Link>
            <Link to="/draw-day" className="hover:text-clover transition-colors whitespace-nowrap">Draw Day</Link>
            <Link to="/winners" className="hover:text-clover transition-colors whitespace-nowrap">Winners</Link>
            <Link to="/about" className="hover:text-clover transition-colors whitespace-nowrap">About</Link>
            <Link to="/verify" className="hover:text-clover transition-colors whitespace-nowrap">Verify</Link>
          </nav>
        )}

        <div aria-hidden="true" className="h-[2px]" style={{ background: "var(--color-ink-blue, #123)" }} />
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
          className="border-t border-border bg-card"
        >
          {/* Primary nav — single column on mobile, two columns from md up so the
              panel doesn't run tall on desktop. */}
          <nav className="px-2 py-2 flex flex-col md:grid md:grid-cols-2 md:gap-x-4 md:px-6">
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