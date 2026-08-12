import { createFileRoute, Link } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/responsible-play")({
  head: () => ({
    meta: [
      { title: "Responsible Play — Lucky Git Comps" },
      { name: "description", content: "Lucky Git Comps is committed to fair, transparent, responsible prize competitions. Support and self-exclusion options here." },
      { property: "og:title", content: "Responsible Play — Lucky Git Comps" },
      { property: "og:description", content: "Play for fun, not for rent." },
    ],
  }),
  component: () => (
    <StaticPage kicker="Play safely" title="Responsible Play & Fair Draws">
      <p>Lucky Git Comps runs prize competitions, not gambling — but we take the same responsibility toward our entrants. Only spend what you can comfortably lose. This is entertainment, not an investment strategy.</p>
      <h2>Spending limits</h2>
      <p>
        You can set a monthly spending limit or self-exclude at any time from{" "}
        <Link to="/account">your account settings</Link>. Lowering a limit applies instantly;
        raising one takes 24 hours to come into effect. Both are enforced at checkout.
      </p>
      <h2>Self-exclusion</h2>
      <p>
        If you want to stop entering, we'll take you off the board — no argument, no retention email,
        no "are you sure?". Self-exclusion means:
      </p>
      <ul>
        <li>Your account is blocked from buying tickets for the period you choose (6 months, 1 year, or permanently).</li>
        <li>You're removed from all drop notifications and marketing immediately.</li>
        <li>Any tickets already bought stay in their draws and are paid out as normal if they win.</li>
        <li>We won't reinstate you early. Once it's set, it's set until the period is up.</li>
      </ul>
      <p>
        Set it yourself in <Link to="/account">your account settings</Link> — it takes effect
        immediately. If you'd rather we did it, use <Link to="/contact">Contact &amp; Support</Link>{" "}
        and put "SELF-EXCLUSION" in the message with the period you want; we action it within one
        working day and email you a confirmation. If you'd rather just take a breather, ask for a
        cooling-off period instead and say how long.
      </p>
      <h2>Fair draws</h2>
      <p>
        Every draw is automatic, using our published hash-then-reveal system — see{" "}
        <Link to="/verify">/verify</Link> to check any draw yourself. The winning number and
        verification hash are published to our <Link to="/past-draws">Past Draws</Link> log the
        moment the timer hits zero. Winner names (with permission) are permanently listed on the
        Winners Wall.
      </p>
      <h2>Get help</h2>
      <p>If you're worried about your spending, help is free and confidential from <a href="https://www.gamcare.org.uk" rel="noreferrer" target="_blank">GamCare</a> (0808 8020 133).</p>
    </StaticPage>
  ),
});