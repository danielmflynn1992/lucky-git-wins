import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Lucky Git Comps" },
      { name: "description", content: "How Lucky Git Comps collects, stores and uses your personal data." },
      { property: "og:title", content: "Privacy Policy — Lucky Git Comps" },
      { property: "og:description", content: "Your data, handled properly." },
    ],
  }),
  component: () => (
    <StaticPage kicker="Legal" title="Privacy Policy">
      <p>Lucky Git Comps Ltd is the data controller of any personal data you provide when entering a competition or creating an account.</p>
      <h2>What we collect</h2>
      <ul><li>Name, email, phone number, postal address</li><li>Payment metadata (Stripe holds card details, we do not)</li><li>Entry history</li></ul>
      <h2>Why we collect it</h2>
      <ul><li>To process your entries and pay winners</li><li>To send transactional emails (order confirmation, draw reminder, winner notification)</li><li>Marketing emails only if you opt in</li></ul>
      <h2>Your rights</h2>
      <p>You can request access, correction, or deletion of your personal data at any time by emailing <a href="mailto:privacy@luckygitcomps.co.uk">privacy@luckygitcomps.co.uk</a>.</p>
      <p className="text-xs opacity-60 mt-8">This is a template. Replace with a full GDPR-compliant policy before launch.</p>
    </StaticPage>
  ),
});