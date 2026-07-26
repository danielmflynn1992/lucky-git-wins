import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Lucky Git Comps" },
      { name: "description", content: "How Lucky Git Comps prize competitions work: pick your tickets, answer the skill question, we auto-draw from correct entries." },
      { property: "og:title", content: "How It Works — Lucky Git Comps" },
      { property: "og:description", content: "Three steps: pick, answer, wait. Skill decides who's in the draw." },
    ],
  }),
  component: () => (
    <StaticPage kicker="The mechanics" title="How it works">
      <h2>1. Pick your tickets</h2>
      <p>Choose a competition, decide how many tickets you want, and either use Lucky Dip or hand-pick your numbers. Tickets start from £1 — some prizes go for a fiver a pop.</p>
      <h2>2. Answer the skill question</h2>
      <p>Every competition has a genuine question of skill. Answer correctly and your tickets are entered in the draw. Answer incorrectly and your tickets are recorded as non-qualifying — you have paid for entry but you are not in the draw. This is stated unmissably on the payment screen. It's the legal basis for the competition.</p>
      <h2>3. We auto-draw from correct entries</h2>
      <p>When the timer hits zero (or the last ticket sells), our system picks a winner deterministically from the pool of correct entries only, using a hash-then-reveal method. The winning number, sold-ticket count and qualifying-pool size are published on the <a href="/past-draws">Past Draws</a> log for anyone to check. Winners are paid or shipped within 48 hours.</p>
      <p className="text-sm opacity-75">Read the full mechanic on our <a href="/how-entry-works">How entry works</a> page.</p>
    </StaticPage>
  ),
});