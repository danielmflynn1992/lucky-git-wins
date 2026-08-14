import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const logInput = z.object({
  competitionId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(500).default(""),
  dob: z.string().min(4).max(20),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).default(""),
  answer: z.string().trim().max(200).default(""),
  route: z.enum(["post", "email"]),
  receivedAt: z.string().min(4),
});

export interface FreeEntryResult {
  id: string;
  status: string;
  ticket_number: number | null;
}

/** Staff logging of one postal/email free entry. All rules are enforced server-side. */
export const logFreeEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => logInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.rpc("admin_log_free_entry", {
      p_competition_id: data.competitionId,
      p_name: data.name,
      p_address: data.address,
      p_dob: data.dob,
      p_email: data.email,
      p_phone: data.phone,
      p_answer: data.answer,
      p_route: data.route,
      p_received_at: new Date(data.receivedAt).toISOString(),
    });
    if (error) throw new Error(error.message);
    return row as unknown as FreeEntryResult;
  });

export interface FreeEntryRow {
  id: string;
  competition_id: string;
  competition_title: string;
  entrant_name: string;
  entrant_email: string;
  route: string;
  status: string;
  assigned_ticket_number: number | null;
  received_at: string;
  logged_at: string;
  submitted_answer: string;
}

export const listFreeEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("admin_list_free_entries");
    if (error) throw new Error(error.message);
    return (data ?? []) as FreeEntryRow[];
  });

export interface FreeEntryStat {
  competition_id: string;
  competition_title: string;
  status: string;
  is_demo: boolean;
  free_entry_slots: number;
  free_slots_claimed: number;
  declined_full: number;
  declined_late: number;
  declined_wrong_answer: number;
  declined_duplicate: number;
  declined_frequency_cap: number;
}

export const freeEntryStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("admin_free_entry_stats");
    if (error) throw new Error(error.message);
    return (data ?? []) as FreeEntryStat[];
  });

const configInput = z.object({
  competitionId: z.string().uuid(),
  slots: z.number().int().min(0).max(100),
  postalCutoff: z.string().optional(),
  emailCutoff: z.string().optional(),
});

export const setFreeEntryConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => configInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_set_free_entry_config", {
      p_competition_id: data.competitionId,
      p_slots: data.slots,
      p_postal_cutoff: data.postalCutoff ? new Date(data.postalCutoff).toISOString() : (null as unknown as string),
      p_email_cutoff: data.emailCutoff ? new Date(data.emailCutoff).toISOString() : (null as unknown as string),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
