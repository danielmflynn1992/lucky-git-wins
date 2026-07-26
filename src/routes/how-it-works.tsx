import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Lucky Git Comps" },
      { name: "description", content: "How Lucky Git Comps prize draws work: pick your tickets, we auto-draw the winner." },
      { property: "og:title", content: "How It Works — Lucky Git Comps" },
      { property: "og:description", content: "Three steps. One of them's paying us. Sorry." },
    ],
  }),
  component: () => (
    <StaticPage kicker="The mechanics" title="How it works">
      <h2>1. Pick your tickets</h2>
      <p>Choose a competition, decide how many tickets you want, and either use Lucky Dip or hand-pick your numbers. Tickets start from £1 — some prizes go for a fiver a pop.</p>
      <h2>2. We auto-draw it</h2>
      <p>The moment the timer hits zero (or the last ticket sells), our system automatically picks a random winning ticket using a verifiable RNG — no human waiting around, no wiggle room. The winning number, timestamp and verification hash are published on the <a href="/past-draws">Past Draws</a> log for anyone to check. Winners are paid or shipped within 48 hours.</p>
    </StaticPage>
  ),
});