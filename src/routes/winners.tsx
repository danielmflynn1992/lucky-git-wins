import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { WINNERS } from "@/lib/mock-comps";

export const Route = createFileRoute("/winners")({
  head: () => ({
    meta: [
      { title: "Winners Wall — Lucky Git Comps" },
      { name: "description", content: "Every verified winner of a Lucky Git Comps prize draw. Real gits, real prizes, real handshakes." },
      { property: "og:title", content: "Winners Wall — Lucky Git Comps" },
      { property: "og:description", content: "Real winners. Real prizes." },
    ],
  }),
  component: () => (
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-10 w-full flex-1">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover">Verified · Handed over · Photographed</div>
        <h1 className="mt-2 font-display text-5xl md:text-7xl font-semibold tracking-[-0.03em]">
          <span className="text-gradient-mint">Smug Gits.</span>
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl">Real people. Real prizes. Real handshakes. If you'd like to join this wall of insufferable smugness, the tickets are that way.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...WINNERS, ...WINNERS].map((w, i) => (
            <div key={i} className="rounded-xl glass p-6 hover:border-clover/40 hover:shadow-[0_0_40px_-16px_rgba(0,223,129,0.35)] transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-sm bg-ink border border-clover/30 text-clover flex items-center justify-center font-display text-xl font-semibold">{w.name[0]}</div>
                <div>
                  <div className="font-semibold">{w.name} <span className="text-muted-foreground font-normal">from {w.town}</span></div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{w.when}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Prize</div>
                <div className="font-medium text-foreground">{w.prize}</div>
              </div>
              <p className="mt-5 font-serif italic text-lg leading-snug text-foreground/85">"{w.quote}"</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});