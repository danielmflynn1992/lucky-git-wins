import { Link } from "@tanstack/react-router";
import { Menu, Ticket, User } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";

const links = [
  { to: "/", label: "Home" },
  { to: "/competitions", label: "Live Comps" },
  { to: "/winners", label: "Winners" },
  { to: "/live-draws", label: "Live Draws" },
  { to: "/how-it-works", label: "How it works" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b-2 border-white/10 bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-semibold text-foreground/80 hover:text-clover rounded-lg hover:bg-clover/5"
              activeProps={{ className: "text-clover bg-clover/10" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/account"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-clover/5"
          >
            <User className="h-4 w-4" /> Account
          </Link>
          <Link
            to="/checkout"
            className="relative inline-flex items-center gap-1.5 rounded-xl bg-gold text-gold-foreground px-3 py-2 text-sm font-bold shadow-[0_3px_0_rgba(0,0,0,0.15)] hover:brightness-105"
          >
            <Ticket className="h-4 w-4" /> Tickets
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-clover/5"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-white/10 bg-background px-4 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="px-3 py-3 text-base font-semibold rounded-lg hover:bg-clover/10"
            >
              {l.label}
            </Link>
          ))}
          <Link to="/account" onClick={() => setOpen(false)} className="px-3 py-3 text-base font-semibold rounded-lg hover:bg-clover/10">Account</Link>
        </nav>
      )}
    </header>
  );
}