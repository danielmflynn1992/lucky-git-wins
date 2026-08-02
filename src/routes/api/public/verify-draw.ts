import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyDrawOnServer } from "@/lib/verify.server";

const Query = z.object({ drawId: z.string().uuid() });

export const Route = createFileRoute("/api/public/verify-draw")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = Query.safeParse({ drawId: url.searchParams.get("drawId") ?? "" });
        if (!parsed.success) {
          return Response.json({ error: "drawId must be a UUID" }, { status: 400 });
        }
        const result = await verifyDrawOnServer(parsed.data.drawId);
        return Response.json(result, {
          headers: { "cache-control": "no-store" },
        });
      },
    },
  },
});
