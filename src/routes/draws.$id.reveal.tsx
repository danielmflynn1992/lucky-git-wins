import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2, Shield, Share2, XCircle } from "lucide-react";

type DrawRec = {
  id: string;
  competition_id: string | null;
  competition_title: string;
  prize: string;
  winning_number: number;
  winner_display_name: string;
  total_tickets: number;
  total_sold: number | null;
  qualifying_pool_size: number | null;
  drew_from: string | null;
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
      "id, competition_id, competition_title, prize, winning_number, winner_display_name, total_tickets, total_sold, qualifying_pool_size, drew_from, drawn_at, seed_hash, seed_revealed",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  return data as DrawRec;
}

/** The exact list the server drew from, in the exact order it used (ticket number ascending). */
async function fetchEntries(competitionId: string, qualifyingOnly: boolean): Promise<number[]> {
  let q = supabase
    .from("tickets")
    .select("number")
    .eq("competition_id", competitionId)
    .eq("status", "sold");
  if (qualifyingOnly) q = q.eq("is_qualifying", true);
  const { data, error } = await q.order("number", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => t.number as number);
}

async function fetchWinnerOwner(competitionId: string, number: number): Promise<string | null> {
  const { data } = await supabase
    .from("tickets")
    .select("owner_id")
    .eq("competition_id", competitionId)
    .eq("number", number)
    .maybeSingle();
  return (data?.owner_id as string | null) ?? null;
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
    <div className="min-h-screen flex flex-col bg-ink text-cream">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 flex-1">
        <h1 className="font-display text-3xl font-black">Draw not found</h1>
        <p className="text-cream/70 mt-2">{error.message}</p>
      </main>
      <SiteFooter />
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col bg-ink text-cream">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 flex-1">
        <h1 className="font-display text-3xl font-black">Draw not found</h1>
        <p className="text-cream/70 mt-2">
          That draw ID doesn't exist.{" "}
          <Link to="/past-draws" className="text-gold underline">
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
  const { user } = useAuth();

  const qualifyingOnly = draw.drew_from !== "all_sold_fallback";

  // Steps: 0 commit, 1 reveal seed, 2 re-hash, 3 derive position, 4 map to ticket, 5 winner
  const [step, setStep] = useState(0);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [hashMatches, setHashMatches] = useState<boolean | null>(null);
  const [pickIndex, setPickIndex] = useState<number | null>(null);
  const [derivHash, setDerivHash] = useState<string | null>(null);
  const [entries, setEntries] = useState<number[] | null>(null);
  const [entriesHash, setEntriesHash] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Load the entries list the draw ran over, plus the winning ticket's holder.
  useEffect(() => {
    if (!draw.competition_id) return;
    let cancelled = false;
    void (async () => {
      const list = await fetchEntries(draw.competition_id!, qualifyingOnly);
      if (cancelled) return;
      setEntries(list);
      setEntriesHash(await sha256Hex(list.join(",")));
      const owner = await fetchWinnerOwner(draw.competition_id!, draw.winning_number);
      if (!cancelled) setOwnerId(owner);
    })();
    return () => {
      cancelled = true;
    };
  }, [draw.competition_id, draw.winning_number, qualifyingOnly]);

  useEffect(() => {
    if (!revealed) return;
    let cancelled = false;
    const run = async () => {
      await wait(900);
      if (cancelled) return;
      setStep(1);

      await wait(700);
      if (cancelled) return;
      const h = await sha256Hex(draw.seed_revealed);
      setComputedHash(h);
      setHashMatches(h.toLowerCase() === (draw.seed_hash || "").toLowerCase());
      setStep(2);

      await wait(900);
      if (cancelled) return;
      if (draw.competition_id) {
        const dh = await sha256Hex(`draw:${draw.competition_id}:${draw.seed_revealed}`);
        setDerivHash(dh);
        const int32 = parseInt(dh.slice(0, 8), 16);
        const pool = poolSize(draw);
        setPickIndex(int32 % Math.max(1, pool));
      }
      setStep(3);

      await wait(900);
      if (cancelled) return;
      setStep(4);

      await wait(1000);
      if (cancelled) return;
      setStep(5);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [revealed, draw]);

  const pool = poolSize(draw);
  const mappedTicket =
    pickIndex !== null && entries && entries.length > pickIndex ? entries[pickIndex]! : null;
  const mappingAgrees = mappedTicket !== null && mappedTicket === draw.winning_number;
  const isWinner = Boolean(user && ownerId && user.id === ownerId);

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
        // fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="grain relative min-h-screen flex flex-col bg-ink text-cream">
      <SiteNav />
      <main className="flex-1 w-full">
        <section className="mx-auto max-w-4xl px-4 pt-14 pb-6">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold font-bold">
            Provably-fair reveal
          </div>
          <h1 className="mt-3 font-display text-4xl md:text-5xl font-black tracking-[-0.03em] text-cream">
            {draw.competition_title}
          </h1>
          <p className="mt-2 text-cream/85">{draw.prize}</p>
        </section>

        <section className="mx-auto max-w-4xl px-4 space-y-4 pb-8">
          <RevealStep n="01" title="Commit — published before tickets closed" active>
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
              <p className="text-cream/85 text-sm">
                Seed is still sealed. It will be revealed the moment the timer hits zero.
              </p>
            )}
          </RevealStep>

          <RevealStep n="03" title="Re-hash — recompute in your browser" active={step >= 2}>
            <Mono label="SHA-256 of revealed seed">{computedHash ?? "computing…"}</Mono>
            {hashMatches !== null && (
              <VerdictPill matches={hashMatches}>
                {hashMatches
                  ? "Match — the seed committed before tickets closed is the same seed used for the draw."
                  : "Mismatch — please report this immediately."}
              </VerdictPill>
            )}
          </RevealStep>

          <RevealStep n="04" title="The entries list — what the draw ran over" active={step >= 2}>
            <div className="grid gap-2 text-sm">
              <Leader
                label={qualifyingOnly ? "Qualifying entries (correct answer)" : "Entries in the pool"}
                value={`${pool.toLocaleString()} of ${draw.total_tickets.toLocaleString()} tickets`}
              />
              <Leader label="Sold tickets" value={(draw.total_sold ?? 0).toLocaleString()} />
              <Leader
                label="Pool rule applied"
                value={qualifyingOnly ? "Correct entries only" : "All sold tickets (question void)"}
              />
            </div>
            {!qualifyingOnly && (
              <p className="mt-3 text-xs text-cream/85 leading-relaxed">
                Nobody answered this competition's skill question correctly, so under the published
                terms the question was treated as void and the draw ran across every sold ticket
                instead. That fallback is spelled out in the T&amp;Cs and the FAQ.
              </p>
            )}
            <div className="mt-3">
              <Mono label="SHA-256 of the entries list (ticket numbers, ascending, comma-separated)">
                {entriesHash ?? "computing…"}
              </Mono>
            </div>
            {entries && (
              <div className="mt-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/70">
                  Entries list (positions are zero-indexed)
                </div>
                <div className="mt-1 font-mono text-[11px] leading-relaxed text-cream/85 break-all max-h-32 overflow-y-auto rounded border border-cream/15 p-2">
                  {entries.join(", ")}
                </div>
              </div>
            )}
          </RevealStep>

          <RevealStep n="05" title="Derive — deterministic winner selection" active={step >= 3}>
            <Mono label={`SHA-256("draw:${short(draw.competition_id ?? "")}:seed")`}>
              {derivHash ?? "computing…"}
            </Mono>
            {pickIndex !== null && (
              <div className="mt-3 grid gap-2 text-xs font-mono text-cream/85">
                <div>
                  1. first 8 hex characters → <span className="text-gold">{derivHash?.slice(0, 8)}</span>
                </div>
                <div>
                  2. read as a 32-bit integer →{" "}
                  <span className="text-gold">
                    {parseInt(derivHash?.slice(0, 8) ?? "0", 16).toLocaleString()}
                  </span>
                </div>
                <div>
                  3. mod {pool.toLocaleString()} (entries in the pool) → position{" "}
                  <span className="text-gold">{pickIndex}</span>
                </div>
                <div>
                  4. take the entry at position {pickIndex} of the list above (zero-indexed, so it is
                  the {ordinal(pickIndex + 1)} entry) → ticket{" "}
                  <span className="text-gold">
                    #{mappedTicket === null ? "…" : String(mappedTicket).padStart(3, "0")}
                  </span>
                </div>
              </div>
            )}
            {mappedTicket !== null && (
              <VerdictPill matches={mappingAgrees}>
                {mappingAgrees
                  ? `Position ${pickIndex} of ${pool.toLocaleString()} entries is ticket #${String(draw.winning_number).padStart(3, "0")} — exactly the ticket published as the winner.`
                  : "The published winner does not match the entries list we can read now. Please report this."}
              </VerdictPill>
            )}
          </RevealStep>

          <RevealStep n="06" title="Winner" active={step >= 5} emphasis>
            <div className="flex flex-col items-center py-6">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cream/70">
                Winning ticket
              </div>
              <div
                className={
                  "mt-2 font-mono font-black tabular-nums leading-none text-gold transition-all duration-700 " +
                  (step >= 5
                    ? "text-[clamp(4rem,18vw,10rem)]"
                    : "text-[clamp(2rem,8vw,4rem)] opacity-40")
                }
              >
                #{String(draw.winning_number).padStart(3, "0")}
              </div>
              <div className="mt-4 text-cream/85 text-center">
                <span className="font-display font-bold text-cream">
                  WINNER: TICKET #{String(draw.winning_number).padStart(3, "0")}
                </span>
                {draw.winner_display_name && (
                  <span className="text-cream/70"> — {draw.winner_display_name}</span>
                )}
                <div className="text-cream/70 text-sm mt-1">
                  drawn from {pool.toLocaleString()} entries
                </div>
              </div>

              {step >= 5 && isWinner && (
                <div className="mt-6">
                  <span className="lucky-git-stamp lucky-git-stamp--lg">You Lucky Git.</span>
                </div>
              )}

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

          <p className="text-xs font-mono text-cream/70 text-center pt-4">
            Draw ID <span className="text-cream">{draw.id}</span> · drawn{" "}
            {new Date(draw.drawn_at).toLocaleString("en-GB")}
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function poolSize(draw: DrawRec) {
  return draw.drew_from === "all_sold_fallback"
    ? (draw.total_sold ?? draw.qualifying_pool_size ?? 0)
    : (draw.qualifying_pool_size ?? 0);
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function Leader({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-cream/85">{label}</span>
      <span className="flex-1 border-b border-dotted border-cream/25 translate-y-[-3px]" />
      <span className="font-mono tabular-nums text-cream">{value}</span>
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
        (emphasis ? "border-gold/40 bg-gold/5" : "border-cream/15 bg-cream/[0.04]") +
        " " +
        (active ? "opacity-100 translate-y-0" : "opacity-60 translate-y-1") +
        (pending ? " border-dashed" : "")
      }
    >
      <div className="flex items-center gap-3">
        <div className="font-mono text-[11px] tracking-[0.25em] text-gold font-bold">STEP {n}</div>
        <div className="h-px flex-1 bg-cream/15" />
      </div>
      <div className="mt-2 font-display text-lg font-black text-cream">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Mono({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/70">{label}</div>
      <div className="mt-1 font-mono text-xs md:text-sm break-all text-cream">{children}</div>
    </div>
  );
}

function VerdictPill({ matches, children }: { matches: boolean; children: React.ReactNode }) {
  return (
    <div
      className={
        "mt-3 rounded-md p-3 flex items-start gap-2 text-sm font-semibold border " +
        (matches
          ? "border-cream/40 bg-cream/5 text-cream"
          : "border-urgent/60 bg-urgent/15 text-cream")
      }
    >
      {matches ? (
        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-clover" />
      ) : (
        <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-urgent" />
      )}
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
