import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { COMPETITIONS } from "@/lib/mock-comps";
import { gbp, shortNumber } from "@/lib/format";
import { Copy, Plus, Play, Pause, Trophy, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Lucky Git Comps" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const totalRevenue = COMPETITIONS.reduce((s, c) => s + c.ticketsSold * c.pricePerTicket, 0);
  const totalTickets = COMPETITIONS.reduce((s, c) => s + c.ticketsSold, 0);
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 py-6 w-full flex-1">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-black">Admin</h1>
            <p className="text-muted-foreground text-sm">Run the shop.</p>
          </div>
          <Button asChild variant="gold" size="lg">
            <Link to="/admin/competitions/new"><Plus className="h-4 w-4" /> New competition</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Live competitions" value={COMPETITIONS.length.toString()} />
          <Stat label="Tickets sold" value={shortNumber(totalTickets)} />
          <Stat label="Revenue" value={gbp(totalRevenue)} accent />
        </div>

        <div className="mt-8 rounded-2xl bg-card border-2 border-border overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <h2 className="font-display text-lg font-bold">Competitions</h2>
            <div className="flex gap-2">
              <Button variant="cream" size="sm"><Pause className="h-3.5 w-3.5" /> Pause selected</Button>
              <Button variant="cream" size="sm"><Play className="h-3.5 w-3.5" /> Resume selected</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-3"><input type="checkbox" /></th>
                  <th className="p-3">Prize</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Sold</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3">Ends</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITIONS.map((c) => (
                  <tr key={c.slug} className="border-t border-border">
                    <td className="p-3"><input type="checkbox" /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={c.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <div className="font-semibold">{c.title}</div>
                      </div>
                    </td>
                    <td className="p-3">{c.category}</td>
                    <td className="p-3 tabular-nums">{shortNumber(c.ticketsSold)}/{shortNumber(c.totalTickets)}</td>
                    <td className="p-3 font-bold">{gbp(c.ticketsSold * c.pricePerTicket)}</td>
                    <td className="p-3 text-muted-foreground">{new Date(c.endsAt).toLocaleDateString("en-GB")}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button className="p-2 rounded-lg hover:bg-background" title="Duplicate"><Copy className="h-4 w-4" /></button>
                        <Link
                          to="/admin/competitions/$slug/skill"
                          params={{ slug: c.slug }}
                          className="p-2 rounded-lg hover:bg-background inline-flex"
                          title="Edit skill question"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </Link>
                        <button className="p-2 rounded-lg hover:bg-background" title="Draw winner"><Trophy className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 border-2 ${accent ? "bg-clover text-cream border-clover" : "bg-card border-border"}`}>
      <div className={`text-xs uppercase tracking-widest font-bold ${accent ? "text-cream/70" : "text-muted-foreground"}`}>{label}</div>
      <div className="font-display text-3xl font-black mt-1">{value}</div>
    </div>
  );
}