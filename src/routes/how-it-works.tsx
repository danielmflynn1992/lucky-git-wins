import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Lucky Git Comps" },
      { name: "description", content: "How Lucky Git Comps prize draws work: pick your tickets, answer the skill question, watch us draw it live." },
      { property: "og:title", content: "How It Works — Lucky Git Comps" },
      { property: "og:description", content: "Three steps. One of them's paying us. Sorry." },
    ],
  }),
  component: () => (
    <StaticPage kicker="The mechanics" title="How it works">
      <h2>1. Pick your tickets</h2>
      <p>Choose a competition, decide how many tickets you want, and either use Lucky Dip or hand-pick your numbers. Tickets start from £1 — some prizes go for a fiver a pop.</p>
      <h2>2. Answer the skill question</h2>
      <p>UK law says prize competitions must involve an element of skill or judgement. So each comp has one multiple-choice question. It's genuinely answerable — we're not being tricky.</p>
      <h2>3. We draw it live</h2>
      <p>Every draw is streamed live on YouTube and Facebook. A random number generator picks the winning ticket in front of your eyes. Winners are paid or shipped within 48 hours.</p>
      <h2>Free postal entry</h2>
      <p>Every competition can be entered free by post, at exactly the same odds. See the <a href="/free-postal-entry">Free Postal Entry Route</a> page.</p>
    </StaticPage>
  ),
});