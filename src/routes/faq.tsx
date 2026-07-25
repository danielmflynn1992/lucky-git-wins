import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

const QAs = [
  ["Is this actually legit?", "Yes. Lucky Git Comps is a UK-registered company, all draws are streamed live, all winners are verified and photographed, and every competition has a free postal entry route."],
  ["What happens if the competition doesn't sell out?", "The draw still goes ahead on the closing date. Everyone who entered has the same shot regardless of how many tickets sold."],
  ["When do I get my prize?", "Cash prizes are paid by bank transfer within 48 hours of the winner being verified. Physical prizes are shipped or hand-delivered within 7 working days."],
  ["Can I take the cash instead of the prize?", "Yes, every competition shows a cash alternative on the prize page. Winners can take that instead — no questions asked."],
  ["What if I answer the skill question wrong?", "You can retry. The correct answer must be given before your entry counts."],
  ["Can I enter for free?", "Yes. See the Free Postal Entry Route page. Same odds, same draw, no purchase needed."],
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Lucky Git Comps" },
      { name: "description", content: "Frequently asked questions about Lucky Git Comps prize draws." },
      { property: "og:title", content: "FAQ — Lucky Git Comps" },
      { property: "og:description", content: "The stuff people ask." },
    ],
  }),
  component: () => (
    <StaticPage kicker="Frequently asked" title="Questions we get a lot">
      {QAs.map(([q, a]) => (
        <div key={q} className="mt-6">
          <h2>{q}</h2>
          <p>{a}</p>
        </div>
      ))}
    </StaticPage>
  ),
});