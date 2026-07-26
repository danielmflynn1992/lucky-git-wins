import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

const QAs = [
  ["Why is there a question?", "Lucky Git Comps is a prize competition of skill under Section 14 of the Gambling Act 2005. UK law requires the genuine exercise of skill, knowledge or judgement to enter. Every competition ships with a real question that isn't answerable by looking at the prize page."],
  ["What happens if I get the question wrong?", "Your tickets are recorded as non-qualifying and will not be entered in the draw. Payment still completes and no refund is given. This is stated unmissably before you pay — both on the competition page and on the payment button itself. Get it right, you're in the draw. Get it wrong, you're not."],
  ["Is this actually legit?", "Yes. Lucky Git Comps is a UK-registered company. Every competition is auto-drawn by a verifiable random process the moment the timer hits zero, and every winner is verified and published."],
  ["What happens if the competition doesn't sell out?", "The draw still goes ahead on the closing date. Everyone who entered has the same shot regardless of how many tickets sold."],
  ["When do I get my prize?", "Cash prizes are paid by bank transfer within 48 hours of the winner being verified. Physical prizes are shipped or hand-delivered within 7 working days."],
  ["Can I take the cash instead of the prize?", "Yes, every competition shows a cash alternative on the prize page. Winners can take that instead — no questions asked."],
  ["How is the winner picked?", "Automatically. As soon as the timer hits zero (or the last ticket sells), the system draws a random winning ticket deterministically from the pool of correct entries only, using a hash-then-reveal method. The sold count and the qualifying pool size are both published so anyone can verify the draw."],
  ["What if nobody answers correctly?", "If a competition closes with zero correct answers, the question is treated as void and the draw runs across all sold tickets as a fallback. This is stated in the T&Cs."],
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
          {/* Use h3 so the prose h2 display styling doesn't apply — questions
              read as sub-headings at 1.25rem, not as page-level titles. */}
          <h3 className="font-display font-bold text-[1.25rem] leading-tight text-foreground">
            {q}
          </h3>
          <p>{a}</p>
        </div>
      ))}
    </StaticPage>
  ),
});