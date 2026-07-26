import { createFileRoute, Link } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/legal-structure")({
  head: () => ({
    meta: [
      { title: "Legal structure — Lucky Git Comps" },
      {
        name: "description",
        content:
          "How Lucky Git Comps is structured under the UK Gambling Act 2005: a paid prize competition with a genuinely free entry route of equal prominence and equal chance.",
      },
      { property: "og:title", content: "Legal structure — Lucky Git Comps" },
      { property: "og:description", content: "Paid entry, or free entry — same pool, same odds, same chance." },
    ],
  }),
  component: () => (
    <StaticPage kicker="Legal structure" title="How this is legal (and fair)">
      <p>
        Lucky Git Comps operates as a <b>free draw</b> under the Gambling Act 2005 (Schedule 2). That means every competition on the site is open to two entry routes with an equal chance of winning:
      </p>
      <ul>
        <li><b>Paid entry:</b> buy tickets on the competition page.</li>
        <li><b>Free entry:</b> submit one free entry per person, per competition, via our <Link to="/free-entry" className="underline">free entry route</Link>.</li>
      </ul>

      <h2>Equal chance, same pool</h2>
      <p>
        Free entries are not a token gesture. Each free entry is assigned a real ticket in the same pool as paid entries, with the same odds of being drawn. If the winning number belongs to a free entrant, they win the same prize on the same terms.
      </p>

      <h2>Equal prominence</h2>
      <p>
        The free entry route is linked from every competition page and the checkout, at equal visual prominence to the paid entry option, and from the site header on every page. You do not have to pay to have a genuine chance of winning.
      </p>

      <h2>Why we don't use a skill question</h2>
      <p>
        Some competitions rely on a "skill question" to sit under the prize-competition limb of the Act. In practice these questions are usually too easy to meaningfully deter entrants, which creates legal risk. The free entry route is a cleaner, more transparent way to operate lawfully — and it means paid entrants aren't slowed down by a pointless quiz.
      </p>

      <h2>What that means for you</h2>
      <ul>
        <li>You can enter any live competition for free by submitting the <Link to="/free-entry" className="underline">free entry form</Link>.</li>
        <li>One free entry per person, per competition. Duplicate entries are removed.</li>
        <li>Free entrants are drawn from the same pool as paid entrants and, if drawn, receive the same prize.</li>
        <li>We do not offer, hold, or promote a licensed lottery. We do not need a Gambling Commission licence to run free draws that meet the Schedule 2 conditions.</li>
      </ul>

      <h2>Where to complain</h2>
      <p>
        If you believe we've breached this structure, email <a href="mailto:legal@luckygitcomps.example" className="underline">legal@luckygitcomps.example</a> and we will investigate promptly. You can also raise concerns with the Gambling Commission at <a href="https://www.gamblingcommission.gov.uk" className="underline" target="_blank" rel="noreferrer">gamblingcommission.gov.uk</a>.
      </p>

      <p className="text-xs opacity-60 mt-8">
        This page is a plain-English explainer, not legal advice. The definitive terms are our <Link to="/terms" className="underline">Terms &amp; Conditions</Link>.
      </p>
    </StaticPage>
  ),
});