import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://lucky-git-wins.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_PUBLIC_ROUTES: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/competitions", changefreq: "daily", priority: "0.9" },
  { path: "/winners", changefreq: "daily", priority: "0.8" },
  { path: "/results", changefreq: "daily", priority: "0.8" },
  { path: "/past-draws", changefreq: "daily", priority: "0.8" },
  { path: "/verify", changefreq: "weekly", priority: "0.7" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.7" },
  { path: "/how-entry-works", changefreq: "monthly", priority: "0.7" },
  { path: "/draw-day", changefreq: "monthly", priority: "0.7" },
  { path: "/guarantee", changefreq: "monthly", priority: "0.7" },
  { path: "/promise", changefreq: "monthly", priority: "0.7" },
  { path: "/transparency", changefreq: "monthly", priority: "0.7" },
  { path: "/odds", changefreq: "monthly", priority: "0.6" },
  { path: "/next-drop", changefreq: "weekly", priority: "0.6" },
  { path: "/free-entry", changefreq: "monthly", priority: "0.6" },
  { path: "/responsible-play", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "monthly", priority: "0.5" },
  { path: "/terms", changefreq: "monthly", priority: "0.5" },
];

export const Route = createFileRoute("/sitemap/xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_PUBLIC_ROUTES];

        const [{ data: competitions }, { data: draws }] = await Promise.all([
          supabase.from("competitions").select("slug").order("created_at", { ascending: false }),
          supabase.from("draws").select("id").order("drawn_at", { ascending: false }),
        ]);

        for (const comp of competitions ?? []) {
          if (comp.slug) {
            entries.push({ path: `/competitions/${encodeURIComponent(comp.slug)}`, changefreq: "daily", priority: "0.8" });
          }
        }

        for (const draw of draws ?? []) {
          if (draw.id) {
            entries.push({ path: `/draws/${draw.id}/board`, changefreq: "weekly", priority: "0.6" });
            entries.push({ path: `/draws/${draw.id}/reveal`, changefreq: "weekly", priority: "0.6" });
            entries.push({ path: `/draws/${draw.id}/verify`, changefreq: "weekly", priority: "0.6" });
          }
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
