import { createFileRoute, Link } from "@tanstack/react-router";
import { ukDateTime } from "@/lib/format";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { listFreeEntries, logFreeEntry, freeEntryStats, setFreeEntryConfig } from "@/lib/free-entry.functions";
import { ArrowLeft, Loader2, Mail, Stamp } from "lucide-react";

export const Route = createFileRoute("/admin/free-entries")({
  head: () => ({
    meta: [
      { title: "Free entries — Lucky Git Admin" },
      { name: "description", content: "Log postal and email free entries and review claimed capacity." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FreeEntries,
});

const STATUS_LABEL: Record<string, string> = {
  logged: "Logged — in the draw",
  declined_full: "Declined — fully claimed",
  declined_late: "Declined — after cut-off",
  declined_wrong_answer: "Declined — answer wrong",
  declined_duplicate: "Declined — already entered",
  declined_frequency_cap: "Declined — one per 30 days",
};

interface CompOption {
  id: string;
  title: string;
  status: string;
  free_entry_slots: number;
  free_slots_claimed: number;
  postal_cutoff_at: string | null;
  email_cutoff_at: string | null;
}

function FreeEntries() {
  const qc = useQueryClient();
  const log = useServerFn(logFreeEntry);
  const list = useServerFn(listFreeEntries);
  const stats = useServerFn(freeEntryStats);
  const saveConfig = useServerFn(setFreeEntryConfig);

  const comps = useQuery({
    queryKey: ["admin", "free-entry-comps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, status, free_entry_slots, free_slots_claimed, postal_cutoff_at, email_cutoff_at")
        .order("ends_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CompOption[];
    },
  });

  const entries = useQuery({
    queryKey: ["admin", "free-entries"],
    queryFn: () => list({ data: undefined }),
  });

  const report = useQuery({
    queryKey: ["admin", "free-entry-stats"],
    queryFn: () => stats({ data: undefined }),
  });

  const [form, setForm] = useState({
    competitionId: "",
    name: "",
    address: "",
    dob: "",
    email: "",
    phone: "",
    answer: "",
    route: "post" as "post" | "email",
    receivedAt: new Date().toISOString().slice(0, 16),
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selected = comps.data?.find((c) => c.id === form.competitionId) ?? null;

  const submit = useMutation({
    mutationFn: () => log({ data: form }),
    onSuccess: (res) => {
      if (res.status === "logged") toast.success(`Logged — ticket #${res.ticket_number}. Confirmation queued.`);
      else toast.warning(`${STATUS_LABEL[res.status] ?? res.status}. Explanation email queued.`);
      setForm((f) => ({ ...f, name: "", address: "", dob: "", email: "", phone: "", answer: "" }));
      qc.invalidateQueries({ queryKey: ["admin", "free-entries"] });
      qc.invalidateQueries({ queryKey: ["admin", "free-entry-comps"] });
      qc.invalidateQueries({ queryKey: ["admin", "free-entry-stats"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Could not log that entry"),
  });

  const config = useMutation({
    mutationFn: (v: { competitionId: string; slots: number; postalCutoff?: string; emailCutoff?: string }) =>
      saveConfig({ data: v }),
    onSuccess: () => {
      toast.success("Free entry settings saved.");
      qc.invalidateQueries({ queryKey: ["admin", "free-entry-comps"] });
      qc.invalidateQueries({ queryKey: ["admin", "free-entry-stats"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const [filter, setFilter] = useState({ competition: "", route: "", status: "" });
  const filtered = useMemo(
    () =>
      (entries.data ?? []).filter(
        (r) =>
          (!filter.competition || r.competition_id === filter.competition) &&
          (!filter.route || r.route === filter.route) &&
          (!filter.status || r.status === filter.status),
      ),
    [entries.data, filter],
  );

  const field = "w-full h-10 rounded-md border-2 border-border bg-background px-3 text-sm";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 py-6 w-full flex-1">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm underline">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="mt-3 font-display text-3xl font-black">Free entries</h1>
        <p className="text-sm text-muted-foreground">
          Post and email entries, logged by hand in receipt order. Every outcome emails the entrant.
        </p>

        <section className="mt-6 rounded-2xl border-2 border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold">Log an entry</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wider">
              Competition
              <select className={field} value={form.competitionId} onChange={(e) => set("competitionId", e.target.value)}>
                <option value="">Choose…</option>
                {(comps.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {c.free_slots_claimed}/{c.free_entry_slots} claimed
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">
              Route
              <select className={field} value={form.route} onChange={(e) => set("route", e.target.value)}>
                <option value="post">Post</option>
                <option value="email">Email</option>
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">
              Received at
              <input type="datetime-local" className={field} value={form.receivedAt} onChange={(e) => set("receivedAt", e.target.value)} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">
              Name
              <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2">
              Address
              <input className={field} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">
              Date of birth
              <input type="date" className={field} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">
              Email
              <input className={field} value={form.email} onChange={(e) => set("email", e.target.value)} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">
              Phone
              <input className={field} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider">
              Submitted answer
              <input className={field} value={form.answer} onChange={(e) => set("answer", e.target.value)} />
            </label>
          </div>
          {selected && (
            <p className="mt-3 text-xs text-muted-foreground font-mono">
              Postal cut-off {selected.postal_cutoff_at ? ukDateTime(selected.postal_cutoff_at) : "—"} ·
              Email cut-off {selected.email_cutoff_at ? ukDateTime(selected.email_cutoff_at) : "—"}
            </p>
          )}
          <div className="mt-4">
            <Button
              variant="gold"
              size="lg"
              disabled={!form.competitionId || !form.name || !form.email || !form.dob || submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stamp className="h-4 w-4" />}
              Log entry
            </Button>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border-2 border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold">Reserved capacity</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-2">Competition</th>
                  <th className="p-2">Claimed / reserved</th>
                  <th className="p-2">Full</th>
                  <th className="p-2">Late</th>
                  <th className="p-2">Wrong</th>
                  <th className="p-2">Dupe</th>
                  <th className="p-2">30-day cap</th>
                  <th className="p-2">Slots</th>
                </tr>
              </thead>
              <tbody>
                {(report.data ?? []).map((r) => (
                  <tr key={r.competition_id} className="border-t border-border">
                    <td className="p-2">
                      {r.competition_title}
                      {r.is_demo && <span className="ml-1 text-[10px] uppercase text-muted-foreground">example</span>}
                    </td>
                    <td className="p-2 tabular-nums">{r.free_slots_claimed} / {r.free_entry_slots}</td>
                    <td className="p-2 tabular-nums">{r.declined_full}</td>
                    <td className="p-2 tabular-nums">{r.declined_late}</td>
                    <td className="p-2 tabular-nums">{r.declined_wrong_answer}</td>
                    <td className="p-2 tabular-nums">{r.declined_duplicate}</td>
                    <td className="p-2 tabular-nums">{r.declined_frequency_cap}</td>
                    <td className="p-2">
                      <SlotEditor
                        current={r.free_entry_slots}
                        onSave={(slots) => config.mutate({ competitionId: r.competition_id, slots })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border-2 border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-display text-lg font-bold">Logged entries</h2>
            <div className="flex gap-2 flex-wrap">
              <select className="h-9 rounded-md border-2 border-border bg-background px-2 text-xs" value={filter.competition} onChange={(e) => setFilter((f) => ({ ...f, competition: e.target.value }))}>
                <option value="">All competitions</option>
                {(comps.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <select className="h-9 rounded-md border-2 border-border bg-background px-2 text-xs" value={filter.route} onChange={(e) => setFilter((f) => ({ ...f, route: e.target.value }))}>
                <option value="">Any route</option>
                <option value="post">Post</option>
                <option value="email">Email</option>
              </select>
              <select className="h-9 rounded-md border-2 border-border bg-background px-2 text-xs" value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
                <option value="">Any status</option>
                {Object.keys(STATUS_LABEL).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {filtered.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nothing logged yet.</li>}
            {filtered.map((r) => (
              <li key={r.id} className="py-3 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1 text-xs font-mono uppercase text-muted-foreground">
                  {r.route === "post" ? <Stamp className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />} {r.route}
                </span>
                <b>{r.entrant_name}</b>
                <span className="text-muted-foreground">{r.entrant_email}</span>
                <span className="text-muted-foreground">{r.competition_title}</span>
                <span className="font-mono text-xs">{STATUS_LABEL[r.status] ?? r.status}</span>
                {r.assigned_ticket_number != null && <span className="font-mono text-xs">#{r.assigned_ticket_number}</span>}
                <span className="ml-auto text-[11px] text-muted-foreground font-mono">
                  {ukDateTime(r.received_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SlotEditor({ current, onSave }: { current: number; onSave: (slots: number) => void }) {
  const [v, setV] = useState(String(current));
  return (
    <div className="flex items-center gap-1">
      <input
        className="h-8 w-16 rounded-md border-2 border-border bg-background px-2 text-sm tabular-nums"
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <Button size="sm" variant="cream" disabled={Number(v) === current || !Number.isFinite(Number(v))} onClick={() => onSave(Number(v))}>
        Save
      </Button>
    </div>
  );
}
