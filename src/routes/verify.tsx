import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, Shield } from "lucide-react";

const searchSchema = z.object({ draw: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/verify")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Verify a draw — Lucky Git Comps" },
      { name: "description", content: "How our provably-fair hash-then-reveal draw system works, and how to verify any draw yourself in your browser." },
      { property: "og:title", content: "Verify a draw — Lucky Git Comps" },
      { property: "og:description", content: "Hash-then-reveal, verifiable in your browser. No trust required." },
    ],
  }),
  component: VerifyPage,
});

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function VerifyPage() {
  const { draw } = useSearch({ from: "/verify" });

  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="flex-1 w-full">
        <section className="mx-auto max-w-4xl px-4 pt-16 pb-8">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover font-bold">Provably fair</div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl font-black tracking-[-0.03em]">Verify any draw.</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            No presenter, no delay, no room for a stitch-up — just maths. Check it yourself, don't take our word for it.
          </p>
        </section>

        {/* EXPLAINER */}
        <section className="mx-auto max-w-4xl px-4 grid gap-4 md:grid-cols-3">
          {[
            { n: "01", t: "We commit", b: "When a competition goes live we generate a random seed. We publish its SHA-256 hash immediately — the seed itself stays sealed on our server." },
            { n: "02", t: "Tickets close", b: "The hash was public before tickets closed. We can't change the seed after the fact without changing the hash — and everyone would see." },
            { n: "03", t: "We reveal", b: "The moment the timer hits zero, the system uses the seed to pick a winner deterministically, then publishes the seed. Re-hash it and confirm it matches." },
          ].map((s) => (
            <div key={s.n} className="rounded-lg bg-card border border-border p-5 shadow-sm">
              <div className="font-mono text-[11px] tracking-[0.25em] text-clover font-bold">STEP {s.n}</div>
              <div className="mt-2 font-display text-lg font-black">{s.t}</div>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.b}</p>
            </div>
          ))}
        </section>

        {/* CHECKER */}
        <section className="mx-auto max-w-4xl px-4 mt-14 mb-24">
          <div className="rounded-lg bg-card border border-border p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-clover">
              <Shield className="h-4 w-4" />
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] font-bold">Live check</div>
            </div>
            <h2 className="mt-2 font-display text-2xl font-black">Verify a specific draw</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We load the draw record, re-hash the revealed seed in your browser, and compare against the hash published before tickets closed. All done client-side — you can inspect the network tab if you're the paranoid type.
            </p>

            <VerifyChecker initialDrawId={draw} />
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Or head back to <Link to="/past-draws" className="text-clover font-semibold hover:underline">every past draw</Link>.
          </p>
          <p className="mt-3 text-center font-display uppercase tracking-[0.14em] text-sm text-foreground">
            Still suspicious? Good. That's what it's for.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

type DrawRec = {
  id: string;
  competition_title: string;
  winning_number: number;
  drawn_at: string;
  seed_hash: string;
  seed_revealed: string;
};

function VerifyChecker({ initialDrawId }: { initialDrawId: string }) {
  const [drawId, setDrawId] = useState(initialDrawId);
  const [computed, setComputed] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);

  const { data: draw, isFetching, error } = useQuery({
    queryKey: ["draw", drawId],
    enabled: !!drawId,
    queryFn: async (): Promise<DrawRec | null> => {
      const { data, error } = await supabase
        .from("draws")
        .select("id, competition_title, winning_number, drawn_at, seed_hash, seed_revealed")
        .eq("id", drawId)
        .maybeSingle();
      if (error) throw error;
      return data as DrawRec | null;
    },
  });

  useEffect(() => {
    setComputed(null);
    if (!draw?.seed_revealed) return;
    setComputing(true);
    sha256Hex(draw.seed_revealed).then((h) => {
      setComputed(h);
      setComputing(false);
    });
  }, [draw?.seed_revealed]);

  const matches = computed && draw?.seed_hash && computed.toLowerCase() === draw.seed_hash.toLowerCase();

  return (
    <div className="mt-5 space-y-4">
      <div className="flex gap-2">
        <input
          value={drawId}
          onChange={(e) => setDrawId(e.target.value)}
          placeholder="Paste a draw ID"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:border-clover"
        />
      </div>

      {isFetching && (
        <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading draw…
        </div>
      )}
      {error && <div className="text-sm text-urgent">Couldn't load that draw.</div>}

      {draw && (
        <div className="rounded-md bg-muted/60 border border-border p-4 space-y-3">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div className="font-display font-bold">{draw.competition_title}</div>
            <div className="text-xs font-mono text-muted-foreground">Winning #{draw.winning_number}</div>
          </div>
          <Row label="Published hash (pre-close)" value={draw.seed_hash || "—"} />
          <Row label="Revealed seed (post-draw)" value={draw.seed_revealed || "(not yet revealed)"} />
          <Row label="SHA-256 of revealed seed" value={computing ? "computing…" : (computed ?? "—")} />

          {draw.seed_revealed && computed && (
            <div
              className={
                "rounded-md p-3 flex items-center gap-2 text-sm font-semibold " +
                (matches ? "bg-clover/10 text-clover border border-clover/40" : "bg-urgent/10 text-urgent border border-urgent/40")
              }
            >
              {matches ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {matches
                ? "Hashes match — this draw's seed was genuinely committed before tickets closed."
                : "Hashes DO NOT match. That would be a big problem. Please report this."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-xs break-all text-foreground/85">{value}</div>
    </div>
  );
}