import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { drawCompetition, autoDrawExpired, closeCompetitionNow, resetRollingDemo, listDrawNotifications, getDailyDemoEnabled, setDailyDemoEnabled, sendQueuedNotifications, retryNotification } from "@/lib/admin.functions";
import { gbp } from "@/lib/format";
import { Copy, Plus, Play, Pause, Trophy, Loader2, Zap, AlertTriangle, Bug, TimerReset, RotateCcw, Mail, Send, RefreshCw } from "lucide-react";

const exact = (n: number) => n.toLocaleString("en-GB");

interface AdminRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  price_per_ticket: number;
  total_tickets: number;
  ends_at: string;
  sold: number;
  is_demo: boolean;
}

async function fetchAdminCompetitions(): Promise<AdminRow[]> {
  const { data: comps, error } = await supabase
    .from("competitions")
    .select("id, slug, title, category, status, price_per_ticket, total_tickets, ends_at, is_demo")
    .order("ends_at", { ascending: true });
  if (error) throw error;
  if (!comps || comps.length === 0) return [];
  const ids = comps.map((c) => c.id);
  const { data: sold, error: sErr } = await supabase
    .from("tickets")
    .select("competition_id, status")
    .in("competition_id", ids)
    .eq("status", "sold");
  if (sErr) throw sErr;
  const soldMap = new Map<string, number>();
  for (const t of sold ?? []) soldMap.set(t.competition_id, (soldMap.get(t.competition_id) ?? 0) + 1);
  return comps.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    category: c.category,
    status: c.status,
    price_per_ticket: Number(c.price_per_ticket),
    total_tickets: c.total_tickets,
    ends_at: c.ends_at,
    sold: soldMap.get(c.id) ?? 0,
    is_demo: Boolean((c as { is_demo?: boolean }).is_demo),
  }));
}

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Lucky Git Comps" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "competitions"],
    queryFn: fetchAdminCompetitions,
    staleTime: 10_000,
  });
  const draw = useServerFn(drawCompetition);
  const autoDraw = useServerFn(autoDrawExpired);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const drawMut = useMutation({
    mutationFn: (id: string) => draw({ data: { competitionId: id } }),
    onMutate: (id) => setDrawingId(id),
    onSettled: () => setDrawingId(null),
    onSuccess: (res) => {
      toast.success(`Winner drawn: ticket #${res.winning_number}`, {
        description: `${res.competition_title} → ${res.winner_display_name}`,
      });
      qc.invalidateQueries({ queryKey: ["admin", "competitions"] });
      qc.invalidateQueries({ queryKey: ["past-draws"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Draw failed"),
  });
  const autoMut = useMutation({
    mutationFn: () => autoDraw({ data: undefined }),
    onSuccess: (res) => {
      toast.success(`Auto-drew ${res.drawn} competition${res.drawn === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["admin", "competitions"] });
      qc.invalidateQueries({ queryKey: ["past-draws"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Auto-draw failed"),
  });
  const closeNow = useServerFn(closeCompetitionNow);
  const resetDemo = useServerFn(resetRollingDemo);
  const notifications = useServerFn(listDrawNotifications);
  const sendQueued = useServerFn(sendQueuedNotifications);
  const retryOne = useServerFn(retryNotification);
  const sendMut = useMutation({
    mutationFn: () => sendQueued({ data: undefined }),
    onSuccess: (res) => {
      if (res.sent === 0 && res.failed === 0) toast.info("Nothing queued to send.");
      else if (res.failed === 0) toast.success(`Sent ${res.sent}.`);
      else toast.warning(`Sent ${res.sent}, failed ${res.failed}. Check the detail lines.`);
      qc.invalidateQueries({ queryKey: ["admin", "draw-notifications"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Send failed"),
  });
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const retryMut = useMutation({
    mutationFn: (id: string) => retryOne({ data: { id } }),
    onMutate: (id: string) => setRetryingId(id),
    onSettled: () => setRetryingId(null),
    onSuccess: (res) => {
      if (res.sent) toast.success("Sent.");
      else toast.error("Still failing — see the detail line.");
      qc.invalidateQueries({ queryKey: ["admin", "draw-notifications"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Retry failed"),
  });
  const closeMut = useMutation({
    mutationFn: (id: string) => closeNow({ data: { competitionId: id } }),
    onSuccess: () => {
      toast.success("Closed. Draw it whenever you like.");
      qc.invalidateQueries({ queryKey: ["admin", "competitions"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Close failed"),
  });
  const resetMut = useMutation({
    mutationFn: () => resetDemo({ data: undefined }),
    onSuccess: (res) => {
      toast.success(`Rolling example reset — ${res.drawn} drawn, a fresh one is live.`);
      qc.invalidateQueries({ queryKey: ["admin", "competitions"] });
      qc.invalidateQueries({ queryKey: ["demo-comps"] });
      qc.invalidateQueries({ queryKey: ["drawn-competitions"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Reset failed"),
  });
  const { data: outbox = [] } = useQuery({
    queryKey: ["admin", "draw-notifications"],
    queryFn: () => notifications({ data: undefined }),
    staleTime: 15_000,
  });
  const readDaily = useServerFn(getDailyDemoEnabled);
  const writeDaily = useServerFn(setDailyDemoEnabled);
  const { data: daily } = useQuery({
    queryKey: ["admin", "daily-demo"],
    queryFn: () => readDaily({ data: undefined }),
    staleTime: 30_000,
  });
  const dailyMut = useMutation({
    mutationFn: (enabled: boolean) => writeDaily({ data: { enabled } }),
    onSuccess: (res) => {
      toast.success(res.enabled ? "Daily example cycle resumed." : "Daily example cycle paused.");
      qc.invalidateQueries({ queryKey: ["admin", "daily-demo"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not change the daily cycle"),
  });
  const realRows = rows.filter((c) => !c.is_demo);
  const demoRows = rows.filter((c) => c.is_demo);
  const revenueOf = (rs: AdminRow[]) => rs.reduce((s, c) => s + c.sold * c.price_per_ticket, 0);
  const ticketsOf = (rs: AdminRow[]) => rs.reduce((s, c) => s + c.sold, 0);
  const liveOf = (rs: AdminRow[]) => rs.filter((c) => c.status === "live").length;
  const { data: errCount = 0 } = useQuery({
    queryKey: ["admin", "errors-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("unresolved_client_errors_count");
      if (error) throw error;
      return Number(data ?? 0);
    },
    refetchInterval: 30_000,
  });
  const now = Date.now();
  // Comps that closed more than 24h ago and still have no draw record. This
  // must never sit unnoticed for weeks.
  const stuck = rows.filter(
    (c) => c.status === "live" && now - new Date(c.ends_at).getTime() > 24 * 60 * 60 * 1000,
  );
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-6 w-full flex-1">
        {stuck.length > 0 && (
          <div className="mb-6 rounded-2xl border-2 border-urgent bg-urgent/15 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-urgent shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-display font-bold text-urgent">
                {stuck.length} competition{stuck.length === 1 ? "" : "s"} stuck awaiting a draw for over 24 hours
              </div>
              <p className="mt-1 text-foreground/80">
                {stuck.map((c) => c.title).join(", ")}. Run “Auto-draw expired” or draw them individually below.
              </p>
            </div>
          </div>
        )}
        <div className="mb-6 rounded-2xl border-2 border-urgent/50 bg-urgent/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-urgent shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-display font-bold text-urgent">Do not enable live Stripe payments without a gambling-law review.</div>
            <p className="mt-1 text-foreground/80">
              The site is structured as a prize competition of skill under Section 14 of the Gambling Act 2005.
              Every competition must carry a skill question that a reasonable person could get wrong: the answer is
              typed in free-text, never chosen from options, and it is marked server-side. Only entries that answer
              correctly go into the draw — and if nobody answers correctly the question is treated as void and the
              draw falls back to every sold ticket, exactly as written in the T&amp;Cs. Before accepting real money,
              have a UK gambling-law solicitor confirm the T&amp;Cs and the question-authoring workflow. See{" "}
              <Link to="/admin/questions" className="underline font-bold">/admin/questions</Link>{" "}
              for the question bank, difficulty monitoring and the answer-log export.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-black">Admin</h1>
            <p className="text-muted-foreground text-sm">Run the shop.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="cream" size="lg">
              <Link to="/admin/errors">
                <Bug className="h-4 w-4" /> Errors
                {errCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-urgent text-white text-xs font-bold tabular-nums">
                    {errCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="cream" size="lg">
              <Link to="/demo">Examples</Link>
            </Button>
            <Button variant="cream" size="lg" onClick={() => resetMut.mutate()} disabled={resetMut.isPending}>
              {resetMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Reset daily example
            </Button>
            <Button
              variant="cream"
              size="lg"
              onClick={() => dailyMut.mutate(!(daily?.enabled ?? true))}
              disabled={dailyMut.isPending || daily === undefined}
            >
              {dailyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : daily?.enabled === false ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {daily?.enabled === false ? "Resume daily cycle" : "Pause daily cycle"}
            </Button>
            <Button variant="cream" size="lg" onClick={() => autoMut.mutate()} disabled={autoMut.isPending}>
              {autoMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Auto-draw expired
            </Button>
            <Button asChild variant="gold" size="lg">
              <Link to="/admin/competitions/new"><Plus className="h-4 w-4" /> New competition</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat
            label="Live competitions"
            real={exact(liveOf(realRows))}
            demo={exact(liveOf(demoRows))}
          />
          <Stat
            label="Tickets sold"
            real={exact(ticketsOf(realRows))}
            demo={exact(ticketsOf(demoRows))}
          />
          <Stat
            label="Revenue"
            real={gbp(revenueOf(realRows))}
            demo={gbp(revenueOf(demoRows))}
            accent
          />
        </div>

        <div className="mt-8 rounded-2xl bg-card border-2 border-border overflow-hidden">
          <div className="p-4 flex items-center justify-between gap-3 flex-wrap border-b border-border">
            <h2 className="font-display text-lg font-bold">Competitions</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="cream" size="sm"><Pause className="h-3.5 w-3.5" /> Pause selected</Button>
              <Button variant="cream" size="sm"><Play className="h-3.5 w-3.5" /> Resume selected</Button>
            </div>
          </div>
          {/* Mobile: stacked cards. Desktop: the full table below. */}
          <ul className="md:hidden divide-y divide-border">
            {isLoading && <li className="p-6 text-center text-muted-foreground text-sm">Loading…</li>}
            {!isLoading && rows.length === 0 && (
              <li className="p-6 text-center text-muted-foreground text-sm">No competitions yet.</li>
            )}
            {rows.map((c) => {
              const expired = new Date(c.ends_at).getTime() <= now;
              const isDrawing = drawingId === c.id && drawMut.isPending;
              return (
                <li key={`m-${c.slug}`} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold break-words">{c.title}</div>
                      <div className="text-[11px] text-muted-foreground font-mono break-all">{c.slug}</div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                      c.status === "drawn" ? "bg-clover/15 text-clover" :
                      expired ? "bg-urgent/15 text-urgent" :
                      c.status === "live" ? "bg-gold/20 text-ink" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {c.status === "drawn" ? "Drawn" : expired ? "Expired" : c.status}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Sold</dt>
                    <dd className="text-right tabular-nums">{exact(c.sold)}/{exact(c.total_tickets)}</dd>
                    <dt className="text-muted-foreground">Revenue</dt>
                    <dd className="text-right font-bold">{gbp(c.sold * c.price_per_ticket)}</dd>
                    <dt className="text-muted-foreground">Ends</dt>
                    <dd className="text-right">{new Date(c.ends_at).toLocaleDateString("en-GB")}</dd>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="cream"
                      size="sm"
                      disabled={expired || c.status === "drawn" || closeMut.isPending}
                      onClick={() => {
                        if (!confirm(`Close "${c.title}" right now?`)) return;
                        closeMut.mutate(c.id);
                      }}
                    >
                      <TimerReset className="h-3.5 w-3.5" /> Close now
                    </Button>
                    <Button
                      variant="cream"
                      size="sm"
                      disabled={c.status === "drawn" || isDrawing}
                      onClick={() => {
                        if (!confirm(`Draw the winner for "${c.title}" now? This can't be undone.`)) return;
                        drawMut.mutate(c.id);
                      }}
                    >
                      {isDrawing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
                      Draw
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-3"><input type="checkbox" /></th>
                  <th className="p-3">Prize</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Sold</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3">Ends</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!isLoading && rows.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No competitions yet.</td></tr>
                )}
                {rows.map((c) => {
                  const expired = new Date(c.ends_at).getTime() <= now;
                  const canDraw = c.status !== "drawn";
                  const isDrawing = drawingId === c.id && drawMut.isPending;
                  return (
                    <tr key={c.slug} className="border-t border-border">
                      <td className="p-3"><input type="checkbox" /></td>
                      <td className="p-3">
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">{c.slug}</div>
                      </td>
                      <td className="p-3">{c.category}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                          c.status === "drawn" ? "bg-clover/15 text-clover" :
                          expired ? "bg-urgent/15 text-urgent" :
                          c.status === "live" ? "bg-gold/20 text-ink" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {c.status === "drawn" ? "Drawn" : expired ? "Expired" : c.status}
                        </span>
                      </td>
                      <td className="p-3 tabular-nums">{exact(c.sold)}/{exact(c.total_tickets)}</td>
                      <td className="p-3 font-bold">{gbp(c.sold * c.price_per_ticket)}</td>
                      <td className="p-3 text-muted-foreground">{new Date(c.ends_at).toLocaleDateString("en-GB")}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button className="p-2 rounded-lg hover:bg-background" title="Duplicate"><Copy className="h-4 w-4" /></button>
                          <button
                            className="p-2 rounded-lg hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed"
                            title={expired || c.status === "drawn" ? "Already closed" : "Close comp now"}
                            disabled={expired || c.status === "drawn" || closeMut.isPending}
                            onClick={() => {
                              if (!confirm(`Close "${c.title}" right now?`)) return;
                              closeMut.mutate(c.id);
                            }}
                          >
                            <TimerReset className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed"
                            title={c.status === "drawn" ? "Already drawn" : "Draw winner now"}
                            disabled={!canDraw || isDrawing}
                            onClick={() => {
                              if (!confirm(`Draw the winner for "${c.title}" now? This can't be undone.`)) return;
                              drawMut.mutate(c.id);
                            }}
                          >
                            {isDrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-8 rounded-2xl bg-card border-2 border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2 flex-wrap">
            <Mail className="h-4 w-4" />
            <h2 className="font-display text-lg font-bold">Draw notifications</h2>
            <span className="text-xs text-muted-foreground">
              Admin/test addresses only. Example draws are prefixed [DEMO].
            </span>
            <Button
              variant="cream"
              size="sm"
              className="ml-auto"
              onClick={() => sendMut.mutate()}
              disabled={sendMut.isPending}
            >
              {sendMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send queued
            </Button>
          </div>
          {outbox.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nothing queued yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {outbox.slice(0, 12).map((n) => (
                <li key={n.id} className="p-3 text-sm">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
                    <span
                      className={
                        "font-mono text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 " +
                        (n.status === "sent"
                          ? "bg-clover/15 text-clover"
                          : n.status === "failed"
                            ? "bg-urgent/15 text-urgent"
                            : n.status === "alert"
                              ? "bg-gold/25 text-ink"
                              : "bg-muted text-muted-foreground")
                      }
                    >
                      {n.status}
                    </span>
                    <span className="font-semibold">{n.subject}</span>
                    <span className="text-muted-foreground text-xs">&rarr; {n.recipient}</span>
                    <span className="text-muted-foreground text-xs ml-auto tabular-nums">
                      {n.sent_at
                        ? `sent ${new Date(n.sent_at).toLocaleString("en-GB")}`
                        : new Date(n.created_at).toLocaleString("en-GB")}
                    </span>
                  </div>
                  {n.detail && (
                    <p className="mt-1 text-xs text-muted-foreground break-words">{n.detail}</p>
                  )}
                  {n.status !== "sent" && (
                    <Button
                      variant="cream"
                      size="sm"
                      className="mt-2"
                      onClick={() => retryMut.mutate(n.id)}
                      disabled={retryingId === n.id && retryMut.isPending}
                    >
                      {retryingId === n.id && retryMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Retry
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, real, demo, accent = false }: { label: string; real: string; demo: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border-2 ${accent ? "bg-clover text-cream border-clover" : "bg-card border-border"}`}>
      <div className={`text-xs uppercase tracking-widest font-bold ${accent ? "text-cream/70" : "text-muted-foreground"}`}>{label}</div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <div>
          <div className={`text-[10px] font-mono uppercase tracking-widest ${accent ? "text-cream/70" : "text-muted-foreground"}`}>Real</div>
          <div className="font-display text-2xl font-black tabular-nums">{real}</div>
        </div>
        <div className={accent ? "text-cream/70" : "text-muted-foreground"}>·</div>
        <div>
          <div className={`text-[10px] font-mono uppercase tracking-widest ${accent ? "text-cream/70" : "text-muted-foreground"}`}>Demo</div>
          <div className="font-display text-2xl font-black tabular-nums opacity-70">{demo}</div>
        </div>
      </div>
    </div>
  );
}