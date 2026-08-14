import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { PRIVACY_EMAIL, SUPPORT_EMAIL } from "@/lib/promises";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Support — Lucky Git Comps" },
      { name: "description", content: "Get in touch with Lucky Git Comps support. Real UK humans, weekday replies within a few hours." },
      { property: "og:title", content: "Contact — Lucky Git Comps" },
      { property: "og:description", content: "Real humans. Real replies." },
    ],
  }),
  component: () => (
    <StaticPage kicker="Get in touch" title="Contact & Support">
      <p>Email us. A real human in the UK reads it — usually the same day, always the same week. No bots, no ticket numbers seventeen digits long, no "your call is important to us".</p>
      <p className="text-lg"><strong>Support:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      <p className="text-lg"><strong>Data &amp; privacy:</strong> <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a></p>
      <h2>Chuck in the following so we can sort it quicker:</h2>
      <ul>
        <li>The competition name (if it's about a specific one)</li>
        <li>Your order reference (from your email confirmation)</li>
        <li>What's up — as much detail as you like</li>
      </ul>
      <p>Compliments also accepted.</p>
    </StaticPage>
  ),
});
