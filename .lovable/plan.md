# Lucky Git Comps — Signature Features Build

This is a large build. Below is the sequenced plan matching the brief's build order. I'll ship it in phases so you can review as we go. Confirm and I'll start with Phase 1.

## Phase 1 — Coupon Grid (the differentiator)

New `src/components/CouponGrid.tsx` used on every competition detail page.

- Dense grid of every ticket 1..N (up to 499) as coupon cells: cream fill, thin black rules, Courier number.
- Sold: hand-drawn blue biro X (SVG with slight rotation/wobble variants).
- User selections: red biro X + pale yellow fill, ~180ms ink-stroke animation (disabled under `prefers-reduced-motion`).
- Mono readout above: `377 / 499 TAKEN · 122 LEFT`.
- Lucky Dip button + "pick my numbers" text input (comma / range parsing).
- Live updates via existing Supabase channel on `tickets` for that competition.
- Accessibility: `role="grid"` / `role="row"` / `role="gridcell"`, roving tabindex, `aria-pressed`, visible focus ring, `aria-live` announcements, text input as full alternative.

Replaces the existing selector on `src/routes/competition.$slug.tsx`.

## Phase 2 — Draw Reveal "YOU LUCKY GIT"

Rebuild `src/routes/draws.$id.reveal.tsx` around new `<ArcadeReveal />`.

- Dark arcade cabinet (only near-black surface on the site).
- Stages, each ~1.2s, skippable: committed hash → seed revealed → HMAC computing (digits cycling) → reels stop → winning number in Alfa Slab One, huge → "YOU LUCKY GIT." stamp in coupon red, rotated, ink-bleed edge.
- Winner line: `DAVE FROM CARDIFF · TICKET 0217`.
- Viewer-is-winner branch: full-screen takeover, mascot, confetti, max-scale stamp with their name.
- OG share card generated per draw (server route rendering an SVG/PNG) with prize, winning number, stamp, crest.
- Permanent public URL per draw (already routed) — doubles as verification record.

## Phase 3 — Entry Slip (ticket = betting slip)

Rebuild checkout success into a tear-off slip at a permanent public URL `/slips/$id`.

- Perforated top edge, cream stock, 2px rule, red masthead `LUCKY GIT COMPS · ENTRY SLIP`.
- Comp name, ticket numbers in Courier at large size, stake, odds, close time as printed label/value rows.
- Angled `PAID` rubber stamp.
- Microtext footer: "Keep this somewhere safe. Or don't — we've got a copy."
- "Save to phone" → PNG via `html-to-image`.

## Phase 4 — Fix hollow content

- Homepage stats bar: hide entirely until real data exists; when shown, render honest zeros. Labels: `Prizes on the table`, `Comps running`, `Tickets flogged`, `Draws gone off`.
- Reconcile winners story: homepage "No draws yet" ↔ `/winners` mock winners ↔ FAQ "verified and photographed". Remove mock winners on `/winners` when no real draws; remove photography claim from FAQ (already partially done — sweep).
- Hero CTA: add primary button `SEE WHAT'S LIVE` → `/competitions`.

## Phase 5 — Microcopy & money slang

- `src/lib/format.ts` already has `moneySlang`/`LOADING_QUIPS`; sweep every prize/cash-alt render to include the ink-blue mono slang line (cards, detail, checkout, winners, hero).
- Category rename in `src/lib/mock-comps.ts` and filter chips: Cars→Motors, Tech→Gadgets, Cash→Readies, Holidays→Getaways, new **Timepieces** (move Rolex).
- Sweep empty/error/loading/toast/button copy against the brief's exact strings.
- Ticker filler chips already in place — verify strings match.

## Phase 6 — Odds leaderboard + Transparency

- `/odds` page: data-dense table of live comps sorted by best current odds — thumb, 1:X, stake, tickets left. Ink-blue table rules, Courier numerals.
- Odds alerts: email + threshold form → new `odds_alerts` table (email, threshold, created_at) with insert-only anon policy, rate-limited.
- `/transparency`: computes from `draws` + `competitions` — total prize value awarded, total winners, average odds across completed comps, % draws on schedule, mean draw-to-payout. Zeros while empty.

## Phase 7 — Drop-day queue + scratch teasers

- `/next-drop` page: goes live 10 min before next Mon/Wed/Fri 20:00 with countdown, prize teaser behind scratch panel, "you're in the queue" state after drop.
- `<ScratchPanel />` reinstated as a canvas scratch interaction on touch/mouse + keyboard-accessible "Reveal" button as full alternative.
- Ticket-number meaning: on cell select in the coupon grid, tiny mono line — `NOBODY HAS WON WITH 217 YET` or `217 HAS WON TWICE` from `draws.winning_number` counts.

## Technical notes (for me)

- New tables via migration: `odds_alerts` (id, email, threshold_denominator, created_at). No PII beyond email; anon insert, no select.
- Draw OG image: server route `src/routes/api/public/og/draw/$id.ts` returning SVG (cheap, no headless browser).
- `html-to-image` for slip PNG export (client-side).
- Coupon grid uses same `tickets` realtime channel already wired; degrade gracefully with mock data when no comp id.
- Confetti: `canvas-confetti` (tiny), only on winner-is-viewer branch.
- All near-black usage audited — only the arcade cabinet keeps it.

## What I'm not doing unprompted

- No new payment/email provider work — winner email subject line change only where the existing template lives.
- No design system palette changes.
- No changes to `/promise`, `/verify`, `/past-draws`, `/how-entry-works`, legal, T&Cs beyond honest number sourcing.

Reply "go" to start Phase 1, or tell me to reorder / drop phases.
