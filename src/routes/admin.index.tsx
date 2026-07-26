import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { drawCompetition, autoDrawExpired } from "@/lib/admin.functions";
import { gbp, shortNumber } from "@/lib/format";
import { Copy, Plus, Play, Pause, Trophy, Loader2, Zap, AlertTriangle } from "lucide-react";

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
}

async function fetchAdminCompetitions(): Promise<AdminRow[]> {
  const { data: comps, error } = await supabase
    .from("competitions")
    .select("id, slug, title, category, status, price_per_ticket, total_tickets, ends_at")
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
  const totalRevenue = rows.reduce((s, c) => s + c.sold * c.price_per_ticket, 0);
  const totalTickets = rows.reduce((s, c) => s + c.sold, 0);
  const liveCount = rows.filter((c) => c.status === "live").length;
  const now = Date.now();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-6 w-full flex-1">
        <div className="mb-6 rounded-2xl border-2 border-urgent/50 bg-urgent/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-urgent shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-display font-bold text-urgent">Do not enable live Stripe payments without a gambling-law review.</div>
            <p className="mt-1 text-foreground/80">
              The site is structured as a free draw under Schedule 2 of the Gambling Act 2005: every competition ships with a free entry route at{" "}
              <code className="font-mono">/free-entry</code>, linked at equal prominence from every competition page and checkout. Before accepting real money, have a UK gambling-law solicitor confirm the structure, T&amp;Cs, and free-entry mechanics.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-black">Admin</h1>
            <p className="text-muted-foreground text-sm">Run the shop.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
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
          <Stat label="Live competitions" value={liveCount.toString()} />
          <Stat label="Tickets sold" value={shortNumber(totalTickets)} />
          <Stat label="Revenue" value={gbp(totalRevenue)} accent />
        </div>

        <div className="mt-8 rounded-2xl bg-card border-2 border-border overflow-hidden">
          <div className="p-4 flex items-center justify-between gap-3 flex-wrap border-b border-border">
            <h2 className="font-display text-lg font-bold">Competitions</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="cream" size="sm"><Pause className="h-3.5 w-3.5" /> Pause selected</Button>
              <Button variant="cream" size="sm"><Play className="h-3.5 w-3.5" /> Resume selected</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
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
                      <td className="p-3 tabular-nums">{shortNumber(c.sold)}/{shortNumber(c.total_tickets)}</td>
                      <td className="p-3 font-bold">{gbp(c.sold * c.price_per_ticket)}</td>
                      <td className="p-3 text-muted-foreground">{new Date(c.ends_at).toLocaleDateString("en-GB")}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button className="p-2 rounded-lg hover:bg-background" title="Duplicate"><Copy className="h-4 w-4" /></button>
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
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border-2 ${accent ? "bg-clover text-cream border-clover" : "bg-card border-border"}`}>
      <div className={`text-xs uppercase tracking-widest font-bold ${accent ? "text-cream/70" : "text-muted-foreground"}`}>{label}</div>
      <div className="font-display text-3xl font-black mt-1">{value}</div>
    </div>
  );
}