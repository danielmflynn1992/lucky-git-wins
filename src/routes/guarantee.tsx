import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { GuaranteePanel } from "@/components/GuaranteePanel";
import { NO_HIDDEN_TOTALS } from "@/components/TicketOdds";

const TITLE = "Our Guarantee — Lucky Git Comps";
const DESC =
  "Draws run on the date shown, never extended. Winner within 24 hours, full stated cash alternative, cash paid same day by bank transfer.";

export const Route = createFileRoute("/guarantee")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuaranteePage,
});

function GuaranteePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="font-display uppercase tracking-[0.02em] text-[clamp(1.8rem,7vw,2.6rem)] leading-[0.95]">
          Our guarantee
        </h1>
        <p className="mt-2 font-body text-[15px] text-[var(--color-ink-grey)]">
          Three promises, printed so you can hold us to them. {NO_HIDDEN_TOTALS}
        </p>

        <div className="mt-6">
          <GuaranteePanel compact />
        </div>

        <div className="mt-8 space-y-4 font-body text-[14px] leading-relaxed text-[var(--color-ink-black)]">
          <h2 className="font-display uppercase text-[18px]">What "never extended" actually means</h2>
          <p>
            The close time is set when the competition is published and written into the
            database. The draw is fired automatically by the system at that moment — nobody
            here has a button that pushes it back, and there's no "undersold" clause hiding
            in the small print. Half-sold pools still draw. The winner is still a winner.
          </p>
          <h2 className="font-display uppercase text-[18px]">Prize or cash — your call</h2>
          <p>
            Every competition shows a cash alternative at a stated value. It is a fixed
            figure, not a share of what we took on the door. If you'd rather have the money
            than the motor, say so and it's paid the same working day by bank transfer.
          </p>
          <h2 className="font-display uppercase text-[18px]">And if we ever get it wrong</h2>
          <p>
            Tell us, in writing, and we'll publish what happened.{" "}
            <Link to="/contact" className="underline">Contact us</Link> — or check any draw
            for yourself first on the{" "}
            <Link to="/verify" className="underline">verification page</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
