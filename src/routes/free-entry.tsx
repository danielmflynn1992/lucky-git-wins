import { createFileRoute, Link } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { COMPANY_NAME, FREE_ENTRY_ADDRESS, FREE_ENTRY_EMAIL, REGISTERED_OFFICE } from "@/lib/company";

export const Route = createFileRoute("/free-entry")({
  head: () => ({
    meta: [
      { title: "Enter for free — Lucky Git Comps" },
      {
        name: "description",
        content:
          "Every Lucky Git Comps competition can be entered free by post or email. Same numbered pool, same odds, limited free spots per competition.",
      },
      { property: "og:title", content: "Enter for free — Lucky Git Comps" },
      { property: "og:description", content: "Free entry by post or email. Same pool, same odds, limited spots." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <StaticPage kicker="No payment needed" title="Enter for free.">
      <p>
        Every competition here can be entered without paying — by post or by email. A free entry has
        exactly the same odds as a paid ticket, once it's in the draw. It just takes a bit more
        effort to get there, and there's a limited number of free spots on each competition, same as
        there's a limited number of tickets.
      </p>

      <h2>How it works</h2>

      <h3 className="font-display font-bold text-[1.25rem] leading-tight text-foreground mt-6">By post</h3>
      <p>
        Write your name, address, date of birth, email, phone number and your answer to that
        competition's skill question on a letter or postcard. Post it to:
      </p>
      <p className="font-mono text-sm leading-relaxed">
        {FREE_ENTRY_ADDRESS}
        <br />
        {REGISTERED_OFFICE}
      </p>

      <h3 className="font-display font-bold text-[1.25rem] leading-tight text-foreground mt-6">By email</h3>
      <p>
        Send the same details — name, address, DOB, email, phone, and your answer — to{" "}
        <a href={`mailto:${FREE_ENTRY_EMAIL}`} className="underline">{FREE_ENTRY_EMAIL}</a>. Type it all
        out yourself; there's no form to fill in. That's not us being awkward, it's what keeps this a
        genuine free route rather than a shortcut around buying a ticket.
      </p>
      <p>
        <b>One entry per person, per competition. One free entry per person across the whole site
        every 30 days.</b>
      </p>

      <h2>Why there's a limited number of free spots</h2>
      <p>
        Every competition holds back a set number of ticket slots for free entries — shown on the
        competition page. Once they're claimed, free entry for that competition closes, the same way
        tickets sell out. If you're not one of them, you haven't been entered — we won't put you into
        a different competition instead. That would mean handing you a prize you never actually asked
        for, and we don't think that's fair on you or on the paying customers.
      </p>

      <h2>Timing</h2>
      <p>
        Post needs to arrive before the stated postal cut-off on each competition page — we go by
        when we receive it, not the postmark. Email can be sent a little closer to the close time,
        but still needs to land before that competition's email cut-off, so give it a bit of
        breathing room.
      </p>

      <h2>Same draw, same odds</h2>
      <p>
        A free ticket and a paid ticket are identical once logged: one number, one equal shot, drawn
        the same automated way, checkable on{" "}
        <Link to="/verify" className="underline">/verify</Link>.
      </p>

      <p className="text-xs opacity-60 mt-8">
        {COMPANY_NAME}. See{" "}
        <Link to="/how-entry-works" className="underline">how entry works</Link> and our{" "}
        <Link to="/terms" className="underline">Terms &amp; Conditions</Link>.
      </p>
    </StaticPage>
  ),
});
