import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { LEGAL_LAST_UPDATED, PAYMENTS_LINE, PRIVACY_EMAIL } from "@/lib/promises";

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
      <ul>
        <li>Name, email, date of birth and contact details</li>
        <li>Payment metadata only — {PAYMENTS_LINE.toLowerCase()}</li>
        <li>Entry history, answers submitted and draw records</li>
      </ul>
      <h2>Why we collect it</h2>
      <ul>
        <li>To process your entries, run draws and pay winners</li>
        <li>To send transactional emails (order confirmation, draw reminder, winner notification)</li>
        <li>Marketing emails only if you opt in</li>
      </ul>
      <h2>Your rights</h2>
      <p>You can request access, correction or deletion of your personal data at any time by emailing <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. You can also export your data from your account page.</p>
      <p className="text-xs opacity-60 mt-8">Last updated {LEGAL_LAST_UPDATED}.</p>
    </StaticPage>
  ),
});
