import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Lucky Git Comps — Why we built this" },
      { name: "description", content: "The story behind Lucky Git Comps: proper draws, a public log, and a name we're keeping." },
      { property: "og:title", content: "About Lucky Git Comps" },
      { property: "og:description", content: "Serious about draws. Not about ourselves." },
    ],
  }),
  component: () => (
    <StaticPage kicker="Us lot" title="About Lucky Git Comps">
      <p>We started Lucky Git Comps because most UK competition sites look like they were made in 2011 and take themselves far too seriously. Prize competitions should be fun — a couple of quid, a bit of a laugh, and if you win, brilliant.</p>
      <p>That said, we take the actual competition part deadly seriously. The draw runs automatically the moment the timer hits zero, using a seed that's hashed and published before entries close — so the outcome can be independently verified after the fact. Every completed draw is logged with its winning number, seed and hash on the public Past Draws page. Card payments are handled by an external, PCI-compliant provider; ticket numbers and card details never share a table.</p>
      <p>The name? We wanted something friendly, self-aware, and a bit British. "Lucky Git" is what your mate calls you when you win. It raised a few eyebrows. We kept it.</p>
      <h2>Meet Terry</h2>
      <p>Terry's been on the market since 1974 and has never once been caught paying full price for anything. He's our mascot, our doorman, and — on paper — our Head of Public Relations. He does not have a phone. He does not answer emails. He is, however, always about.</p>
    </StaticPage>
  ),
});