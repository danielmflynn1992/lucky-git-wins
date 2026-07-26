import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { COMPETITIONS } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Lucky Git Comps" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const entries = COMPETITIONS.slice(0, 2);
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-10 w-full flex-1">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-sm bg-ink text-cream flex items-center justify-center font-display text-2xl font-semibold">G</div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover">Signed in</div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back.</h1>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Active entries" value="2" />
          <Stat label="Referral rewards" value={gbp(5)} />
          <Stat label="Wins to date" value="0" />
        </div>

        <h2 className="mt-10 font-display text-2xl font-black">My Entries</h2>
        <div className="mt-4 space-y-3">
          {entries.map((c) => (
            <div key={c.slug} className="rounded-2xl bg-card border-2 border-border p-4 flex items-center gap-4">
              <img src={c.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg truncate">{c.title}</div>
                <div className="text-xs text-muted-foreground">Draw: {new Date(c.endsAt).toLocaleString("en-GB")}</div>
                <div className="mt-1 flex gap-1 flex-wrap">
                  {["00021","00022","00023"].map((n) => (
                    <span key={n} className="rounded bg-gold/20 border border-gold px-1.5 py-0.5 text-[10px] font-bold tabular-nums">#{n}</span>
                  ))}
                </div>
                <div className="mt-1.5 text-[11px] font-mono uppercase tracking-widest">
                  Answer status:{" "}
                  <span className="text-[color:var(--color-ink-blue)] font-bold">
                    Correct · qualifying
                  </span>
                  <span className="ml-1 text-muted-foreground normal-case font-normal">
                    (revealed after draw closes)
                  </span>
                </div>
              </div>
              <Button asChild variant="cream" size="sm"><Link to="/competitions/$slug" params={{ slug: c.slug }}>View</Link></Button>
            </div>
          ))}
        </div>

        <h2 className="mt-10 font-display text-2xl font-black">Refer a mate</h2>
        <div className="mt-4 rounded-2xl bg-clover text-cream p-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-cream/70 text-xs font-bold uppercase tracking-widest">Your code</div>
            <div className="font-display text-3xl font-black">GARY-9F2K</div>
            <p className="text-sm text-cream/80 mt-1">£5 credit each when they buy their first ticket.</p>
          </div>
          <Button variant="gold" size="lg">Copy link</Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card border-2 border-border p-4">
      <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-black mt-1">{value}</div>
    </div>
  );
}