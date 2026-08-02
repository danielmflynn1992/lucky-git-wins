import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { verifyDraw } from "@/lib/verify.functions";
import type { ServerVerification } from "@/lib/verify.server";

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
  drew_from: string;
  drawn_at: string;
  seed_hash: string;
  seed_revealed: string;
};

async function sha256Bytes(text: string): Promise<Uint8Array> {
  const buf = new TextEncoder().encode(text);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
}
const hex = (bytes: Uint8Array) =>
  Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");

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

export const Route = createFileRoute("/draws/$id/verify")({
  loader: ({ params }) => fetchDraw(params.id),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Verify draw — Lucky Git Comps" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `Verify draw #${loaderData.winning_number} — ${loaderData.competition_title}`;
    const desc = `Re-hash the sealed seed for ${loaderData.competition_title} in your own browser and check it against the hash we published before tickets closed.`;
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
  component: VerifyDrawPage,
  errorComponent: () => <Shell><Msg title="Couldn't load that draw." body="Either the link's wrong or our end fell over. Try the past draws log." /></Shell>,
  notFoundComponent: () => <Shell><Msg title="No such draw." body="That draw ID doesn't exist. Have a look at the past draws log." /></Shell>,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 w-full flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function Msg({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center">
      <h1 className="font-display text-3xl font-black uppercase tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
      <Button asChild variant="gold" size="lg" className="mt-6">
        <Link to="/past-draws">Every past draw</Link>
      </Button>
    </div>
  );
}

function VerifyDrawPage() {
  const d = Route.useLoaderData();
  const [computed, setComputed] = useState<string | null>(null);
  const [pick, setPick] = useState<{ digest: string; index: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [ran, setRan] = useState(false);
  const [server, setServer] = useState<ServerVerification | null>(null);
  const [serverErr, setServerErr] = useState(false);
  const verifyOnServer = useServerFn(verifyDraw);

  const pool =
    d.drew_from === "qualifying"
      ? (d.qualifying_pool_size ?? 0)
      : (d.total_sold ?? d.qualifying_pool_size ?? 0);

  const runCheck = async () => {
    if (!d.seed_revealed) return;
    setBusy(true);
    setServer(null);
    setServerErr(false);
    const seedDigest = hex(await sha256Bytes(d.seed_revealed));
    setComputed(seedDigest);
    if (d.competition_id && pool > 0) {
      const bytes = await sha256Bytes(`draw:${d.competition_id}:${d.seed_revealed}`);
      const n =
        ((bytes[0]! << 24) >>> 0) + (bytes[1]! << 16) + (bytes[2]! << 8) + bytes[3]!;
      setPick({ digest: hex(bytes), index: n % pool });
    }
    try {
      setServer(await verifyOnServer({ data: { drawId: d.id } }));
    } catch {
      setServerErr(true);
    }
    setBusy(false);
    setRan(true);
  };

  // Auto-run once so the answer is on screen without a click.
  useEffect(() => { void runCheck(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [d.id]);

  const revealed = !!d.seed_revealed && !!d.seed_hash;
  const pass = revealed && !!computed && computed.toLowerCase() === d.seed_hash.toLowerCase();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12 w-full flex-1">
        <div className="text-xs font-semibold text-muted-foreground mb-4">
          <Link to="/past-draws" className="hover:underline">Past draws</Link>
          <span className="mx-1.5">/</span>
          <span>Verification</span>
        </div>

        {/* Certificate */}
        <article className="border-2 border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
          <header className="bg-[var(--color-ink-red)] text-[var(--color-paper)] px-4 py-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <h1 className="font-display uppercase tracking-[0.16em] text-sm">
              Draw verification — {d.competition_title}
            </h1>
          </header>

          <div className="p-4 md:p-6">
            <div className="text-center border-b-2 border-dashed border-[var(--color-ink-black)] pb-5">
              <div className="label text-[10px] font-mono uppercase tracking-[0.25em] text-[var(--color-ink-blue)]">
                Winning number
              </div>
              <div
                className="leading-none mt-1"
                style={{ fontFamily: "'Alfa Slab One', serif", fontSize: "clamp(3.5rem, 16vw, 7rem)" }}
              >
                {String(d.winning_number).padStart(3, "0")}
              </div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {d.winner_display_name} · drawn {new Date(d.drawn_at).toLocaleString("en-GB")}
              </div>
            </div>

            {!revealed ? (
              <p className="mt-5 font-mono text-sm text-muted-foreground">
                This draw has no sealed seed on record, so there's nothing to re-hash.
                Older demo rows look like this. Every real draw from here on carries a seed.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                <Step
                  n="01"
                  title="The hash we published before tickets closed"
                  value={d.seed_hash}
                />
                <Step
                  n="02"
                  title="The seed we revealed after the draw"
                  value={d.seed_revealed}
                />
                <Step
                  n="03"
                  title="SHA-256 of that seed, computed here in your browser"
                  value={busy ? "computing…" : (computed ?? "—")}
                />

                {/* Result */}
                <div
                  className={
                    "flex items-start gap-3 border-2 p-4 " +
                    (pass
                      ? "border-[var(--color-ink-blue)] bg-[color-mix(in_srgb,var(--color-ink-blue)_10%,transparent)]"
                      : "border-[var(--color-coupon-red)] bg-[color-mix(in_srgb,var(--color-coupon-red)_10%,transparent)]")
                  }
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                  ) : pass ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-ink-blue)]" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-[var(--color-coupon-red)]" />
                  )}
                  <div>
                    <div className="font-display uppercase tracking-[0.16em] text-sm">
                      {busy ? "Checking…" : pass ? "Pass — hashes match" : ran ? "Fail — hashes do not match" : "Not checked yet"}
                    </div>
                    <p className="mt-1 font-mono text-[11px] leading-snug text-muted-foreground">
                      {pass
                        ? "The seed was sealed before tickets closed and hasn't been touched since. The winner was decided by maths, not by us."
                        : ran
                          ? "That should never happen. Screenshot this page and email us — we'll treat it as an emergency."
                          : "Hit the button below to run the check."}
                    </p>
                  </div>
                </div>

                {pick && (
                  <></>
                )}
                {/* Independent server-side re-hash */}
                <div className="border-2 border-[var(--color-ink-black)] p-4">
                  <div className="label text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-ink-blue)]">
                    Step 04 · Independent check on our server
                  </div>
                  {busy && !server && !serverErr ? (
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">Asking the server…</p>
                  ) : serverErr ? (
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                      Server check unavailable right now. The browser check above still stands — try again in a minute.
                    </p>
                  ) : server ? (
                    <>
                      <div className="mt-2 flex items-start gap-3">
                        {server.status === "pass" ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-ink-blue)]" />
                        ) : server.status === "fail" ? (
                          <XCircle className="h-5 w-5 shrink-0 text-[var(--color-coupon-red)]" />
                        ) : (
                          <ShieldCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-display uppercase tracking-[0.16em] text-sm">
                            {server.status === "pass"
                              ? "Server says pass"
                              : server.status === "fail"
                                ? "Server says fail"
                                : "Server can't verify"}
                          </div>
                          <p className="mt-1 font-mono text-[11px] leading-snug text-muted-foreground">
                            {server.reason}
                          </p>
                        </div>
                      </div>
                      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] break-all">
                        <dt className="text-muted-foreground">Server hash</dt>
                        <dd>{server.computedHash ?? "—"}</dd>
                        <dt className="text-muted-foreground">Matches browser</dt>
                        <dd>
                          {computed && server.computedHash
                            ? computed.toLowerCase() === server.computedHash.toLowerCase()
                              ? "yes"
                              : "NO — tell us immediately"
                            : "—"}
                        </dd>
                        {server.expectedIndex !== null && (
                          <>
                            <dt className="text-muted-foreground">Server index</dt>
                            <dd>{server.expectedIndex} of {server.poolSize}</dd>
                          </>
                        )}
                        <dt className="text-muted-foreground">Checked at</dt>
                        <dd>{new Date(server.checkedAt).toLocaleString("en-GB")}</dd>
                      </dl>
                      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                        Don't trust this page either — call it yourself:{" "}
                        <code>/api/public/verify-draw?drawId={d.id}</code>
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">Not checked yet.</p>
                  )}
                </div>

                {pick && (
                  <div className="border-2 border-[var(--color-ink-black)] p-4">
                    <div className="label text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-ink-blue)]">
                      How the number fell out
                    </div>
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] break-all">
                      <dt className="text-muted-foreground">Pre-image</dt>
                      <dd>draw:{d.competition_id}:{d.seed_revealed.slice(0, 12)}…</dd>
                      <dt className="text-muted-foreground">Digest</dt>
                      <dd>{pick.digest}</dd>
                      <dt className="text-muted-foreground">Pool</dt>
                      <dd>{pool} {d.drew_from === "qualifying" ? "qualifying entries" : "sold tickets (question voided)"}</dd>
                      <dt className="text-muted-foreground">Index</dt>
                      <dd>first 4 bytes mod {pool} = <b>{pick.index}</b> (0-based, entries in number order)</dd>
                    </dl>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button variant="gold" size="lg" onClick={runCheck} disabled={busy}>
                    {busy ? "Checking…" : "Run the check again"}
                  </Button>
                  <Button asChild variant="cream" size="lg">
                    <Link to="/draws/$id/reveal" params={{ id: d.id }}>Watch the reveal</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </article>

        <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground">
          All of this runs in your browser — check the network tab if you're the paranoid type.{" "}
          <Link to="/verify" className="underline">How verification works</Link>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function Step({ n, title, value }: { n: string; title: string; value: string }) {
  return (
    <div className="border-l-2 border-[var(--color-ink-black)] pl-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Step {n} · {title}
      </div>
      <div className="mt-1 font-mono text-[11px] break-all text-foreground">{value}</div>
    </div>
  );
}
