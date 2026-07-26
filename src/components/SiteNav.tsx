import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, Menu, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Lockup, LOCKUP_HORIZONTAL_URL } from "./Logo";
import { Guilloche } from "./Guilloche";
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

      {/* Row 1 — full-bleed masthead banner. Zero horizontal padding. The
          source PNG carries baked-in transparent padding on all sides;
          the wrapper crops it with overflow-hidden + a scaled/positioned
          <img>, leaving ≤8px of vertical breathing room above/below the
          printed artwork. */}
      <Link
        to="/"
        aria-label="Lucky Git Comps — home"
        className="block w-full overflow-hidden bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clover"
        style={{ height: "clamp(44px, 13vw, 78px)", padding: "1px 0" }}
      >
        <img
          src={LOCKUP_HORIZONTAL_URL}
          alt="Lucky Git Comps"
          draggable={false}
          className="block select-none pointer-events-none mx-auto"
          style={{
            height: "100%",
            width: "auto",
            maxWidth: "none",
            // Scale to crop the baked-in transparent margins on the PNG.
            transform: "scale(1.55)",
            transformOrigin: "center",
          }}
        />
      </Link>

      {/* 2px black rule separating row 1 from row 2. */}
      <div aria-hidden="true" className="h-[2px] bg-[var(--color-ink-black,#000)]" />

      {/* Row 2 — 40px cream strip: hamburger · centred nav · basket.
          Nav links hide under 380px; hamburger + basket always visible. */}
      <div className="relative bg-card" style={{ height: 40 }}>
        <div className="mx-auto max-w-7xl h-full px-3 md:px-6 flex items-center gap-2">
          <button
            ref={toggleRef}
            onClick={() => setOpen((o) => !o)}
            className="shrink-0 p-2 -ml-1 rounded-md hover:bg-muted text-foreground/80"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-haspopup="menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Centred primary nav — visible on all viewports, compressed on mobile. */}
          <nav
            aria-label="Primary"
            className="flex flex-1 min-w-0 items-center justify-center gap-3 md:gap-6 text-[0.6875rem] tracking-[0.06em] md:text-[0.8125rem] md:tracking-[0.12em] font-bold uppercase"
            style={{ color: "var(--color-ink-blue, #123)" }}
          >
            <Link to="/competitions" className="hover:text-clover transition-colors whitespace-nowrap">Competitions</Link>
            <Link to="/winners" className="hover:text-clover transition-colors whitespace-nowrap">Winners</Link>
            <Link to="/how-it-works" className="hover:text-clover transition-colors whitespace-nowrap">About</Link>
            <Link to="/past-draws" className="hover:text-clover transition-colors whitespace-nowrap">Verify</Link>
          </nav>

          <Link
            to="/checkout"
            search={basketSlug ? { slug: basketSlug } : undefined}
            aria-label={basketCount > 0 ? `Basket, ${basketCount} ticket${basketCount === 1 ? "" : "s"}` : "Basket, empty"}
            className={
              "relative inline-flex items-center justify-center h-8 w-8 -mr-1 rounded-full border transition-colors shrink-0 " +
              (basketCount > 0
                ? "border-clover text-clover hover:bg-clover hover:text-primary-foreground"
                : "border-border text-foreground/70 hover:border-clover hover:text-clover")
            }
          >
            <ShoppingBag className="h-4 w-4" />
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

        {/* Double-rule bottom border — 2px clover + 1px paper-edge hairline 3px beneath. */}
        <div aria-hidden="true" className="absolute left-0 right-0 bottom-0 pointer-events-none">
          <div className="h-[2px] bg-clover" />
          <div className="h-px bg-[var(--color-paper-edge)] mt-[3px]" />
        </div>
      </div>

      {/* Spacer for the double rule so it doesn't sit under the next section. */}
      <div aria-hidden="true" className="h-[6px] bg-card" />

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