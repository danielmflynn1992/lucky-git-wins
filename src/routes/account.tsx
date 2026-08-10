import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { COMPETITIONS } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AccountSettings } from "@/components/AccountSettings";
import { fetchMyAnswers, type AnswerRecordRow } from "@/lib/account-api";
import { formatDrawTime } from "@/lib/site-stats";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Lucky Git Comps" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const entries = COMPETITIONS.slice(0, 2);
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-10 w-full flex-1">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="h-14 w-14 rounded-sm bg-ink text-cream flex items-center justify-center font-display text-2xl font-semibold">G</div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover">Signed in</div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back.</h1>
          </div>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="ml-auto text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-clover hover:underline"
          >
            Sign out
          </button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2">
          <Stat label="Active entries" value="2" />
          <Stat label="Referral rewards" value={gbp(5)} />
          <Stat label="Wins to date" value="0" />
        </div>

        <h2 className="mt-10 font-display text-2xl font-black">My Entries</h2>
        <div className="mt-4 space-y-3">
          {entries.map((c) => (
            <div key={c.slug} className="rounded-2xl bg-card border-2 border-border p-5 flex items-start gap-4">
              <img src={c.image} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg leading-tight line-clamp-2">{c.title}</div>
                <div className="mt-1">
                  <div className="leader-row text-xs">
                    <span className="uppercase tracking-widest font-bold text-muted-foreground">Draw</span>
                    <span className="leader-row__fill" />
                    <span className="font-mono tabular-nums">{formatDrawTime(c.endsAt)}</span>
                  </div>
                  <div className="leader-row text-xs">
                    <span className="uppercase tracking-widest font-bold text-muted-foreground">Answer</span>
                    <span className="leader-row__fill" />
                    <span className="font-mono uppercase tracking-widest">Sealed</span>
                  </div>
                </div>
                <div className="mt-1 flex gap-1 flex-wrap">
                  {["00021","00022","00023"].map((n) => (
                    <span
                      key={n}
                      className="rounded border-2 border-[color:var(--color-ink-blue)] bg-[var(--color-paper-raised)] text-[color:var(--color-ink-blue)] px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
                    >
                      #{n}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Sealed until the draw. Nobody peeks, including us.
                </p>
              </div>
              <Button asChild variant="cream" size="sm" className="shrink-0">
                <Link to="/competitions/$slug" params={{ slug: c.slug }}>View</Link>
              </Button>
            </div>
          ))}
        </div>

        <AnswerRecord />

        <h2 className="mt-10 font-display text-2xl font-black">Refer a mate</h2>
        <div className="mt-4 rounded-2xl bg-clover p-6 flex flex-wrap items-center justify-between gap-4" style={{ color: "var(--color-on-dark-fg)" }}>
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-marker)" }}>Your code</div>
            <div className="font-display text-3xl font-black" style={{ color: "var(--color-on-dark-fg)" }}>GARY-9F2K</div>
            <p className="text-sm mt-1" style={{ color: "color-mix(in oklab, var(--color-on-dark-fg) 85%, transparent)" }}>
              £5 credit each when they buy their first ticket.
            </p>
            <p className="text-xs mt-1" style={{ color: "color-mix(in oklab, var(--color-on-dark-fg) 85%, transparent)" }}>
              Credit applies after their first qualifying entry.{" "}
              <a href="/terms#referrals" className="underline underline-offset-2 font-semibold">Full terms</a>
            </p>
          </div>
          <Button variant="gold" size="lg">Copy link</Button>
        </div>

        <AccountSettings email={user?.email ?? null} />
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border-2 border-border px-3 py-2.5 min-w-0">
      <div className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground leading-tight truncate">{label}</div>
      <div className="font-display font-black leading-none mt-1 text-[28px] tabular-nums">{value}</div>
    </div>
  );
}

/** Real answer records. Result stays sealed until the competition is drawn. */
function AnswerRecord() {
  const { data = [] } = useQuery<AnswerRecordRow[]>({
    queryKey: ["my-answers"],
    queryFn: fetchMyAnswers,
    retry: false,
  });

  if (!data.length) return null;

  return (
    <>
      <h2 className="mt-10 font-display text-2xl font-black">Answer record</h2>
      <div className="mt-4 space-y-3">
        {data.map((a) => {
          // Correctness is null unless the server decided the comp is drawn.
          const revealed = a.drawn && a.is_correct !== null;
          return (
            <div key={a.id} className="rounded-2xl bg-card border-2 border-border p-5 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-display leading-tight line-clamp-2">{a.competition_title ?? "Competition"}</div>
                <div className="leader-row text-xs">
                  <span className="uppercase tracking-widest font-bold text-muted-foreground">You answered</span>
                  <span className="leader-row__fill" />
                  <span className="font-mono tabular-nums">{a.raw_answer}</span>
                </div>
                <div className="leader-row text-xs">
                  <span className="uppercase tracking-widest font-bold text-muted-foreground">Status</span>
                  <span className="leader-row__fill" />
                  <span className="font-mono uppercase tracking-widest font-bold">
                    {revealed
                      ? a.is_correct
                        ? "Correct · qualifying"
                        : "Incorrect · not entered"
                      : "Sealed"}
                  </span>
                </div>
                {!revealed && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Sealed until the draw. Nobody peeks, including us.
                  </p>
                )}
                {revealed && a.draw_id && (
                  <Link
                    to="/draws/$id/verify"
                    params={{ id: a.draw_id }}
                    className="mt-1 inline-block text-[11px] font-mono uppercase tracking-[0.15em] font-bold text-clover hover:underline"
                  >
                    See the draw &amp; verify →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

