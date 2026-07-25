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
    <div className="min-h-screen flex flex-col bg-ambient">
      <SiteNav />
      <LiveOddsTicker />

      {/* HERO */}
      <section className="relative text-cream overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 md:pt-20 md:pb-24 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cream/15 bg-background/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-cream/70">
              <Sparkles className="h-3 w-3 text-gold" /> The odds, out in the open
            </div>
            <h1 className="mt-5 font-display text-5xl md:text-7xl lg:text-[5.5rem] font-semibold leading-[0.95] tracking-[-0.035em]">
              <span className="text-gradient-mint">Real odds.</span><br />
              <span className="text-gradient-mint">Automatic draws.</span><br />
              <span className="text-clover">Might as well be you.</span>
            </h1>
            <p className="mt-5 text-cream/70 max-w-md text-base leading-relaxed">
              Cars, cash, tech and holidays. Every ticket counted, every draw published. No smoke, no mirrors, no bloke pulling names out of a hat in a back room.
            </p>

            {/* Featured comp mini card */}
            <div className="mt-6 rounded-xl glass text-foreground p-4 max-w-md">
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
                    Have a go <ChevronRight className="h-4 w-4" />
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
            <div className="rounded-xl glass p-6 hover:border-clover/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-cream/50">Platform stats · Live</div>
                <LuckyMark className="h-8 w-8" />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/50">Tickets flogged</dt>
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
                  <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/50">Draws published</dt>
                  <dd className="mt-1 font-mono tabular-nums text-3xl text-cream">100%</dd>
                </div>
              </dl>
              <div className="mt-6 pt-4 border-t border-cream/10 text-[11px] font-mono text-cream/50 leading-relaxed">
                Every draw automatic. Every ticket number published. No hidden reserves, no house tickets, no funny business.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-white/10 glass">
        <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[
            { i: Radio, t: "Automatic random draws" },
            { i: Shield, t: "Verified winners, real handshakes" },
            { i: MessageSquareHeart, t: "UK company, UK humans on support" },
            { i: Ticket, t: "Every ticket number published" },
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
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover">How it works</div>
          <h2 className="mt-2 font-display text-3xl md:text-5xl font-semibold tracking-[-0.02em]">Three steps. One of them's paying us.</h2>
        </div>
        {/* Bento box */}
        <div className="mt-8 grid gap-4 md:grid-cols-6 md:grid-rows-2 md:auto-rows-fr">
          <div className="md:col-span-3 md:row-span-2 rounded-2xl glass p-8 group hover:border-clover/40 hover:shadow-[0_0_50px_-16px_rgba(0,223,129,0.4)] transition-all duration-300">
            <div className="font-mono text-[11px] tracking-[0.25em] text-clover">STEP 01</div>
            <h3 className="mt-4 font-display text-3xl md:text-4xl font-semibold tracking-tight">Pick your tickets.</h3>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed max-w-md">
              Lucky Dip if you can't be bothered, or hand-pick your numbers like it matters. From a quid a go. Grid updates live so you can't nick a number someone else already has.
            </p>
            <div className="mt-6 font-mono text-xs tabular-nums text-cream/40">
              <span className="text-clover">$</span> ./enter --qty 10 --lucky-dip
            </div>
          </div>
          <div className="md:col-span-3 rounded-2xl glass p-6 hover:border-clover/40 transition-all duration-300">
            <div className="font-mono text-[11px] tracking-[0.25em] text-clover">STEP 02</div>
            <h3 className="mt-3 font-display text-xl font-semibold">Answer the question.</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">One multiple-choice skill question. Genuinely answerable — we're not trying to be clever.</p>
          </div>
          <div className="md:col-span-3 rounded-2xl glass p-6 hover:border-clover/40 transition-all duration-300">
            <div className="font-mono text-[11px] tracking-[0.25em] text-clover">STEP 03</div>
            <h3 className="mt-3 font-display text-xl font-semibold">Draw goes off automatically.</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Timer hits zero. Random number picked. Winner named on the wall within minutes. Paid within 48 hours.</p>
          </div>
        </div>
      </section>

      {/* WINNERS WALL */}
      <section className="mx-auto max-w-7xl px-4 mt-24 w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover mb-2">Winners · Verified</div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-[-0.02em]">Smug Gits.</h2>
            <p className="text-muted-foreground mt-1">Real people who won real things. Try not to hate them.</p>
          </div>
          <Link to="/winners" className="text-sm font-semibold text-clover hover:underline">Smug Gits (Our Winners) →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WINNERS.slice(0, 3).map((w) => (
            <div key={w.name + w.prize} className="rounded-xl glass p-5 hover:border-clover/40 hover:shadow-[0_0_40px_-16px_rgba(0,223,129,0.35)] transition-all duration-300">
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
              <p className="mt-4 font-serif italic text-lg text-foreground/85 leading-snug">"{w.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-7xl px-4 mt-24 w-full">
        <div className="rounded-2xl glass text-cream p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-6 right-6 opacity-30">
            <LuckyMark className="h-20 w-20" />
          </div>
          <div className="relative max-w-xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover">New comps · Weekly</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold tracking-[-0.02em]">Give us your email.</h2>
            <p className="mt-3 text-cream/60 leading-relaxed">We promise not to spam you with rubbish — just the good stuff. One email a week, tops. Unsubscribe with one click, no hard feelings.</p>
            <form className="mt-6 flex gap-2 flex-col sm:flex-row" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="you@somewhere.co.uk"
                className="flex-1 rounded-md bg-background/40 border border-cream/15 px-4 py-3 text-cream placeholder:text-cream/40 focus:outline-none focus:border-clover"
              />
              <Button variant="git" size="lg" type="submit">Go on then</Button>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
