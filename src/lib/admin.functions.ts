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
  image: z.string().max(400).optional().default(""),
  description: z.string().max(4000).optional().default(""),
  pricePerTicket: z.number().positive().max(10000),
  totalTickets: z.number().int().min(1).max(100000),
  cashAlternative: z.number().int().min(0).max(10000000),
  maxPerPerson: z.number().int().min(1).max(10000),
  endsAt: z.string().min(10),
  status: z.enum(["live", "draft", "paused"]),
  hot: z.boolean().default(false),
  skillQuestion: z.object({
    q: z.string().trim().min(3).max(300),
    options: z.array(z.string().trim().min(1).max(120)).length(4),
    correct: z.number().int().min(0).max(3),
  }),
  instantWin: z.boolean().default(false),
  instantWinCount: z.number().int().min(0).max(10000).default(0),
  instantWinPrize: z.number().min(0).max(1000000).default(0),
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

    const { data: newId, error } = await supabaseAdmin.rpc(
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
        p_skill_question: data.skillQuestion,
        p_instant_win: data.instantWin,
        p_instant_win_count: data.instantWin ? data.instantWinCount : 0,
        p_instant_win_prize: data.instantWin ? data.instantWinPrize : 0,
      },
    );

    if (error) throw new Error(error.message);
    return { id: newId as string, slug };
  });

const skillInput = z.object({
  slug: z.string().trim().min(1).max(80),
  skillQuestion: z.object({
    q: z.string().trim().min(3).max(300),
    options: z.array(z.string().trim().min(1).max(120)).length(4),
    correct: z.number().int().min(0).max(3),
  }),
});

export const updateSkillQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => skillInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("competitions")
      .update({ skill_question: data.skillQuestion })
      .eq("slug", data.slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });