import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { LEGAL_LAST_UPDATED, SUPPORT_EMAIL, TIMING_LINE, VOID_QUESTION_LINE } from "@/lib/promises";

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
      <p>Each competition is a prize competition of skill under Section 14 of the Gambling Act 2005 (Great Britain). Entry requires the genuine exercise of skill, knowledge or judgement — specifically, a correct answer to a question of skill posed at checkout.</p>
      <h2>3. Entry</h2>
      <p>Entry is by paid ticket purchase and submission of an answer to the skill question. Answers are validated on our server. Where the submitted answer is correct, the associated tickets are recorded as qualifying and will be entered in the draw. Where the submitted answer is incorrect, the associated tickets are recorded as non-qualifying and <b>will not be entered in the draw</b>. Payment still completes and no refund is due. This is displayed unmissably on the competition page and on the payment button.</p>
      <p>One answer per order. The answer may be changed until payment completes; it is final once payment completes.</p>
      <p>Tickets cannot be purchased after a competition's published close time. This is enforced on our server, not merely in the interface.</p>
      <h2>4. The draw</h2>
      <p>Every pool is capped: never more than 499 tickets, and the exact pool size is always shown on the competition page.</p>
      <p>At close, a winning ticket is selected deterministically from the pool of qualifying (i.e. correctly-answered) tickets, using a SHA-256 hash of a seed committed prior to sales opening. The seed hash is published in advance and the seed is revealed at draw. For each draw we publish the winning number, total sold tickets and the qualifying pool size used as the draw pool. See our <a href="/promise">promise</a> page for the verification method.</p>
      <p><b>Zero correct entries:</b> {VOID_QUESTION_LINE}</p>
      <h2>5. Prizes and timing</h2>
      <p>Prizes are as described on each competition page. The cash alternative shown on the competition page may be taken in place of the physical prize at the winner's request.</p>
      <p>{TIMING_LINE}</p>
      <h2>6. Refunds &amp; cancellations</h2>
      <p>Ticket purchases are final except where required by law. Where a competition is cancelled or void, all entrants will be refunded in full.</p>
      <h2>7. Age</h2>
      <p>You must be aged 18 or over to enter. We capture date of birth at account creation and block accounts under 18. Guest checkout requires a positive 18+ confirmation.</p>
      <h2>8. Data &amp; marketing</h2>
      <p>We process your personal data in line with our <a href="/privacy">Privacy Policy</a>.</p>
      <h2>9. Responsible play limits</h2>
      <p>You may set a monthly spending limit, a cooling-off break or self-exclusion in your account. Reductions to a limit apply immediately; increases apply only after a 24-hour cooling-off period. Breaks and self-exclusion cannot be lifted early, and self-exclusion has a six-month minimum.</p>
      <h2>10. Contact</h2>
      <p>Questions about these Terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
      <p className="text-xs opacity-60 mt-8">Last updated {LEGAL_LAST_UPDATED}.</p>
    </StaticPage>
  ),
});
