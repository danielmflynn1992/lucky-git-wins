import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ukDateTime } from "@/lib/format";
import { gbp } from "@/lib/format";
import { ArrowLeft, Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Lucky Git Admin" },
      { name: "description", content: "Find guest and account orders by email address." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Orders,
});

interface OrderRow {
  id: string;
  order_ref: string;
  status: string;
  amount_pence: number;
  quantity: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  display_name: string | null;
  user_id: string | null;
  created_at: string;
  paid_at: string | null;
  competitions: { title: string } | null;
}

function Orders() {
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  const orders = useQuery({
    queryKey: ["admin", "orders", query],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select(
          "id, order_ref, status, amount_pence, quantity, contact_name, contact_email, contact_phone, display_name, user_id, created_at, paid_at, competitions(title)",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (query.trim()) q = q.ilike("contact_email", `%${query.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto max-w-5xl w-full px-4 py-10 flex-1">
        <Link to="/admin" className="text-xs inline-flex items-center gap-1 underline">
          <ArrowLeft className="h-3 w-3" /> Admin
        </Link>
        <h1 className="mt-3 font-display text-3xl font-black">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every entry, guest or account. Search by email to find a guest winner.
        </p>

        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(term);
          }}
        >
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="email address"
            className="flex-1 rounded-md border-2 border-border bg-background px-3 py-2 text-sm"
          />
          <Button type="submit"><Search className="h-4 w-4" /> Search</Button>
        </form>

        {orders.isPending ? (
          <div className="mt-8 flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : orders.error ? (
          <div className="mt-8 text-sm text-[color:var(--color-ink-red)]">{(orders.error as Error).message}</div>
        ) : (orders.data ?? []).length === 0 ? (
          <div className="mt-8 text-sm text-muted-foreground">No orders match that.</div>
        ) : (
          <div className="mt-6 overflow-x-auto border-2 border-border">
            <table className="w-full text-xs">
              <thead className="bg-card">
                <tr className="text-left">
                  <th className="p-2">Ref</th>
                  <th className="p-2">Competition</th>
                  <th className="p-2">Buyer</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Shown as</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Placed</th>
                </tr>
              </thead>
              <tbody>
                {(orders.data ?? []).map((o) => (
                  <tr key={o.id} className="border-t border-border align-top">
                    <td className="p-2 font-mono">{o.order_ref.slice(0, 8).toUpperCase()}</td>
                    <td className="p-2">{o.competitions?.title ?? "—"}</td>
                    <td className="p-2">{o.contact_name || "—"}{o.user_id ? "" : " (guest)"}</td>
                    <td className="p-2 break-all">{o.contact_email}</td>
                    <td className="p-2">{o.display_name || "Ticket holder"}</td>
                    <td className="p-2 tabular-nums">{o.quantity}</td>
                    <td className="p-2 tabular-nums">{gbp(o.amount_pence / 100)}</td>
                    <td className="p-2 font-bold uppercase">{o.status.replace("_", " ")}</td>
                    <td className="p-2 whitespace-nowrap">{ukDateTime(o.paid_at ?? o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
