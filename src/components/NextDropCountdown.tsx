import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock, Bell } from "lucide-react";
import { dropScheduleQuery, nextDropAt, scheduleSummary } from "@/lib/drop-schedule";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function fmt(ms: number) {
  if (ms <= 0) return "00d 00:00:00";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d)}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function NextDropCountdown() {
  const { data: schedule } = useQuery(dropScheduleQuery);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  if (!schedule) return null;
  const next = nextDropAt(schedule, new Date(now));
  if (!next) return null;
  const remaining = next.getTime() - now;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    const { error } = await supabase.from("drop_subscribers").insert({ email: email.trim() });
    setSubscribing(false);
    if (error && !/duplicate/i.test(error.message)) {
      toast.error("Couldn't sign you up — try again in a bit.");
      return;
    }
    setEmail("");
    toast.success("You're on the list. We'll ping you before each drop.");
  };

  return (
    <section aria-labelledby="next-drop-heading" className="mx-auto max-w-7xl px-4 mt-10 w-full">
      <div className="rounded-lg border border-border bg-card p-5 md:p-6 shadow-sm grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-md bg-clover/10 text-clover grid place-items-center shrink-0">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <div id="next-drop-heading" className="text-[10px] font-mono uppercase tracking-[0.25em] text-clover font-bold">Next drop</div>
            <div data-dynamic="countdown" className="font-display text-xl md:text-2xl font-black tracking-tight tabular-nums">{fmt(remaining)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Drops on {scheduleSummary(schedule)}</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground md:pl-4 md:border-l md:border-border">
          New comps land on a set weekly schedule. Bookmark the site, or —
        </p>
        <form onSubmit={handleSubscribe} className="flex gap-2 md:justify-end">
          <label className="sr-only" htmlFor="drop-notify-email">Email for drop reminders</label>
          <input
            id="drop-notify-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@somewhere.co.uk"
            className="flex-1 md:w-56 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-clover"
          />
          <button
            type="submit"
            disabled={subscribing}
            className="inline-flex items-center gap-1.5 rounded-md bg-clover text-primary-foreground px-3 py-2 text-xs font-display font-extrabold uppercase tracking-wider hover:bg-clover-deep disabled:opacity-60"
          >
            <Bell className="h-3.5 w-3.5" /> Notify me
          </button>
        </form>
      </div>
      <p className="mt-2 text-xs text-muted-foreground text-center md:text-right">
        One quick reminder before each drop. No spam. <Link to="/promise" className="text-clover font-semibold hover:underline">Why the fixed schedule?</Link>
      </p>
    </section>
  );
}