import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Countdown } from "@/components/Countdown";
import { COMPETITIONS } from "@/lib/mock-comps";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/live-draws")({
  head: () => ({
    meta: [
      { title: "Live Draws — Lucky Git Comps" },
      { name: "description", content: "Watch every Lucky Git Comps draw live. Upcoming schedule and latest results." },
      { property: "og:title", content: "Live Draws — Lucky Git Comps" },
      { property: "og:description", content: "Every draw, streamed live." },
    ],
  }),
  component: () => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-10 w-full flex-1">
        <div className="inline-flex items-center gap-2 rounded-full bg-hot/10 text-hot px-3 py-1 text-xs font-black uppercase tracking-widest urgent-pulse">
          <Radio className="h-3.5 w-3.5" /> Live
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl font-black">Live Draws</h1>
        <p className="text-muted-foreground mt-1">Watch the winning ticket get pulled in real time. No edits, no funny business.</p>

        <div className="mt-6 aspect-video rounded-2xl bg-ink text-cream flex items-center justify-center border-2 border-ink">
          <div className="text-center">
            <Radio className="h-10 w-10 mx-auto text-gold" />
            <div className="mt-2 font-display text-xl">Live stream embed goes here</div>
            <div className="text-cream/60 text-xs mt-1">(YouTube / Facebook Live)</div>
          </div>
        </div>

        <h2 className="mt-10 font-display text-2xl font-black">Upcoming draws</h2>
        <div className="mt-4 space-y-3">
          {COMPETITIONS.slice(0, 4).map((c) => (
            <div key={c.slug} className="flex items-center gap-4 rounded-2xl bg-white border-2 border-ink/5 p-4">
              <img src={c.image} className="h-14 w-14 rounded-lg object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg truncate">{c.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(c.endsAt).toLocaleString("en-GB")}</div>
              </div>
              <Countdown target={c.endsAt} compact />
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});