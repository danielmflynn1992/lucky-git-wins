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
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-10 w-full flex-1">
        <h1 className="font-display text-4xl md:text-5xl font-black">Winners Wall</h1>
        <p className="text-muted-foreground mt-1">Every prize, every winner. Handed over and photographed.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...WINNERS, ...WINNERS].map((w, i) => (
            <div key={i} className="rounded-2xl bg-card p-5 border-2 border-white/5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-clover text-cream flex items-center justify-center font-display text-2xl font-bold">{w.name[0]}</div>
                <div>
                  <div className="font-bold text-lg">{w.name} from {w.town}</div>
                  <div className="text-xs text-muted-foreground">{w.when}</div>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-gold/15 px-3 py-2 text-sm font-bold text-clover">🏆 {w.prize}</div>
              <p className="mt-3 text-sm italic text-foreground/70">"{w.quote}"</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});