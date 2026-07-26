import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldCheck, Zap, Cpu, ScaleIcon, Bell } from "lucide-react";

export const Route = createFileRoute("/promise")({
  head: () => ({
    meta: [
      { title: "The 499 Promise — Lucky Git Comps" },
      { name: "description", content: "Real odds capped at 1 in 499. Draws never delayed. Every draw automated and independently verifiable. That's the promise." },
      { property: "og:title", content: "The 499 Promise — Lucky Git Comps" },
      { property: "og:description", content: "Capped odds, automated draws, no dead comps." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PromisePage,
});

const PRESETS = [500, 2000, 5000, 10000, 25000];

function PromisePage() {
  const [tickets, setTickets] = useState(5000);
  const oursCap = 499;
  const ratio = useMemo(() => Math.max(1, Math.round(tickets / oursCap)), [tickets]);

  return (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="flex-1 w-full">
        {/* HERO */}
        <section className="mx-auto max-w-5xl px-4 pt-16 pb-10">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover font-bold">Our house rules</div>
          <h1 className="mt-3 font-display text-5xl md:text-7xl font-black tracking-[-0.03em]">
            The <span className="text-clover">499</span> Promise.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Three promises. All three enforced by the code, not by us hoping to keep them. If we ever break one, take a screenshot and shame us on the internet.
          </p>
        </section>

        {/* PROMISES */}
        <section className="mx-auto max-w-6xl px-4 grid gap-4 md:grid-cols-3">
          {[
            {
              i: ScaleIcon,
              kicker: "Promise #1",
              title: "Odds capped at 1 in 499",
              body: "Every headline comp has a hard ticket cap. You always know the worst-case odds before you enter — no drip-fed extra tickets, no surprise raises.",
            },
            {
              i: Cpu,
              kicker: "Promise #2",
              title: "Fully automated draws",
              body: "The moment the timer hits zero (or the last ticket sells), the system draws deterministically from the pool of correct answers only. No presenter, no delay, no room for a stitch-up.",
            },
            {
              i: ShieldCheck,
              kicker: "Promise #3",
              title: "No dead comps",
              body: "Every competition draws on its stated close date/time regardless of how many tickets sold. This isn't a promise we hope to keep — the system doesn't know how to delay a draw.",
            },
          ].map((p) => (
            <div key={p.title} className="rounded-lg bg-card border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-md bg-clover/10 text-clover grid place-items-center">
                  <p.i className="h-5 w-5" />
                </span>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-clover font-bold">{p.kicker}</div>
              </div>
              <h2 className="mt-4 font-display text-xl font-black tracking-tight">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </section>

        {/* ODDS COMPARISON TOOL */}
        <section className="mx-auto max-w-5xl px-4 mt-20">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover font-bold">Odds comparison</div>
          <h2 className="mt-2 font-display text-3xl md:text-4xl font-black tracking-tight">See what capped odds actually mean.</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Punch in the ticket count a typical big competition site is running. We'll show you how our cap stacks up.
          </p>

          <div className="mt-8 rounded-lg bg-card border border-border p-6 md:p-8 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((n) => (
                <button
                  key={n}
                  onClick={() => setTickets(n)}
                  className={
                    "rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors " +
                    (tickets === n
                      ? "bg-ink text-cream border-ink"
                      : "bg-background text-foreground/70 border-border hover:border-foreground/40")
                  }
                >
                  {n.toLocaleString()} tix
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label htmlFor="odds-slider" className="block text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Their ticket count: <span className="text-foreground font-bold tabular-nums">{tickets.toLocaleString()}</span>
              </label>
              <input
                id="odds-slider"
                type="range"
                min={100}
                max={50000}
                step={100}
                value={tickets}
                onChange={(e) => setTickets(Number(e.target.value))}
                className="w-full accent-clover"
              />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-clover/30 bg-clover/5 p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-clover font-bold">Us (capped)</div>
                <div className="mt-2 font-display font-black text-4xl tabular-nums text-clover">1 : {oursCap}</div>
                <div className="text-xs text-muted-foreground mt-2">Every ticket is one of at most 499 — that's the worst-case, guaranteed.</div>
              </div>
              <div className="rounded-md border border-border bg-background p-5">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground font-bold">A typical big site</div>
                <div className="mt-2 font-display font-black text-4xl tabular-nums text-foreground">1 : {tickets.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-2">Your odds get diluted with every extra ticket sold.</div>
              </div>
            </div>

            <p className="mt-6 rounded-md bg-muted/60 border border-border p-4 text-sm text-foreground/80 leading-relaxed">
              At <span className="font-bold tabular-nums">499</span> tickets (our cap), your odds are <span className="font-bold text-clover tabular-nums">1 in 499</span>. At <span className="font-bold tabular-nums">{tickets.toLocaleString()}</span> tickets, your odds would be <span className="font-bold tabular-nums">1 in {tickets.toLocaleString()}</span> — <span className="font-bold text-clover">{ratio}× worse</span>.
            </p>
          </div>
        </section>

        {/* NO DEAD COMPS DEEP DIVE */}
        <section className="mx-auto max-w-5xl px-4 mt-20">
          <div className="rounded-lg bg-ink text-cream p-8 md:p-12 relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold font-bold">The no-dead-comps bit</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-black tracking-[-0.02em]">Nobody's postponing anything.</h2>
            <p className="mt-4 text-cream/80 leading-relaxed max-w-2xl">
              Because our draws are fully automated (see Promise #2), the draw literally cannot be delayed. When the timer hits zero the server runs the RNG, writes the winning number to the public log, and moves on. There's no button labelled "Push the draw back a week because ticket sales are slow" — that button doesn't exist in our code.
            </p>
            <p className="mt-3 text-cream/60 leading-relaxed max-w-2xl italic">
              This isn't a promise we hope to keep. The system doesn't know how to delay a draw.
            </p>
          </div>
        </section>

        {/* VERIFY LINK */}
        <section className="mx-auto max-w-5xl px-4 mt-16 mb-24">
          <div className="rounded-lg border border-border bg-card p-6 md:p-8 grid gap-4 md:grid-cols-[1fr_auto] items-center">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover font-bold">Trust, but verify</div>
              <h3 className="mt-2 font-display text-2xl font-black">Check any draw yourself.</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Every draw publishes a hash before tickets close and reveals the seed after. Anyone can re-hash the seed and confirm nothing was tampered with. No maths degree required.
              </p>
            </div>
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 rounded-md bg-clover text-primary-foreground px-5 py-3 font-display font-extrabold uppercase tracking-wider text-sm hover:bg-clover-deep"
            >
              <Zap className="h-4 w-4" /> How verification works
            </Link>
          </div>
        </section>

        {/* NOTIFY */}
        <section className="mx-auto max-w-5xl px-4 mb-24">
          <div className="rounded-lg border border-border bg-card p-6 md:p-8 flex items-center gap-4 flex-wrap">
            <Bell className="h-5 w-5 text-clover" />
            <p className="text-sm text-foreground/80 flex-1">
              Want a heads-up before each scheduled drop? Sign up on the homepage.
            </p>
            <Link to="/" className="text-sm font-bold text-clover hover:underline">Back to comps →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}