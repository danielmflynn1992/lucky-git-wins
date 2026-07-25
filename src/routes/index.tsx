import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Ticket, Shield, Radio, MessageSquareHeart, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CompCard } from "@/components/CompCard";
import { Countdown } from "@/components/Countdown";
import { GaryMascot } from "@/components/GaryMascot";
import { COMPETITIONS, CATEGORIES, WINNERS, type Category } from "@/lib/mock-comps";
import { gbp, shortNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lucky Git Comps — Win Cars, Cash & Tech in the UK" },
      { name: "description", content: "Live UK prize competitions with verified winners and live-streamed draws. Cars, tech, cash and holidays from £1. Free postal entry available." },
      { property: "og:title", content: "Lucky Git Comps — Someone's got to win it" },
      { property: "og:description", content: "Cars, cash, tech and holidays. Live draws. Chancers welcome." },
    ],
  }),
  component: Home,
});

function Home() {
  const hero = COMPETITIONS.filter((c) => c.hot).slice(0, 3);
  const [active, setActive] = useState(0);
  const [cat, setCat] = useState<Category | "All">("All");
  const [sort, setSort] = useState<"ending" | "popular" | "price">("ending");

  const filtered = useMemo(() => {
    let list = cat === "All" ? COMPETITIONS : COMPETITIONS.filter((c) => c.category === cat);
    list = [...list];
    if (sort === "ending") list.sort((a, b) => +new Date(a.endsAt) - +new Date(b.endsAt));
    if (sort === "popular") list.sort((a, b) => b.ticketsSold / b.totalTickets - a.ticketsSold / a.totalTickets);
    if (sort === "price") list.sort((a, b) => a.pricePerTicket - b.pricePerTicket);
    return list;
  }, [cat, sort]);

  const featured = hero[active];
  const featuredPct = Math.round((featured.ticketsSold / featured.totalTickets) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />

      {/* HERO */}
      <section className="relative bg-clover-pattern text-cream overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-14 md:pt-16 md:pb-24 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cream/10 border border-cream/20 px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> Chancers welcome
            </div>
            <h1 className="mt-4 font-display text-4xl md:text-6xl font-black leading-[1.05]">
              Go on then,<br />
              <span className="text-gold">you lucky git.</span>
            </h1>
            <p className="mt-4 text-cream/80 max-w-md text-lg">
              Buy a ticket, answer a genuinely-not-insulting question, watch us draw it live. Someone's got to win it — might as well be you.
            </p>

            {/* Featured comp mini card */}
            <div className="mt-6 rounded-2xl bg-cream text-ink p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] max-w-md border-2 border-gold">
              <div className="flex gap-3">
                <img src={featured.image} alt="" className="h-20 w-20 rounded-xl object-cover" width={80} height={80} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-clover/70">{featured.category}</div>
                  <div className="font-display text-base leading-tight truncate">{featured.title}</div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full shimmer" style={{ width: `${featuredPct}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] font-semibold flex justify-between">
                    <span>{shortNumber(featured.ticketsSold)} / {shortNumber(featured.totalTickets)}</span>
                    <span className="text-clover">{featuredPct}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-70">From</div>
                  <div className="font-display font-black text-2xl leading-none">{gbp(featured.pricePerTicket)}</div>
                </div>
                <Countdown target={featured.endsAt} compact />
                <Button asChild variant="gold" size="lg" className="ml-auto">
                  <Link to="/competitions/$slug" params={{ slug: featured.slug }}>
                    Enter <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-4 flex gap-1.5">
              {hero.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Show featured ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-gold" : "w-2 bg-cream/40"}`}
                />
              ))}
            </div>
          </div>

          {/* Gary hero */}
          <div className="relative hidden md:block">
            <div className="absolute -inset-8 bg-gold/20 blur-3xl rounded-full" />
            <GaryMascot className="relative w-full max-w-md mx-auto drop-shadow-2xl" />
            <div className="absolute top-4 right-8 rotate-6 bg-gold text-gold-foreground px-4 py-2 rounded-xl font-black shadow-[var(--shadow-sticker)] font-display">
              "It's not going to win itself, is it?"
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b-2 border-ink/5 bg-cream">
        <div className="mx-auto max-w-7xl px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-semibold">
          {[
            { i: Radio, t: "Every draw streamed live" },
            { i: Shield, t: "Verified winners, real people" },
            { i: MessageSquareHeart, t: "UK company, UK support" },
            { i: Ticket, t: "Free postal entry always" },
          ].map(({ i: Icon, t }) => (
            <div key={t} className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-full bg-clover/10 text-clover flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE COMPETITIONS GRID */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-black">Live Competitions</h2>
            <p className="text-muted-foreground text-sm mt-1">Pick your prize. Pick your numbers. Pray to Gary.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-lg border-2 border-ink/10 bg-cream px-3 py-2 text-sm font-semibold focus:outline-none focus:border-clover"
            >
              <option value="ending">Ending soonest</option>
              <option value="popular">Most popular</option>
              <option value="price">Cheapest first</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {(["All", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold border-2 transition-colors ${
                cat === c ? "bg-clover text-cream border-clover" : "bg-cream text-ink/80 border-ink/10 hover:border-clover/30"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.slug} className="rise-in">
              <CompCard c={c} />
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 mt-20 w-full">
        <div className="rounded-3xl bg-white border-2 border-ink/5 p-8 md:p-12 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-3xl md:text-4xl font-black text-center">How it works</h2>
          <p className="text-center text-muted-foreground mt-2">Three steps. One of them's paying us. Sorry.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Pick your tickets", d: "Lucky Dip or pick your own numbers. From £1 a go." },
              { n: "02", t: "Answer the question", d: "One quick skill question to keep it above board." },
              { n: "03", t: "We draw it live", d: "Live-streamed random draw. Winners paid within 48 hours." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl bg-cream p-6 border-2 border-ink/5">
                <div className="font-display text-5xl font-black text-gold leading-none">{s.n}</div>
                <h3 className="mt-3 font-display text-xl">{s.t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WINNERS WALL */}
      <section className="mx-auto max-w-7xl px-4 mt-20 w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-black">Recent winners</h2>
            <p className="text-muted-foreground mt-1">Real gits. Real prizes. Real handshakes.</p>
          </div>
          <Link to="/winners" className="text-sm font-bold text-clover hover:underline">See all winners →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WINNERS.slice(0, 3).map((w) => (
            <div key={w.name + w.prize} className="rounded-2xl bg-white p-5 border-2 border-ink/5 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-clover text-cream flex items-center justify-center font-display text-xl font-bold">
                  {w.name[0]}
                </div>
                <div>
                  <div className="font-bold">{w.name} from {w.town}</div>
                  <div className="text-xs text-muted-foreground">{w.when}</div>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-gold/15 px-3 py-2 text-sm font-bold text-clover">🏆 {w.prize}</div>
              <p className="mt-3 text-sm italic text-ink/70">"{w.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-7xl px-4 mt-20 w-full">
        <div className="rounded-3xl bg-ink text-cream p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-20">
            <GaryMascot className="h-64 w-64" />
          </div>
          <div className="relative max-w-xl">
            <h2 className="font-display text-3xl md:text-4xl font-black">New comps in your inbox. Not the boring kind.</h2>
            <p className="mt-2 text-cream/70">One email a week, tops. Unsubscribe with one click. We're not monsters.</p>
            <form className="mt-5 flex gap-2 flex-col sm:flex-row" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="you@somewhere.co.uk"
                className="flex-1 rounded-xl bg-cream/10 border-2 border-cream/20 px-4 py-3 text-cream placeholder:text-cream/50 focus:outline-none focus:border-gold"
              />
              <Button variant="gold" size="lg" type="submit">Sign me up</Button>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
