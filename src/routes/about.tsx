import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Lucky Git Comps — Why we built this" },
      { name: "description", content: "The story behind Lucky Git Comps: proper draws, real winners, and a name that made our lawyer wince." },
      { property: "og:title", content: "About Lucky Git Comps" },
      { property: "og:description", content: "Serious about draws. Not about ourselves." },
    ],
  }),
  component: () => (
    <StaticPage kicker="Us lot" title="About Lucky Git Comps">
      <p>We started Lucky Git Comps because most UK competition sites look like they were made in 2011 and take themselves far too seriously. Prize competitions should be fun — a couple of quid, a bit of a laugh, and if you win, brilliant.</p>
      <p>That said, we take the actual competition part deadly seriously. Every draw is automatic and provably random the moment the timer hits zero. Every winner is real, photographed, and named. We use Stripe for payments and never touch your card details.</p>
      <p>The name? We wanted something friendly, self-aware, and a bit British. "Lucky Git" is what your mate calls you when you win. Our lawyer winced. We kept it.</p>
      <h2>Meet Gary</h2>
      <p>Gary is our mascot — a smug four-leaf clover with a wink and a flat cap. He is the face of the brand, and technically our Head of PR.</p>
    </StaticPage>
  ),
});