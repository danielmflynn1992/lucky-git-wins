import { createFileRoute } from "@tanstack/react-router";
import { ukDateTime } from "@/lib/format";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Perforation } from "@/components/Perforation";

export const Route = createFileRoute("/slips/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Entry slip #${params.id.slice(0, 8)} — Lucky Git Comps` },
      { name: "description", content: "Your Lucky Git Comps entry slip. Keep this somewhere safe. Or don't — we've got a copy." },
      { property: "og:title", content: "Entry slip — Lucky Git Comps" },
      { property: "og:description", content: "Printed entry slip for a Lucky Git Comps competition." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SlipPage,
});

function SlipPage() {
  const { id } = Route.useParams();
  // Slip lookup is intentionally client-only. Real data comes from
  // localStorage after checkout; a bookmarked slip URL renders the shell
  // even if the visitor doesn't have the payload cached.
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(`slip:${id}`) : null;
  const payload: {
    competition: string;
    numbers: number[];
    stake: string;
    odds: string;
    closesAt?: string;
  } | null = raw ? safeParse(raw) : null;

  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-10 w-full flex-1">
        <article className="relative bg-[var(--color-paper)] border-2 border-[var(--color-ink-black)] shadow-md">
          <Perforation />
          <div className="bg-[var(--color-ink-red)] text-[var(--color-paper)] px-5 py-3 flex items-baseline justify-between">
            <div className="font-display uppercase tracking-[0.18em] text-sm">Lucky Git Comps · Entry Slip</div>
            <div className="font-mono text-[10px] tabular-nums opacity-80">#{id.slice(0, 8).toUpperCase()}</div>
          </div>

          <div className="p-5 md:p-8 relative">
            {payload ? (
              <dl className="space-y-4">
                <SlipRow label="Competition" value={payload.competition} />
                <SlipRow label="Numbers" value={payload.numbers.map((n) => String(n).padStart(4, "0")).join("  ")} mono />
                <SlipRow label="Stake" value={payload.stake} mono />
                <SlipRow label="Odds" value={payload.odds} mono />
                {payload.closesAt && <SlipRow label="Closes" value={ukDateTime(payload.closesAt)} mono />}
              </dl>
            ) : (
              <p className="font-mono text-sm text-[var(--color-ink-black)]/70">
                Slip payload not found on this device. If you're the ticket-holder, open this link from the device you bought on.
              </p>
            )}

            <div className="absolute right-6 top-6 pointer-events-none">
              <span className="lucky-git-stamp lucky-git-stamp--md">Paid</span>
            </div>

            <p className="mt-8 text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--color-ink-black)]/50">
              Keep this somewhere safe. Or don't — we've got a copy.
            </p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

function SlipRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-dashed border-[var(--color-ink-black)]/30 pb-2">
      <dt className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--color-ink-black)]/60">{label}</dt>
      <dd className={mono ? "font-mono tabular-nums text-sm" : "font-display text-base"}>{value}</dd>
    </div>
  );
}

function safeParse(raw: string) {
  try { return JSON.parse(raw); } catch { return null; }
}