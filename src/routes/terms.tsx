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
      <h2>2. Nature of the competition</h2>
      <p>Each competition is a prize competition of skill under Section 14 of the Gambling Act 2005 (Great Britain). Entry requires the genuine exercise of skill, knowledge or judgement — specifically, a correct answer to a multiple-choice question of skill posed at checkout.</p>
      <h2>3. Entry</h2>
      <p>Entry is by paid ticket purchase and submission of an answer to the skill question. Answers are validated on our server. Where the submitted answer is correct, the associated tickets are recorded as qualifying and will be entered in the draw. Where the submitted answer is incorrect, the associated tickets are recorded as non-qualifying and <b>will not be entered in the draw</b>. Payment still completes and no refund is due. This is displayed unmissably on the competition page and on the payment button.</p>
      <p>One answer per order. Retries within a single order are not permitted.</p>
      <h2>4. The draw</h2>
      <p>At close, a winning ticket is selected deterministically from the pool of qualifying (i.e. correctly-answered) tickets, using an HMAC-SHA256 of a seed committed prior to sales opening. The seed hash is published in advance and the seed is revealed at draw. For each draw we publish: the winning number, total sold tickets, and total qualifying tickets used as the draw pool. See our <a href="/promise">/promise</a> page for the verification method.</p>
      <p><b>Void question fallback:</b> if a competition closes with zero correct answers, the skill question is treated as void and the draw is run across all sold tickets. The draw record for that competition will flag this fallback explicitly.</p>
      <h2>4. Prizes</h2>
      <p>Prizes are as described on each competition page. The cash alternative shown on the competition page may be taken in place of the physical prize at the winner's request.</p>
      <h2>6. Refunds & cancellations</h2>
      <p>Ticket purchases are final except where required by law. Where a competition is cancelled, all entrants will be refunded in full.</p>
      <h2>7. Age</h2>
      <p>You must be aged 18 or over to enter. We capture date of birth at account creation and block accounts under 18. Guest checkout requires a positive 18+ confirmation.</p>
      <h2>8. Data & marketing</h2>
      <p>We process your personal data in line with our <a href="/privacy">Privacy Policy</a>.</p>
      <p className="text-xs opacity-60 mt-8">This is a template. Replace with your finalised terms drafted by your solicitor before launch.</p>
    </StaticPage>
  ),
});