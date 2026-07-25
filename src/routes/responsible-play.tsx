import { createFileRoute } from "@tanstack/react-router";
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
      <p>You can set a monthly spending limit or self-exclude at any time from your account settings.</p>
      <h2>Fair draws</h2>
      <p>Every draw uses a certified RNG and is streamed live for public verification. Winning ticket numbers and winner names (with permission) are permanently published on our Winners Wall.</p>
      <h2>Get help</h2>
      <p>If you're worried about your spending, help is free and confidential from <a href="https://www.gamcare.org.uk" rel="noreferrer" target="_blank">GamCare</a> (0808 8020 133).</p>
    </StaticPage>
  ),
});