import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Rolling example tick. Draws any closed example competition through the real
 * pipeline and respawns the next one. Called by the scheduler every 15 minutes.
 */
export const Route = createFileRoute("/api/public/hooks/rolling-demo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
        const supplied = request.headers.get("apikey") ?? "";
        if (!key || supplied !== key) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
                headers.delete("Authorization");
              }
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });

        const { data, error } = await supabase.rpc("rolling_demo_tick");
        if (error) {
          console.error("[rolling-demo] tick failed", error.message);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ ok: true, result: data });
      },
    },
  },
});
