import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Ticket, Shield, Radio, MessageSquareHeart } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CompCard } from "@/components/CompCard";
import { CompRow } from "@/components/CompRow";
import { ViewToggle } from "@/routes/competitions.index";
import { Countdown } from "@/components/Countdown";
import { Lockup } from "@/components/Logo";
import { Pinstripe } from "@/components/Pinstripe";
import { Marker } from "@/components/Marker";
import { Perforation } from "@/components/Perforation";
import { COMPETITIONS, CATEGORIES, WINNERS, type Category } from "@/lib/mock-comps";
import { gbp } from "@/lib/format";
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
  const [view, setView] = useState<"grid" | "list">("grid");

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

      {/* HERO — pools-coupon masthead */}
      <section className="halftone relative overflow-hidden rule-heavy border-b-[3px] border-[var(--color-ink-black)]">
        <div className="mx-auto max-w-7xl px-4 pt-4 pb-16 md:pt-8 md:pb-24">
          <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h1
              className="misreg font-display uppercase leading-[0.9] tracking-[0.01em] text-foreground"
              style={{ fontSize: "clamp(2.75rem, 9vw, 6rem)" }}
            >
              Real odds.<br />
              Automatic draws.
            </h1>
            <p className="mt-5 text-muted-foreground max-w-md text-base leading-relaxed">
              <Marker><span className="text-foreground font-bold">Might as well be you.</span></Marker> Cars, cash, tech and holidays. Every ticket counted, every draw published. No smoke, no mirrors, no bloke pulling names out of a hat in a back room.
            </p>

            {/* Featured comp mini card */}
            <div className="mt-6 rounded-lg bg-card border border-border text-foreground p-4 max-w-md shadow-md">
              <div className="flex gap-3">
                <img src={featured.image} alt="" className="h-20 w-20 rounded-md object-cover" width={80} height={80} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">{featured.category}</div>
                  <div className="font-display text-base font-bold leading-tight truncate">{featured.title}</div>
                  <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full shimmer" style={{ width: `${featuredPct}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] font-mono tabular-nums flex justify-between">
                    <span className="text-muted-foreground">{featured.ticketsSold.toLocaleString()} / {featured.totalTickets.toLocaleString()}</span>
                    <span className="text-clover font-bold">{featuredPct}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">From</div>
                  <div className="font-display font-black text-2xl leading-none tabular-nums">{gbp(featured.pricePerTicket)}</div>
                </div>
                <Countdown target={featured.endsAt} compact />
                <Button asChild variant="git" size="lg" className="ml-auto">
                  <Link to="/competitions/$slug" params={{ slug: featured.slug }}>
                    Enter Now <ChevronRight className="h-4 w-4" />
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
                  className={`h-1.5 rounded-full transition-all ${i === active ? "w-8 bg-clover" : "w-4 bg-border"}`}
                />
              ))}
            </div>
          </div>

          {/* Live stats panel */}
          <div className="relative hidden md:block">
            <div className="rounded-lg bg-card border border-border p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Platform stats · Live</div>
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Tickets flogged</dt>
                  <dd className="mt-1 font-display font-black tabular-nums text-3xl text-foreground">{totals.sold.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Prizes in play</dt>
                  <dd className="mt-1 font-display font-black tabular-nums text-3xl text-clover">{gbp(totals.prizes)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Live comps</dt>
                  <dd className="mt-1 font-display font-black tabular-nums text-3xl text-foreground">{COMPETITIONS.length.toString().padStart(2, "0")}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Draws published</dt>
                  <dd className="mt-1 font-display font-black tabular-nums text-3xl text-foreground">100%</dd>
                </div>
              </dl>
              <div className="mt-6 pt-4 border-t border-border text-[11px] font-mono text-muted-foreground leading-relaxed">
                Every draw automatic. Every ticket number published. No hidden reserves, no house tickets, no funny business.
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <Perforation color="var(--color-ink-black)" className="text-transparent" />

      {/* TRUST STRIP */}
      <section className="border-y-[1.5px] border-[var(--color-ink-black)] bg-[var(--color-paper-raised)]">
        <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[
            { i: Radio, t: "Automatic random draws" },
            { i: Shield, t: "Verified winners, real handshakes" },
            { i: MessageSquareHeart, t: "UK company, UK humans on support" },
            { i: Ticket, t: "Every ticket number published" },
          ].map(({ i: Icon, t }) => (
            <div key={t} className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-md bg-clover/10 text-clover flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-semibold text-foreground/85">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE COMPETITIONS GRID */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover mb-2 font-bold">Live · {COMPETITIONS.length.toString().padStart(2, "0")}</div>
            <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight text-foreground">Competitions</h2>
            <p className="text-muted-foreground text-sm mt-1">Every ticket accounted for, every close time public.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ViewToggle view={view} onChange={setView} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:border-clover"
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
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors ${
                cat === c ? "bg-ink text-cream border-ink" : "bg-card text-foreground/70 border-border hover:border-foreground/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {view === "grid" ? (
          <div className="stall-grid mt-6 grid gap-3 sm:gap-5 grid-cols-2 md:grid-cols-3 items-stretch">
            {filtered.map((c) => (
              <div key={c.slug} className="rise-in h-full">
                <CompCard c={c} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            {filtered.map((c) => (
              <div key={c.slug} className="rise-in">
                <CompRow c={c} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mx-auto max-w-7xl px-4"><Pinstripe /></div>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 mt-24 w-full">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover font-bold">How it works</div>
          <h2 className="mt-2 font-display text-3xl md:text-5xl font-black tracking-[-0.02em] text-foreground">Three steps. One of them's paying us.</h2>
        </div>
        {/* Bento box */}
        <div className="mt-8 grid gap-4 md:grid-cols-6 md:grid-rows-2 md:auto-rows-fr">
          <div className="md:col-span-3 md:row-span-2 rounded-lg bg-card border border-border p-8 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="font-mono text-[11px] tracking-[0.25em] text-clover font-bold">STEP 01</div>
            <h3 className="mt-4 font-display text-3xl md:text-4xl font-black tracking-tight text-foreground">Pick your tickets.</h3>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed max-w-md">
              Lucky Dip if you can't be bothered, or hand-pick your numbers like it matters. From a quid a go. Grid updates live so you can't nick a number someone else already has.
            </p>
            <div className="mt-6 font-mono text-xs tabular-nums text-muted-foreground">
              <span className="text-clover">$</span> ./enter --qty 10 --lucky-dip
            </div>
          </div>
          <div className="md:col-span-3 rounded-lg bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="font-mono text-[11px] tracking-[0.25em] text-clover font-bold">STEP 02</div>
            <h3 className="mt-3 font-display text-xl font-black text-foreground">Checkout, sorted.</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">No dead comps, no rollovers. Every draw is fully automatic and verifiable.</p>
          </div>
          <div className="md:col-span-3 rounded-lg bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="font-mono text-[11px] tracking-[0.25em] text-clover font-bold">STEP 03</div>
            <h3 className="mt-3 font-display text-xl font-black text-foreground">Draw goes off automatically.</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Timer hits zero. Random number picked. Winner named on the wall within minutes. Paid within 48 hours.</p>
          </div>
        </div>
      </section>

      {/* WINNERS WALL */}
      <section className="mx-auto max-w-7xl px-4 mt-24 w-full">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover mb-2 font-bold">Winners · Verified</div>
            <h2 className="font-display text-3xl md:text-5xl font-black tracking-[-0.02em] text-foreground">Smug Gits.</h2>
            <p className="text-muted-foreground mt-1">Real people who won real things. Try not to hate them.</p>
          </div>
          <Link to="/winners" className="text-sm font-bold text-clover hover:underline">Smug Gits (Our Winners) →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WINNERS.slice(0, 3).map((w) => (
            <div key={w.name + w.prize} className="rounded-lg bg-card border border-border p-5 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-md bg-ink text-cream flex items-center justify-center font-display text-lg font-black">
                  {w.name[0]}
                </div>
                <div>
                  <div className="font-bold text-foreground">{w.name} <span className="text-muted-foreground font-normal">from {w.town}</span></div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{w.when}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Prize</div>
                <div className="font-bold text-foreground">{w.prize}</div>
              </div>
              <p className="mt-4 italic font-sans text-lg text-foreground/80 leading-snug">"{w.quote}"</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4"><Pinstripe /></div>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-7xl px-4 mt-24 w-full">
        <div className="rounded-lg bg-ink text-cream p-8 md:p-12 relative overflow-hidden">
          <div className="relative max-w-xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover font-bold">New comps · Weekly</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-black tracking-[-0.02em]">Give us your email.</h2>
            <p className="mt-3 text-cream/60 leading-relaxed">We promise not to spam you with rubbish — just the good stuff. One email a week, tops. Unsubscribe with one click, no hard feelings.</p>
            <form className="mt-6 flex gap-2 flex-col sm:flex-row" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="you@somewhere.co.uk"
                className="flex-1 rounded-md bg-background/40 border border-cream/15 px-4 py-3 text-cream placeholder:text-cream/70 focus:outline-none focus:border-clover"
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
