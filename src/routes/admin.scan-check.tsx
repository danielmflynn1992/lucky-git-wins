import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, X, Loader2 } from "lucide-react";
import { getScanCheck } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/scan-check")({
  head: () => ({
    meta: [
      { title: "Scan check — Admin | Lucky Git Comps" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Internal launch-readiness scan for Lucky Git Comps." },
    ],
  }),
  component: ScanCheck,
});

function ScanCheck() {
  const scan = useServerFn(getScanCheck);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "scan-check"],
    queryFn: () => scan({ data: undefined }),
    retry: false,
  });

  return (
    <div>
      <h1 className="font-display uppercase text-3xl">Scan check</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Live data, checked on the server. Anything red is a launch blocker.
      </p>

      {isLoading && <Loader2 className="mt-8 h-5 w-5 animate-spin text-muted-foreground" />}
      {error && (
        <p role="alert" className="mt-6 font-mono text-sm text-[var(--color-ink-red)]">
          {(error as Error).message}
        </p>
      )}

      {data && (
        <>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {data.checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 py-3">
                {c.ok ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-clover" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-red)]" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{c.label}</div>
                  {!c.ok && c.detail && (
                    <div className="font-mono text-[11px] text-muted-foreground [overflow-wrap:anywhere]">{c.detail}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-display uppercase text-xl">Real vs example</h2>
          <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Count label="Competitions (real)" value={data.counts.realCompetitions} />
            <Count label="Competitions (example)" value={data.counts.exampleCompetitions} />
            <Count label="Draws (real)" value={data.counts.realDraws} />
            <Count label="Draws (example)" value={data.counts.exampleDraws} />
            <Count label="Fallback-pool draws" value={data.counts.fallbackDraws} />
          </dl>

          <p className="mt-8 text-sm">
            <Link to="/admin" className="underline">Back to admin</Link>
          </p>
        </>
      )}
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <dt className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
