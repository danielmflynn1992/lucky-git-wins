import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const getIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { isAdmin: !!data, userId: context.userId };
  });

export const claimAdminIfEmpty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_admin_if_empty");
    if (error) throw new Error(error.message);
    return { claimed: !!data };
  });

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const createInput = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(80).optional().default(""),
  subtitle: z.string().max(200).optional().default(""),
  category: z.string().min(1).max(40),
  image: z.string().max(1024).optional().default(""),
  thumbUrl: z.string().max(1024).optional().default(""),
  supportingImages: z.array(z.string().max(1024)).max(5).optional().default([]),
  description: z.string().max(4000).optional().default(""),
  pricePerTicket: z.number().positive().max(10000),
  totalTickets: z.number().int().min(1).max(100000),
  cashAlternative: z.number().int().min(0).max(10000000),
  maxPerPerson: z.number().int().min(1).max(10000),
  endsAt: z.string().min(10),
  status: z.enum(["live", "draft", "paused"]),
  hot: z.boolean().default(false),
  questionId: z.string().uuid().optional(),
  letterboxStyle: z.enum(["solid", "gradient", "blur"]).default("blur"),
});

export const createCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const slug = slugify(data.slug || data.title);
    if (!slug) throw new Error("Could not derive a URL slug from the title.");

    const { data: existing } = await supabaseAdmin
      .from("competitions")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) throw new Error(`A competition with slug "${slug}" already exists.`);

    const endsAtIso = new Date(data.endsAt).toISOString();

    const { data: newId, error } = await context.supabase.rpc(
      "create_competition_with_tickets",
      {
        p_slug: slug,
        p_title: data.title,
        p_subtitle: data.subtitle,
        p_category: data.category,
        p_image: data.image,
        p_description: data.description,
        p_price_per_ticket: data.pricePerTicket,
        p_total_tickets: data.totalTickets,
        p_cash_alternative: data.cashAlternative,
        p_max_per_person: data.maxPerPerson,
        p_ends_at: endsAtIso,
        p_status: data.status,
        p_hot: data.hot,
        p_letterbox_style: data.letterboxStyle,
        p_thumb_url: data.thumbUrl || undefined,
        p_supporting_images: data.supportingImages ?? [],
        p_question_id: data.questionId,
      },
    );

    if (error) throw new Error(error.message);
    return { id: newId as string, slug };
  });

const drawInput = z.object({
  competitionId: z.string().uuid(),
  notes: z.string().max(500).optional().default(""),
});

export const drawCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => drawInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.rpc("draw_competition", {
      p_comp_id: data.competitionId,
      p_notes: data.notes ?? "",
    });
    if (error) throw new Error(error.message);
    return row as {
      id: string;
      competition_id: string;
      competition_title: string;
      winning_number: number;
      winner_display_name: string;
      total_tickets: number;
      verification_hash: string;
      drawn_at: string;
    };
  });

export const autoDrawExpired = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("auto_draw_expired");
    if (error) throw new Error(error.message);
    return { drawn: (data as unknown[])?.length ?? 0 };
  });
// --- Demo lifecycle controls -------------------------------------------------

const idInput = z.object({ competitionId: z.string().uuid() });

/** Bring a competition's close time forward to now, so the draw can be run. */
export const closeCompetitionNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.rpc("admin_close_competition_now", {
      p_id: data.competitionId,
    });
    if (error) throw new Error(error.message);
    return { closed: true };
  });

/** Close + draw the current rolling example, then spawn the next one. */
export const resetRollingDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase.rpc("admin_reset_rolling_demo");
    if (error) throw new Error(error.message);
    return data as { drawn: number; spawned: string | null; alerts: number };
  });

/** Kill switch for the daily example cycle. */
export const getDailyDemoEnabled = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "daily_demo")
      .maybeSingle();
    if (error) throw new Error(error.message);
    const value = (data?.value ?? {}) as { enabled?: boolean };
    return { enabled: value.enabled !== false };
  });

export const setDailyDemoEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ enabled: z.boolean() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.rpc("admin_set_daily_demo", {
      p_enabled: data.enabled,
    });
    if (error) throw new Error(error.message);
    return { enabled: data.enabled };
  });

export interface DrawNotification {
  id: string;
  competition_title: string;
  is_demo: boolean;
  recipient: string;
  subject: string;
  status: string;
  detail: string | null;
  created_at: string;
  sent_at: string | null;
}

/** Draw-complete notification outbox. Admin recipients only, by construction. */
export const listDrawNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("draw_notifications")
      .select("id, competition_title, is_demo, recipient, subject, status, detail, created_at, sent_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as DrawNotification[];
  });
