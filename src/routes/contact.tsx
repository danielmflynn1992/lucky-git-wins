import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

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
      <p>Real humans, in the UK, weekdays 9–6. We'll usually reply within a few hours.</p>
      <p><strong>Email:</strong> <a href="mailto:hello@luckygitcomps.co.uk">hello@luckygitcomps.co.uk</a></p>
      <p><strong>Postal:</strong> Lucky Git Comps Ltd — [Registered address], United Kingdom</p>
      <h2>What to include</h2>
      <ul>
        <li>The competition name (if it's about a specific one)</li>
        <li>Your order reference (from your email confirmation)</li>
        <li>What's up — as much detail as you like</li>
      </ul>
    </StaticPage>
  ),
});