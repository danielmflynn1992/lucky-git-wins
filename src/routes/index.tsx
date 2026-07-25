import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Ticket, Shield, Radio, MessageSquareHeart, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CompCard } from "@/components/CompCard";
import { Countdown } from "@/components/Countdown";
import { LuckyMark } from "@/components/GaryMascot";
import { LiveOddsTicker } from "@/components/LiveOddsTicker";
import { COMPETITIONS, CATEGORIES, WINNERS, type Category } from "@/lib/mock-comps";
import { gbp, shortNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lucky Git Comps — Win Cars, Cash & Tech in the UK" },
      { name: "description", content: "UK prize competitions with verified winners and automatic random draws. Cars, tech, cash and holidays from £1." },
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
  const totals = COMPETITIONS.reduce(
    (acc, c) => {
      acc.sold += c.ticketsSold;
      acc.revenue += c.ticketsSold * c.pricePerTicket;
      acc.prizes += c.cashAlternative;
      return acc;
    },
    { sold: 0, revenue: 0, prizes: 0 },
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <LiveOddsTicker />

      {/* HERO */}
      <section className="relative bg-clover-pattern text-cream overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 md:pt-20 md:pb-24 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-background/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-cream/70">
              <Sparkles className="h-3 w-3 text-gold" /> The odds, out in the open
            </div>
            <h1 className="mt-5 font-display text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
              Real odds. Live draws.<br />
              <span className="text-clover">Someone's got to win it.</span>
            </h1>
            <p className="mt-5 text-cream/70 max-w-md text-base leading-relaxed">
              Cars, cash, tech and holidays. Every ticket count and every draw published in real time. Might as well be you.
            </p>

            {/* Featured comp mini card */}
            <div className="mt-6 rounded-md bg-background text-foreground p-4 max-w-md border border-cream/20">
              <div className="flex gap-3">
                <img src={featured.image} alt="" className="h-20 w-20 rounded object-cover" width={80} height={80} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">{featured.category}</div>
                  <div className="font-display text-base leading-tight truncate">{featured.title}</div>
                  <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full shimmer" style={{ width: `${featuredPct}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] font-mono tabular-nums flex justify-between">
                    <span>{featured.ticketsSold.toLocaleString()} / {featured.totalTickets.toLocaleString()}</span>
                    <span className="text-clover">{featuredPct}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">From</div>
                  <div className="font-mono font-medium text-xl leading-none tabular-nums">{gbp(featured.pricePerTicket)}</div>
                </div>
                <Countdown target={featured.endsAt} compact />
                <Button asChild variant="git" size="lg" className="ml-auto">
                  <Link to="/competitions/$slug" params={{ slug: featured.slug }}>
                    Enter <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-5 flex gap-1.5">
              {hero.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Show featured ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`h-1 rounded-full transition-all ${i === active ? "w-8 bg-clover" : "w-4 bg-background/25"}`}
                />
              ))}
            </div>
          </div>

          {/* Live stats panel */}
          <div className="relative hidden md:block">
            <div className="rounded-md border border-cream/10 bg-background/[0.03] backdrop-blur p-6">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-cream/50">Platform stats · Live</div>
                <LuckyMark className="h-8 w-8" />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/50">Tickets sold</dt>
                  <dd className="mt-1 font-mono tabular-nums text-3xl text-cream">{totals.sold.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/50">Prizes in play</dt>
                  <dd className="mt-1 font-mono tabular-nums text-3xl text-gold">{gbp(totals.prizes)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/50">Live comps</dt>
                  <dd className="mt-1 font-mono tabular-nums text-3xl text-cream">{COMPETITIONS.length.toString().padStart(2, "0")}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/50">Draws streamed</dt>
                  <dd className="mt-1 font-mono tabular-nums text-3xl text-cream">100%</dd>
                </div>
              </dl>
              <div className="mt-6 pt-4 border-t border-cream/10 text-[11px] font-mono text-cream/50 leading-relaxed">
                Every draw is streamed live. Every ticket number is published. No hidden reserves, no house tickets.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-b border-white/10 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[
            { i: Radio, t: "Every draw streamed live" },
            { i: Shield, t: "Verified winners, real people" },
            { i: MessageSquareHeart, t: "UK company, UK support" },
            { i: Ticket, t: "Free postal entry always" },
          ].map(({ i: Icon, t }) => (
            <div key={t} className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-sm bg-clover/10 text-clover flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium text-foreground/80">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE COMPETITIONS GRID */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover mb-2">Live · {COMPETITIONS.length.toString().padStart(2, "0")}</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Competitions</h2>
            <p className="text-muted-foreground text-sm mt-1">Every ticket accounted for, every close time public.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-md border border-white/15 bg-card px-3 py-2 text-sm font-medium focus:outline-none focus:border-clover"
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
              className={`shrink-0 rounded-md px-3.5 py-1.5 text-sm font-medium border transition-colors ${
                cat === c ? "bg-ink text-cream border-white/10" : "bg-card text-foreground/70 border-white/15 hover:border-white/40"
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
      <section className="mx-auto max-w-7xl px-4 mt-24 w-full">
        <div className="rounded-md bg-card border border-white/10 p-8 md:p-12">
          <div className="text-center">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover">How it works</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold tracking-tight">Three steps. One of them's paying us.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Pick your tickets", d: "Lucky Dip or pick your own numbers. From £1 a go." },
              { n: "02", t: "Answer the question", d: "One quick skill question to keep it above board." },
              { n: "03", t: "We draw it live", d: "Live-streamed random draw. Winners paid within 48 hours." },
            ].map((s) => (
              <div key={s.n} className="rounded-md border border-white/10 p-6">
                <div className="font-mono text-[11px] tracking-[0.25em] text-clover">STEP {s.n}</div>
                <h3 className="mt-3 font-display text-xl font-semibold">{s.t}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WINNERS WALL */}
      <section className="mx-auto max-w-7xl px-4 mt-24 w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover mb-2">Winners · Verified</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Recent winners</h2>
            <p className="text-muted-foreground mt-1">Real people. Real prizes. Real handshakes.</p>
          </div>
          <Link to="/winners" className="text-sm font-semibold text-clover hover:underline">See all winners →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WINNERS.slice(0, 3).map((w) => (
            <div key={w.name + w.prize} className="rounded-md bg-card p-5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-sm bg-ink text-cream flex items-center justify-center font-display text-lg font-semibold">
                  {w.name[0]}
                </div>
                <div>
                  <div className="font-semibold">{w.name} <span className="text-muted-foreground font-normal">from {w.town}</span></div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{w.when}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Prize</div>
                <div className="font-medium text-foreground">{w.prize}</div>
              </div>
              <p className="mt-3 text-sm text-foreground/70 leading-relaxed">"{w.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-7xl px-4 mt-24 w-full">
        <div className="rounded-md bg-ink text-cream p-8 md:p-12 relative overflow-hidden border border-white/10">
          <div className="absolute top-6 right-6 opacity-30">
            <LuckyMark className="h-20 w-20" />
          </div>
          <div className="relative max-w-xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover">New comps · Weekly</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold tracking-tight">New comps in your inbox. Not the boring kind.</h2>
            <p className="mt-3 text-cream/60 leading-relaxed">One email a week, tops. Unsubscribe with one click.</p>
            <form className="mt-6 flex gap-2 flex-col sm:flex-row" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="you@somewhere.co.uk"
                className="flex-1 rounded-md bg-background/5 border border-cream/15 px-4 py-3 text-cream placeholder:text-cream/40 focus:outline-none focus:border-clover"
              />
              <Button variant="git" size="lg" type="submit">Sign me up</Button>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
