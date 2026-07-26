import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertTriangle, Ticket, Loader2, Mail } from "lucide-react";

const searchSchema = z.object({
  slug: z.string().optional(),
});

export const Route = createFileRoute("/free-entry")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Free entry — Lucky Git Comps" },
      {
        name: "description",
        content:
          "Enter any live Lucky Git Comps competition for free. Equal chance, same ticket pool, one entry per person per competition. No purchase necessary.",
      },
      { property: "og:title", content: "Free entry — Lucky Git Comps" },
      { property: "og:description", content: "No purchase necessary. Equal chance, same pool." },
    ],
  }),
  component: FreeEntry,
});

type Comp = { slug: string; title: string };

function FreeEntry() {
  const { slug: initialSlug } = Route.useSearch();
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [comps, setComps] = useState<Comp[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignedNumber, setAssignedNumber] = useState<number | null>(null);

  // Load live comps for the dropdown.
  if (comps === null && !loading) {
    setLoading(true);
    supabase
      .from("competitions")
      .select("slug, title")
      .eq("status", "live")
      .gt("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: true })
      .then(({ data }) => {
        setComps((data as Comp[]) ?? []);
        setLoading(false);
      });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slug) return setError("Pick a competition.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Enter a valid email.");
    if (!agree) return setError("Confirm the eligibility checkbox.");
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("submit_free_entry", {
        p_slug: slug,
        p_email: email,
        p_ip: undefined,
        p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : undefined,
      });
      if (error) throw error;
      setAssignedNumber(data as number);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Something went wrong.";
      setError(cleanError(raw));
    } finally {
      setLoading(false);
    }
  }

  if (assignedNumber !== null) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteNav />
        <main className="mx-auto max-w-xl px-4 py-16 w-full flex-1 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-clover/15 text-clover">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-3xl md:text-4xl font-black tracking-tight">
            You're in the draw — free of charge.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your free entry has been recorded and you've been assigned a real ticket in the same pool as paid entries, with identical odds.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-card border-2 border-border px-6 py-4">
            <Ticket className="h-5 w-5 text-clover" />
            <div className="text-left">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Your ticket</div>
              <div className="font-mono font-black text-2xl tabular-nums">
                #{assignedNumber.toString().padStart(4, "0")}
              </div>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            We'll email <b>{email}</b> when the draw runs. If you win, we'll be in touch on that address.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button asChild variant="gold" size="lg"><Link to="/competitions">See other comps</Link></Button>
            <Button asChild variant="cream" size="lg"><Link to="/legal-structure">How this works legally</Link></Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-10 md:py-16 w-full flex-1">
        <div className="text-xs font-bold uppercase tracking-widest text-clover">No purchase necessary</div>
        <h1 className="mt-1 font-display text-4xl md:text-5xl font-black tracking-tight">Free entry route</h1>
        <p className="mt-3 text-foreground/80 text-lg">
          Every Lucky Git Comps competition is open to a genuinely free entry route with <b>equal chance of winning</b>. Same ticket pool. Same odds. No purchase, no catch.
        </p>

        <div className="mt-6 rounded-2xl border-2 border-clover/40 bg-clover/5 p-4 text-sm text-foreground/80">
          <div className="font-bold text-clover flex items-center gap-2"><Mail className="h-4 w-4" /> How it works</div>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>One free entry per person, per competition.</li>
            <li>You're assigned a real random ticket in the same pool as paid entrants.</li>
            <li>If your ticket is drawn, you win — no different treatment, no lesser prize.</li>
            <li>We'll only email you about this specific competition's result.</li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="mt-6 rounded-2xl bg-card border-2 border-border p-5 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Competition</span>
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="mt-1 w-full h-11 rounded-xl border-2 border-border bg-background px-3 font-semibold focus:outline-none focus:border-clover"
            >
              <option value="">— Pick a live competition —</option>
              {(comps ?? []).map((c) => (
                <option key={c.slug} value={c.slug}>{c.title}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@somewhere.co.uk"
              className="mt-1 w-full h-11 rounded-xl border-2 border-border bg-background px-3 font-semibold focus:outline-none focus:border-clover"
            />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-clover" />
            <span>I'm 18+, resident in the UK, and this is my only free entry for this competition. I've read the <Link to="/terms" className="underline">T&Cs</Link>.</span>
          </label>

          {error && (
            <div className="rounded-lg border-2 border-hot/40 bg-hot/10 p-3 text-sm text-hot flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" variant="gold" size="xl" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit free entry"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Rate-limited to prevent abuse. See <Link to="/legal-structure" className="underline">how our legal structure works</Link>.
          </p>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function cleanError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes("already entered")) return "You've already entered this competition for free. One free entry per person, per competition.";
  if (msg.includes("rate limit")) return "You've hit the free-entry rate limit. Please try again later.";
  if (msg.includes("competition not open") || msg.includes("not found")) return "That competition isn't open for entries right now.";
  if (msg.includes("free entry disabled")) return "Free entry is not currently enabled for this competition.";
  if (msg.includes("no tickets available")) return "That competition has sold out.";
  if (msg.includes("invalid email")) return "Enter a valid email address.";
  return raw.replace(/^.*?:\s*/, "");
}