import { Link } from "@tanstack/react-router";
import { Menu, Ticket, User } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/", label: "Home" },
  { to: "/competitions", label: "Live Comps" },
  { to: "/winners", label: "Winners" },
  { to: "/past-draws", label: "Past draws" },
  { to: "/how-it-works", label: "How it works" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const { session, loading } = useAuth();
  const signedIn = !!session;
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground rounded-md transition-colors"
              activeProps={{ className: "text-clover" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <>
              <Link
                to="/account"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" /> Account
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="hidden sm:inline-flex px-3 py-2 rounded-md text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            !loading && (
              <Link
                to="/auth"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" /> Sign in
              </Link>
            )
          )}
          <Link
            to="/checkout"
            className="relative inline-flex items-center gap-1.5 rounded-md bg-clover text-primary-foreground px-3.5 py-2 text-sm font-semibold hover:bg-clover-deep transition-colors"
          >
            <Ticket className="h-4 w-4" /> Tickets
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 rounded-md hover:bg-white/5 text-foreground/80"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="px-3 py-3 text-sm font-medium rounded-md hover:bg-white/5 text-foreground/80"
            >
              {l.label}
            </Link>
          ))}
          {signedIn ? (
            <>
              <Link to="/account" onClick={() => setOpen(false)} className="px-3 py-3 text-sm font-medium rounded-md hover:bg-white/5 text-foreground/80">Account</Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setOpen(false);
                }}
                className="text-left px-3 py-3 text-sm font-medium rounded-md hover:bg-white/5 text-foreground/80"
              >
                Sign out
              </button>
            </>
          ) : (
            !loading && (
              <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-3 text-sm font-medium rounded-md hover:bg-white/5 text-foreground/80">Sign in</Link>
            )
          )}
        </nav>
      )}
    </header>
  );
}