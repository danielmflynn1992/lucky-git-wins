import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Lucky Git Comps" },
      { name: "description", content: "The terms and conditions that apply to Lucky Git Comps prize competitions." },
      { property: "og:title", content: "Terms & Conditions — Lucky Git Comps" },
      { property: "og:description", content: "The legal bits." },
    ],
  }),
  component: () => (
    <StaticPage kicker="Legal" title="Terms & Conditions">
      <p>These Terms govern your use of Lucky Git Comps ("we", "us"). By entering any competition on the site, you agree to these Terms.</p>
      <h2>1. Eligibility</h2>
      <p>Entrants must be aged 18 or over and resident in the United Kingdom.</p>
      <h2>2. Entry</h2>
      <p>Entry is by paid ticket purchase. Winners are selected automatically by a verifiable random draw when the competition closes.</p>
      <h2>3. The draw</h2>
      <p>Draws take place automatically on the published closing date and are conducted using a certified random number generator. Every draw is recorded with a verification hash on our public Past Draws log for independent scrutiny.</p>
      <h2>4. Prizes</h2>
      <p>Prizes are as described on each competition page. The cash alternative shown on the competition page may be taken in place of the physical prize at the winner's request.</p>
      <h2>5. Refunds & cancellations</h2>
      <p>Ticket purchases are final except where required by law. Where a competition is cancelled, all entrants will be refunded in full.</p>
      <h2>6. Data & marketing</h2>
      <p>We process your personal data in line with our <a href="/privacy">Privacy Policy</a>.</p>
      <p className="text-xs opacity-60 mt-8">This is a template. Replace with your finalised terms drafted by your solicitor before launch.</p>
    </StaticPage>
  ),
});