import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Shield, Share2, XCircle } from "lucide-react";

type DrawRec = {
  id: string;
  competition_id: string | null;
  competition_title: string;
  prize: string;
  winning_number: number;
  winner_display_name: string;
  total_tickets: number;
  drawn_at: string;
  seed_hash: string;
  seed_revealed: string;
};

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchDraw(id: string): Promise<DrawRec> {
  const { data, error } = await supabase
    .from("draws")
    .select(
      "id, competition_id, competition_title, prize, winning_number, winner_display_name, total_tickets, drawn_at, seed_hash, seed_revealed",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  return data as DrawRec;
}

export const Route = createFileRoute("/draws/$id/reveal")({
  loader: ({ params }) => fetchDraw(params.id),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Draw reveal — Lucky Git Comps" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `Winner #${loaderData.winning_number} — ${loaderData.competition_title}`;
    const desc = `Provably-fair draw for ${loaderData.prize}. Verify the maths yourself.`;
    return {
      meta: [
        { title: `${title} — Lucky Git Comps` },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: RevealPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 flex-1 text-cream">
        <h1 className="font-display text-3xl font-black">Draw not found</h1>
        <p className="text-muted-foreground mt-2">{error.message}</p>
      </main>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 flex-1">
        <h1 className="font-display text-3xl font-black">Draw not found</h1>
        <p className="text-muted-foreground mt-2">
          That draw ID doesn't exist.{" "}
          <Link to="/past-draws" className="text-clover underline">
            See every past draw
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  ),
});

function RevealPage() {
  const draw = Route.useLoaderData();
  const revealed = Boolean(draw.seed_revealed);

  // Steps: 0 commit, 1 reveal seed, 2 compute sha256, 3 derive index, 4 winner
  const [step, setStep] = useState(0);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [hashMatches, setHashMatches] = useState<boolean | null>(null);
  const [pickIndex, setPickIndex] = useState<number | null>(null);
  const [derivHash, setDerivHash] = useState<string | null>(null);

  useEffect(() => {
    if (!revealed) return;
    let cancelled = false;
    const run = async () => {
      // Step 1: reveal after brief hold
      await wait(900);
      if (cancelled) return;
      setStep(1);

      // Step 2: re-hash the seed and compare to commit
      await wait(700);
      if (cancelled) return;
      const h = await sha256Hex(draw.seed_revealed);
      setComputedHash(h);
      setHashMatches(h.toLowerCase() === (draw.seed_hash || "").toLowerCase());
      setStep(2);

      // Step 3: derive pick index using the same maths as the server
      await wait(900);
      if (cancelled) return;
      if (draw.competition_id) {
        const dh = await sha256Hex(
          `draw:${draw.competition_id}:${draw.seed_revealed}`,
        );
        setDerivHash(dh);
        const first8 = dh.slice(0, 8);
        const int32 = parseInt(first8, 16);
        const idx = int32 % Math.max(1, draw.total_tickets);
        setPickIndex(idx);
      }
      setStep(3);

      // Step 4: reveal the winning number
      await wait(1100);
      if (cancelled) return;
      setStep(4);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [revealed, draw.seed_revealed, draw.competition_id, draw.seed_hash, draw.total_tickets]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/draws/${draw.id}/reveal`;
  }, [draw.id]);

  const share = async () => {
    const text = `${draw.competition_title} — winning ticket #${draw.winning_number}. Verify the maths yourself.`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: "Lucky Git Comps draw",
          text,
          url: shareUrl,
        });
        return;
      } catch {
        // fall through
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink text-cream">
      <SiteNav />
      <main className="flex-1 w-full">
        <section className="mx-auto max-w-4xl px-4 pt-14 pb-6">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold font-bold">
            Provably-fair reveal
          </div>
          <h1 className="mt-3 font-display text-4xl md:text-5xl font-black tracking-[-0.03em]">
            {draw.competition_title}
          </h1>
          <p className="mt-2 text-cream/70">🏆 {draw.prize}</p>
        </section>

        <section className="mx-auto max-w-4xl px-4 space-y-4 pb-8">
          <RevealStep
            n="01"
            title="Commit — published before tickets closed"
            active
          >
            <Mono label="SHA-256 commit hash">{draw.seed_hash || "(missing)"}</Mono>
          </RevealStep>

          <RevealStep
            n="02"
            title="Reveal — seed unsealed at draw time"
            active={step >= 1 || !revealed}
            pending={!revealed}
          >
            {revealed ? (
              <Mono label="Revealed seed">{draw.seed_revealed}</Mono>
            ) : (
              <p className="text-cream/60 text-sm">
                Seed is still sealed. It will be revealed the moment the timer hits zero.
              </p>
            )}
          </RevealStep>

          <RevealStep
            n="03"
            title="Re-hash — recompute in your browser"
            active={step >= 2}
          >
            <Mono label="SHA-256 of revealed seed">
              {computedHash ?? "computing…"}
            </Mono>
            {hashMatches !== null && (
              <VerdictPill matches={hashMatches}>
                {hashMatches
                  ? "Match — the seed committed before tickets closed is the same seed used for the draw."
                  : "Mismatch — please report this immediately."}
              </VerdictPill>
            )}
          </RevealStep>

          <RevealStep
            n="04"
            title="Derive — deterministic winner selection"
            active={step >= 3}
          >
            <Mono label={`SHA-256("draw:${short(draw.competition_id ?? "")}:seed")`}>
              {derivHash ?? "computing…"}
            </Mono>
            {pickIndex !== null && (
              <div className="mt-3 grid gap-2 text-xs font-mono text-cream/70">
                <div>
                  first 8 hex → <span className="text-gold">{derivHash?.slice(0, 8)}</span>
                </div>
                <div>
                  as int32 → <span className="text-gold">{parseInt(derivHash?.slice(0, 8) ?? "0", 16)}</span>
                </div>
                <div>
                  mod {draw.total_tickets.toLocaleString()} = position{" "}
                  <span className="text-gold">{pickIndex}</span>
                </div>
              </div>
            )}
          </RevealStep>

          <RevealStep
            n="05"
            title="Winner"
            active={step >= 4}
            emphasis
          >
            <div className="flex flex-col items-center py-6">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cream/60">
                Winning ticket
              </div>
              <div
                className={
                  "mt-2 font-mono font-black tabular-nums leading-none text-gold transition-all duration-700 " +
                  (step >= 4 ? "text-[clamp(4rem,18vw,10rem)]" : "text-[clamp(2rem,8vw,4rem)] opacity-40")
                }
              >
                #{String(draw.winning_number).padStart(3, "0")}
              </div>
              <div className="mt-4 text-cream/80">
                <span className="font-display font-bold">{draw.winner_display_name}</span>
                <span className="text-cream/50"> — of {draw.total_tickets.toLocaleString()} tickets</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button variant="gold" size="lg" onClick={share}>
                  <Share2 className="h-4 w-4" /> Share this draw
                </Button>
                <Button asChild variant="git" size="lg">
                  <Link to="/verify" search={{ draw: draw.id }}>
                    <Shield className="h-4 w-4" /> Verify independently
                  </Link>
                </Button>
              </div>
            </div>
          </RevealStep>

          <p className="text-xs font-mono text-cream/50 text-center pt-4">
            Draw ID <span className="text-cream/70">{draw.id}</span> · drawn{" "}
            {new Date(draw.drawn_at).toLocaleString("en-GB")}
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function RevealStep({
  n,
  title,
  children,
  active,
  pending,
  emphasis,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  pending?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-5 transition-all duration-500 " +
        (emphasis
          ? "border-gold/40 bg-gold/5"
          : "border-cream/10 bg-cream/[0.03]") +
        " " +
        (active ? "opacity-100 translate-y-0" : "opacity-40 translate-y-1") +
        (pending ? " border-dashed" : "")
      }
    >
      <div className="flex items-center gap-3">
        <div className="font-mono text-[11px] tracking-[0.25em] text-gold font-bold">
          STEP {n}
        </div>
        <div className="h-px flex-1 bg-cream/10" />
      </div>
      <div className="mt-2 font-display text-lg font-black">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Mono({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/50">
        {label}
      </div>
      <div className="mt-1 font-mono text-xs md:text-sm break-all text-cream/90">
        {children}
      </div>
    </div>
  );
}

function VerdictPill({ matches, children }: { matches: boolean; children: React.ReactNode }) {
  return (
    <div
      className={
        "mt-3 rounded-md p-3 flex items-start gap-2 text-sm font-semibold " +
        (matches
          ? "bg-clover/15 text-clover-foreground border border-clover/40 text-clover"
          : "bg-hot/15 border border-hot/40 text-hot")
      }
    >
      {matches ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <XCircle className="h-4 w-4 mt-0.5" />}
      <span>{children}</span>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function short(id: string) {
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}