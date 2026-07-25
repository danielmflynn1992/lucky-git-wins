import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/free-postal-entry")({
  head: () => ({
    meta: [
      { title: "Free Postal Entry Route — Lucky Git Comps" },
      { name: "description", content: "How to enter any Lucky Git Comps competition free of charge by post. Same odds. Same draw. No purchase necessary." },
      { property: "og:title", content: "Free Postal Entry Route — Lucky Git Comps" },
      { property: "og:description", content: "Enter any Lucky Git Comps competition free by post." },
    ],
  }),
  component: () => (
    <StaticPage kicker="Compliance" title="Free Postal Entry Route">
      <p><strong>No purchase is necessary to enter any Lucky Git Comps competition.</strong> This page explains, in plain English, how to enter free of charge by post. Postal entries are treated exactly the same as paid entries — same odds, same draw, same chance of winning.</p>

      <h2>How to enter by post</h2>
      <p>Send the following on a plain sheet of A5 paper or a postcard to the address below:</p>
      <ul>
        <li>Your full name</li>
        <li>Your full postal address, including postcode</li>
        <li>Your date of birth (you must be 18 or over)</li>
        <li>Your email address and mobile number</li>
        <li>The full name of the competition you are entering (as it appears on the site)</li>
        <li>Your answer to the skill question shown on that competition's page</li>
      </ul>

      <h2>Where to send it</h2>
      <p>
        Lucky Git Comps Ltd — Free Entry<br/>
        [Registered address, to be added]<br/>
        United Kingdom
      </p>

      <h2>Rules for postal entries</h2>
      <ul>
        <li>One competition per envelope. Multi-competition entries are not accepted.</li>
        <li>Entries must be received before the competition closing time to be included in the draw.</li>
        <li>One entry per envelope. Multiple entries in a single envelope count as one entry.</li>
        <li>Illegible entries, entries missing any of the required information, and entries with an incorrect answer to the skill question cannot be entered.</li>
        <li>Postal entries are unlimited per person and per competition (subject to the maximum entry cap displayed on that competition's page).</li>
      </ul>

      <h2>Confirmation</h2>
      <p>You will receive an email confirmation with your allocated ticket number(s) within 3 working days of your entry being received. If you do not receive confirmation, please contact us.</p>

      <h2>Questions</h2>
      <p>For any questions about the free entry route, contact <a href="mailto:hello@luckygitcomps.co.uk">hello@luckygitcomps.co.uk</a>.</p>
    </StaticPage>
  ),
});