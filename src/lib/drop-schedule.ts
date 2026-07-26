// Shared drop-schedule helpers. The schedule lives in Supabase (`site_settings`
// key `drop_schedule`) so admins can change it without a redeploy.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DropSchedule {
  /** ISO day-of-week (1=Mon … 7=Sun) that new comps drop on. */
  days: number[];
  hour: number;
  minute: number;
  tz: string;
}

export const DEFAULT_SCHEDULE: DropSchedule = {
  days: [1, 3, 5],
  hour: 20,
  minute: 0,
  tz: "Europe/London",
};

export async function fetchDropSchedule(): Promise<DropSchedule> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "drop_schedule")
    .maybeSingle();
  if (error) return DEFAULT_SCHEDULE;
  return (data?.value as DropSchedule | undefined) ?? DEFAULT_SCHEDULE;
}

export const dropScheduleQuery = queryOptions({
  queryKey: ["drop-schedule"],
  queryFn: fetchDropSchedule,
  staleTime: 5 * 60_000,
});

/** Next scheduled drop as a Date, computed in the visitor's local timezone.
 *  Good-enough approximation: we treat the configured hour/minute as local
 *  time. For a UK-only audience the difference vs Europe/London is at most
 *  one hour twice a year and doesn't affect the "next drop" checking habit. */
export function nextDropAt(schedule: DropSchedule, from: Date = new Date()): Date | null {
  if (!schedule.days.length) return null;
  for (let offset = 0; offset < 8; offset++) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(schedule.hour, schedule.minute, 0, 0);
    // Date#getDay is 0=Sun..6=Sat; convert to ISO 1=Mon..7=Sun
    const iso = ((candidate.getDay() + 6) % 7) + 1;
    if (!schedule.days.includes(iso)) continue;
    if (candidate.getTime() > from.getTime()) return candidate;
  }
  return null;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function scheduleSummary(s: DropSchedule): string {
  const days = s.days.slice().sort().map((d) => DAY_LABELS[d - 1]).join(", ");
  const h = String(s.hour).padStart(2, "0");
  const m = String(s.minute).padStart(2, "0");
  return `${days} · ${h}:${m} ${s.tz.replace("Europe/", "")}`;
}