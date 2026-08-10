import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface PlayerLimits {
  user_id: string;
  monthly_cap_pence: number | null;
  pending_cap_pence: number | null;
  pending_cap_effective_at: string | null;
  cooloff_until: string | null;
  self_excluded_until: string | null;
  email_drop_reminders: boolean;
  email_draw_results: boolean;
}

export interface AnswerRecordRow {
  id: string;
  competition_id: string;
  competition_title: string | null;
  competition_slug: string | null;
  drawn: boolean;
  draw_id: string | null;
  raw_answer: string;
  answered_at: string;
  /** null whenever the competition has not been drawn — the server never sends it. */
  is_correct: boolean | null;
}

export interface PurchaseAllowance {
  allowed: boolean;
  reason: "self_excluded" | "cooloff" | "monthly_cap" | null;
  until?: string;
  cap_pence?: number | null;
  spent_pence?: number;
}

function unwrap<T>(data: unknown, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function fetchMyLimits(): Promise<PlayerLimits> {
  const { data, error } = await supabase.rpc("my_limits");
  return unwrap<PlayerLimits>(data, error);
}

export async function setMonthlyCap(pence: number | null): Promise<PlayerLimits> {
  const { data, error } = await supabase.rpc("set_monthly_cap", { p_pence: pence as number });
  return unwrap<PlayerLimits>(data, error);
}

export async function startCooloff(days: 7 | 30 | 90): Promise<PlayerLimits> {
  const { data, error } = await supabase.rpc("start_cooloff", { p_days: days });
  return unwrap<PlayerLimits>(data, error);
}

export async function selfExclude(months: number): Promise<PlayerLimits> {
  const { data, error } = await supabase.rpc("self_exclude", { p_months: months });
  return unwrap<PlayerLimits>(data, error);
}

export async function setEmailPrefs(dropReminders: boolean, drawResults: boolean): Promise<PlayerLimits> {
  const { data, error } = await supabase.rpc("set_email_prefs", {
    p_drop_reminders: dropReminders,
    p_draw_results: drawResults,
  });
  return unwrap<PlayerLimits>(data, error);
}

export async function fetchMyAnswers(): Promise<AnswerRecordRow[]> {
  const { data, error } = await supabase.rpc("my_entry_answers");
  return unwrap<AnswerRecordRow[]>(data ?? [], error);
}

export async function exportMyData(): Promise<Json> {
  const { data, error } = await supabase.rpc("export_my_data");
  return unwrap<Json>(data, error);
}

/**
 * Authoritative purchase gate. Cool-off, self-exclusion and the monthly cap are
 * all evaluated inside the database against auth.uid() — the client cannot skip
 * or fake the verdict.
 */
export async function checkPurchaseAllowed(amountPence: number): Promise<PurchaseAllowance> {
  const { data, error } = await supabase.rpc("purchase_allowance", { p_amount_pence: amountPence });
  if (error) throw new Error(error.message);
  return data as unknown as PurchaseAllowance;
}

export function limitBlockMessage(a: PurchaseAllowance): string | null {
  if (a.allowed) return null;
  if (a.reason === "self_excluded") {
    return "You're self-excluded until " + fmtDate(a.until) + ". We can't lift that early.";
  }
  if (a.reason === "cooloff") {
    return "You're on a break until " + fmtDate(a.until) + ". Buying is off until then.";
  }
  const cap = ((a.cap_pence ?? 0) / 100).toFixed(0);
  return `You set a £${cap}/month limit. It resets on the 1st.`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "the end of the period";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  });
}