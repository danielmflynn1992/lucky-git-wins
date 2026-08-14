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

    // Compliance gate: a competition may only go live with every required field
    // present. This is enforced here regardless of what the UI allowed.
    if (data.status === "live") {
      const missing: string[] = [];
      if (!data.image.trim()) missing.push("cover image");
      if (!(data.cashAlternative > 0)) missing.push("cash alternative");
      if (!data.endsAt) missing.push("closing date");
      if (new Date(data.endsAt).getTime() <= Date.now()) missing.push("closing date in the future");
      if (data.title.trim().length < 2) missing.push("prize title");
      if (data.description.trim().length < 20) missing.push("prize description (20+ characters)");
      if (missing.length) {
        throw new Error(`Cannot publish live — missing: ${missing.join(", ")}.`);
      }
    }

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
  body?: string;
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


// --- Notification delivery (Resend) -----------------------------------------

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

function emailSendingConfigured() {
  return Boolean(process.env["LOVABLE_API_KEY"] && process.env["RESEND_API_KEY"]);
}

/**
 * Whether the outbox can actually send. Admin needs this loudly: a queue that
 * quietly fills up is a winner who never hears from us.
 */
export const getEmailConfigStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("draw_notifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "queued");
    const configured = emailSendingConfigured();
    // Auto-flush: the moment sending becomes possible, the backlog goes out
    // without an admin having to remember to press a button.
    if (configured && (count ?? 0) > 0) {
      const res = await drain(null);
      return { configured, queued: Math.max(0, (count ?? 0) - res.sent), autoFlushed: res.sent };
    }
    return { configured, queued: count ?? 0, autoFlushed: 0 };
  });

async function deliver(row: { id: string; recipient: string; subject: string; body: string }) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) {
    return { ok: false, detail: "Email sending is not configured — connect Resend to drain the queue." };
  }
  if (!row.recipient.includes("@")) {
    return { ok: false, detail: `No deliverable address (${row.recipient}).` };
  }
  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: "Lucky Git Comps <onboarding@resend.dev>",
        to: [row.recipient],
        subject: row.subject,
        text: row.body,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, detail: `Resend ${res.status}: ${text.slice(0, 300)}` };
    }
    return { ok: true, detail: null as string | null };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : "Unknown send failure" };
  }
}

async function drain(ids: string[] | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let q = supabaseAdmin
    .from("draw_notifications")
    .select("id, recipient, subject, body, status");
  q = ids ? q.in("id", ids) : q.eq("status", "queued");
  const { data, error } = await q.limit(25);
  if (error) throw new Error(error.message);

  if (!emailSendingConfigured()) {
    // Leave rows queued — they must flush automatically once a domain/key is
    // configured, not be buried as permanent failures.
    return { sent: 0, failed: 0, blocked: (data ?? []).length, configured: false };
  }

  let sent = 0;
  let failed = 0;
  for (const row of (data ?? []) as Array<{ id: string; recipient: string; subject: string; body: string }>) {
    const result = await deliver(row);
    await supabaseAdmin
      .from("draw_notifications")
      .update({
        status: result.ok ? "sent" : "failed",
        detail: result.detail,
        sent_at: result.ok ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
    if (result.ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed, blocked: 0, configured: true };
}

/** Attempt delivery of every queued notification. */
export const sendQueuedNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    return drain(null);
  });

/** Retry a single failed notification. */
export const retryNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    return drain([data.id]);
  });

/**
 * Launch scan: the handful of things that quietly break trust if they drift.
 * Every check is computed on the server from live data, never asserted by hand.
 */
export const getScanCheck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;

    const [comps, draws] = await Promise.all([
      sb.from("competitions").select("id,slug,title,total_tickets,status,ends_at,is_demo,question_id,seed_hash"),
      sb.from("draws").select("id,competition_id,is_demo,drawn_at,drew_from"),
    ]);
    if (comps.error) throw new Error(comps.error.message);
    if (draws.error) throw new Error(draws.error.message);

    const now = Date.now();
    const c = comps.data ?? [];
    const d = draws.data ?? [];
    const drawnIds = new Set(d.map((r: { competition_id: string | null }) => r.competition_id));

    const overCap = c.filter((r: { total_tickets: number }) => r.total_tickets > 499);
    const noQuestion = c.filter((r: { question_id: string | null; status: string }) => r.status !== "drawn" && !r.question_id);
    const noSeed = c.filter((r: { seed_hash: string | null }) => !r.seed_hash);
    const overdue = c.filter(
      (r: { status: string; ends_at: string; id: string }) =>
        r.status === "live" && new Date(r.ends_at).getTime() < now - 10 * 60 * 1000 && !drawnIds.has(r.id),
    );

    const checks = [
      { label: "No pool exceeds the 499 cap", ok: overCap.length === 0, detail: overCap.map((r: { slug: string }) => r.slug).join(", ") },
      { label: "Every open competition has a skill question", ok: noQuestion.length === 0, detail: noQuestion.map((r: { slug: string }) => r.slug).join(", ") },
      { label: "Every competition has a committed seed hash", ok: noSeed.length === 0, detail: noSeed.map((r: { slug: string }) => r.slug).join(", ") },
      { label: "No closed competition is more than 10 minutes undrawn", ok: overdue.length === 0, detail: overdue.map((r: { title: string }) => r.title).join(", ") },
    ];

    return {
      checks,
      counts: {
        competitions: c.length,
        realCompetitions: c.filter((r: { is_demo: boolean }) => !r.is_demo).length,
        exampleCompetitions: c.filter((r: { is_demo: boolean }) => r.is_demo).length,
        draws: d.length,
        realDraws: d.filter((r: { is_demo: boolean }) => !r.is_demo).length,
        exampleDraws: d.filter((r: { is_demo: boolean }) => r.is_demo).length,
        fallbackDraws: d.filter((r: { drew_from: string | null }) => r.drew_from && r.drew_from !== "qualifying").length,
      },
    };
  });
