import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, RefreshCw, AlertOctagon, AlertTriangle, Info } from "lucide-react";

interface ErrorRow {
  id: string;
  created_at: string;
  last_seen_at: string;
  severity: "error" | "warning" | "info";
  kind: string;
  message: string;
  stack: string | null;
  route: string | null;
  user_agent: string | null;
  viewport: string | null;
  count: number;
  resolved: boolean;
}

async function fetchErrors(includeResolved: boolean): Promise<ErrorRow[]> {
  let q = supabase
    .from("client_errors")
    .select("*")
    .order("last_seen_at", { ascending: false })
    .limit(200);
  if (!includeResolved) q = q.eq("resolved", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ErrorRow[];
}

export const Route = createFileRoute("/admin/errors")({
  head: () => ({
    meta: [
      { title: "Errors — Admin — Lucky Git Comps" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminErrors,
});

function AdminErrors() {
  const qc = useQueryClient();
  const includeResolved = false;
  const { data: rows = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "errors", includeResolved],
    queryFn: () => fetchErrors(includeResolved),
    refetchInterval: 15_000,
  });

  const resolveMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_errors")
        .update({ resolved: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "errors"] }),
  });

  const resolveAllMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("client_errors")
        .update({ resolved: true })
        .eq("resolved", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "errors"] }),
  });

  const errorCount = rows.filter((r) => r.severity === "error").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-6 w-full flex-1">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <Link to="/admin" className="hover:underline">← Admin</Link>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black mt-1">Client errors</h1>
            <p className="text-muted-foreground text-sm">
              Runtime errors, broken images and console noise from real visitors' browsers.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="cream" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={() => resolveAllMut.mutate()}
              disabled={resolveAllMut.isPending || rows.length === 0}
            >
              <CheckCircle2 className="h-4 w-4" /> Mark all resolved
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Open issues" value={rows.length.toString()} accent={rows.length > 0} />
          <Stat label="Errors" value={errorCount.toString()} />
          <Stat
            label="Total occurrences"
            value={rows.reduce((s, r) => s + r.count, 0).toString()}
          />
        </div>

        <div className="mt-8 rounded-2xl bg-card border-2 border-border overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-clover" />
              <div className="mt-2 font-display text-lg font-bold">All quiet on the front end.</div>
              <p className="text-sm text-muted-foreground mt-1">
                No unresolved errors from real visitors. Nice.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="p-4 flex gap-3 items-start">
                  <SeverityBadge severity={r.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                        {r.kind}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        ×{r.count}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.last_seen_at).toLocaleString("en-GB")}
                      </span>
                    </div>
                    <div className="mt-1 font-semibold break-words">{r.message}</div>
                    <div className="mt-1 text-xs text-muted-foreground font-mono truncate">
                      {r.route}
                      {r.viewport ? ` · ${r.viewport}` : ""}
                    </div>
                    {r.stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          Stack
                        </summary>
                        <pre className="mt-1 text-[11px] font-mono bg-background/60 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                          {r.stack}
                        </pre>
                      </details>
                    )}
                    {r.user_agent && (
                      <div className="mt-1 text-[11px] text-muted-foreground truncate">
                        {r.user_agent}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="cream"
                    size="sm"
                    onClick={() => resolveMut.mutate(r.id)}
                    disabled={resolveMut.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Resolve
                  </Button>
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

function SeverityBadge({ severity }: { severity: "error" | "warning" | "info" }) {
  const map = {
    error: { Icon: AlertOctagon, cls: "bg-urgent/15 text-urgent" },
    warning: { Icon: AlertTriangle, cls: "bg-gold/20 text-ink" },
    info: { Icon: Info, cls: "bg-muted text-muted-foreground" },
  } as const;
  const { Icon, cls } = map[severity];
  return (
    <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${cls}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border-2 ${accent ? "bg-urgent/10 border-urgent/40" : "bg-card border-border"}`}>
      <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-black mt-1 tabular-nums">{value}</div>
    </div>
  );
}