import { createFileRoute, Link } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/how-entry-works")({
  head: () => ({
    meta: [
      { title: "How entry works — Lucky Git Comps" },
      {
        name: "description",
        content:
          "Lucky Git Comps runs prize competitions of skill under the UK Gambling Act 2005. Entry requires a correct answer to a skill question. Winners are drawn at random from correct entries only.",
      },
      { property: "og:title", content: "How entry works — Lucky Git Comps" },
      { property: "og:description", content: "Prize competition of skill. Correct answer required. Random winner from correct entries." },
    ],
  }),
  component: () => (
    <StaticPage kicker="How entry works" title="A prize competition of skill">
      <p>
        Lucky Git Comps operates as a <b>prize competition</b> under Section 14 of the Gambling
        Act 2005 (Great Britain). Section 14 competitions require the genuine
        exercise of skill, knowledge or judgement to enter.
      </p>
      <h2>How you enter</h2>
      <ul>
        <li>Pick your tickets on the competition page.</li>
        <li>Answer a genuine question of skill. The answer is not on the site.</li>
        <li>Pay for your tickets.</li>
      </ul>
      <h2>What happens if you answer incorrectly</h2>
      <p>
        The answer is validated on the server. If it is <b>correct</b>, your tickets are entered
        in the draw. If it is <b>incorrect</b>, your tickets are recorded as non-qualifying and
        will not be entered — you have purchased entry but are not in the draw. This is stated
        clearly on the ticket page and above the payment button before you pay, exactly because
        it is the part people find surprising.
      </p>
      <h2>How the winner is chosen</h2>
      <p>
        At close, our system draws a winner deterministically from the pool of correct entries
        only, using a hash-then-reveal method. The winning number, the total sold and the
        qualifying pool size are all published on <Link to="/past-draws" className="underline">/past-draws</Link>{" "}
        and summarised on our <Link to="/guarantee" className="underline">guarantee</Link> page, so
        anyone can independently verify the draw.
      </p>
      <h2>If nobody answers correctly</h2>
      <p>
        If a competition closes with zero correct entries the competition is void: every entrant
        is refunded in full and no prize is awarded. The void record is still published on{" "}
        <Link to="/past-draws" className="underline">/past-draws</Link>, flagged as void, so the
        outcome is on the record like any other.
      </p>
      <h2>Two ways to enter</h2>
      <p>
        Every competition can be entered by buying a ticket, or for free by post or email — see{" "}
        <Link to="/free-entry" className="underline">/free-entry</Link> for the full process. Both
        routes go into the same numbered pool and carry identical odds once entered.
      </p>
      <p>
        Free entries use the same skill question as paid tickets and are limited to a set number of
        spots per competition, shown on the competition page. Once those spots are claimed, free
        entry closes for that competition — the same way ticket sales close when a pool sells out.
        We don't move unsuccessful free entrants into a different competition; that would mean
        putting you in the running for a prize you never chose.
      </p>
      <h2>Complaints</h2>
      <p>
        Email <a href="mailto:support@luckygitcomps.co.uk" className="underline">support@luckygitcomps.co.uk</a>.
      </p>
      <p className="text-xs opacity-60 mt-8">
        Plain-English explainer, not legal advice. The definitive terms are our{" "}
        <Link to="/terms" className="underline">Terms &amp; Conditions</Link>.
      </p>
    </StaticPage>
  ),
});
