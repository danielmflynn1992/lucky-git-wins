import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Lucky Git Comps" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Sign in or create your Lucky Git Comps account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [town, setTown] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect || "/account", replace: true });
    });
  }, [redirect, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (mode === "signup") {
      if (!dob) {
        setErr("Date of birth is required.");
        return;
      }
      const birth = new Date(dob);
      if (Number.isNaN(birth.getTime())) {
        setErr("Invalid date of birth.");
        return;
      }
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 18) {
        setErr("You must be 18 or over to create an account.");
        return;
      }
      if (!displayName.trim()) {
        setErr("Add the name you'd like shown if you win, e.g. Dave R.");
        return;
      }
    }
    setBusy(true);
    try {
      const fn = mode === "signin" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const { error } = await fn.call(supabase.auth, {
        email,
        password,
        ...(mode === "signup"
          ? {
              options: {
                emailRedirectTo: window.location.origin,
                data: { date_of_birth: dob, display_name: displayName.trim(), town: town.trim() },
              },
            }
          : {}),
      } as any);
      if (error) throw error;
      if (mode === "signup" && dob) {
        // Write to profiles for the DB-level age gate. Best-effort — the
        // trigger on auth.users may also mirror it.
        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user.id;
        if (uid) {
          await supabase.from("profiles").upsert({
            user_id: uid,
            date_of_birth: dob,
            display_name: displayName.trim(),
            town: town.trim(),
          });
        }
      }
      navigate({ to: redirect || "/account", replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-md w-full px-4 py-16 flex-1">
        <div className="text-xs font-mono uppercase tracking-widest text-clover">
          {mode === "signin" ? "Sign in" : "Create account"}
        </div>
        <h1 className="mt-2 font-display text-3xl font-black">
          {mode === "signin" ? "Welcome back" : "Join Lucky Git Comps"}
        </h1>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Email</div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-surface border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Password</div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-surface border border-border px-3 py-2 text-sm"
            />
          </label>
          {mode === "signup" && (
            <label className="block">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Date of birth · you must be 18+
              </div>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-md bg-surface border border-border px-3 py-2 text-sm font-mono"
              />
            </label>
          )}
          {mode === "signup" && (
            <>
              <label className="block">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Winner display name · first name + last initial
                </div>
                <input
                  type="text"
                  required
                  maxLength={40}
                  placeholder="Dave R."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-md bg-surface border border-border px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                  Town (optional)
                </div>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="Romford"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  className="w-full rounded-md bg-surface border border-border px-3 py-2 text-sm"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                If you win we publish this name and town only — never your email address.
              </p>
            </>
          )}
          {err && <div className="text-sm text-signal">{err}</div>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <p className="mt-6 text-xs text-muted-foreground">
          <Link to="/" className="underline">Back to home</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}