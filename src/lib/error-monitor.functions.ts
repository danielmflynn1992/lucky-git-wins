import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const eventSchema = z.object({
  severity: z.enum(["error", "warning", "info"]).default("error"),
  kind: z.string().min(1).max(40),
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  route: z.string().max(300).optional(),
  userAgent: z.string().max(400).optional(),
  viewport: z.string().max(40).optional(),
  extra: z.record(z.string(), z.any()).optional(),
  fingerprint: z.string().min(1).max(128),
});

const inputSchema = z.object({
  events: z.array(eventSchema).min(1).max(20),
});

// Public server fn: any visitor can call it. The database function is
// SECURITY DEFINER and rate-limited by fingerprint (dedup + upsert).
export const logClientErrors = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const url = process.env.VITE_SUPABASE_URL!;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const alertUrl = process.env.ALERT_WEBHOOK_URL;
    let alerted = 0;

    for (const ev of data.events) {
      const { error } = await sb.rpc("log_client_error", {
        _severity: ev.severity,
        _kind: ev.kind,
        _message: ev.message,
        _stack: ev.stack ?? null,
        _route: ev.route ?? null,
        _user_agent: ev.userAgent ?? null,
        _viewport: ev.viewport ?? null,
        _extra: ev.extra ?? null,
        _fingerprint: ev.fingerprint,
      });
      if (error) console.error("log_client_error failed", error.message);

      if (alertUrl && ev.severity === "error") {
        try {
          await fetch(alertUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              text: `[Lucky Git] ${ev.kind}: ${ev.message}`,
              route: ev.route,
              stack: ev.stack?.slice(0, 800),
              viewport: ev.viewport,
            }),
          });
          alerted++;
        } catch (e) {
          console.error("alert webhook failed", e);
        }
      }
    }
    return { ok: true, logged: data.events.length, alerted };
  });