## Pools Coupon Restyle

Full visual rebuild — no route or data changes. Everything moves from the "engraved banknote" system to a two-colour offset-on-newsprint pools-coupon aesthetic.

### Foundation (src/styles.css)

Retire mint/engraving tokens. New palette, kept small:
- `--paper-news` #F1EBDC (newsprint cream)
- `--ink-black` #14110E (body/rules)
- `--ink-red` #C8202B (coupon red, plate 1)
- `--ink-blue` #1E3A8A (biro/pools blue, plate 2)
- `--ink-purple` #4A1E5C (rubber stamp)
- `--ink-yellow` #F5D547 (highlighter)

Typography via Google Fonts `<link>` in `__root.tsx`:
- Anton (display)
- Alfa Slab One (fairground accent, one instance per screen)
- Archivo (body + labels)
- Courier Prime (all numerals, tickets, hashes, countdowns)

Global utilities:
- `.misreg` — 1–2px red offset ghost, display headings only
- `.halftone` — background dot pattern at ~6% opacity
- `.rule-heavy`, `.rule-dotted`, `.rule-double` — printed rules replacing borders/shadows
- `.label` — Archivo caps, 0.16em tracking
- Sharp corners as global default (radius 0)
- `prefers-reduced-motion` disables stamp rotation and biro animations

### New primitives (src/components/)

- `CouponCard.tsx` — replaces CompCard structural chrome. Red masthead → prize name in Anton → dotted rule → image in ruled black box → form-style label/value rows (DRAW No. / STAKE / ODDS / CLOSES) in Courier → perforated bottom edge with CTAs.
- `CouponGrid.tsx` — 499 numbered cells, sold = blue biro X, available = empty. `aria-pressed`, roving tabindex, direct number-input fallback. Used on competition detail as the hero graphic.
- `StampMark.tsx` — rotated rubber stamp with ink-bleed edges. Variants: DRAWN, SOLD OUT, VERIFIED, PAID, WINNER, INSTANT WIN. Replaces `BrassTag`/`WaxSeal` badges.
- `ScratchPanel.tsx` — canvas scratch-off for instant wins + ticket reveals, with keyboard "Reveal" button.
- `BiroMark.tsx` — SVG X / tick / circle with hand-drawn wobble.
- `Perforation.tsx` — dotted/scalloped tear-off edge for card bottoms, receipts, section dividers.
- `Marker.tsx` — skewed highlighter swipe behind key phrases.
- `ArcadeReveal.tsx` — dark arcade cabinet with glowing segment-display numerals for the draw reveal.

### Page treatments (restyle only, no data changes)

- `routes/index.tsx` — Anton masthead with `.misreg`; comps as a wall of CouponCards; sections separated by `<Perforation />`.
- `routes/competitions.$slug.tsx` — full coupon at scale; `<CouponGrid />` replaces existing ticket selector chrome (keeps existing reservation hooks).
- `routes/checkout.tsx` — betting-slip form styling; receipt sidebar gets top perforation.
- Purchase confirmation — tear-off ticket stub, Courier numbers, `<StampMark variant="PAID" />` overprint.
- `routes/promise.tsx` — 499 huge in Alfa Slab One, odds comparison as printed table.
- `routes/verify.tsx`, `routes/past-draws.tsx` — plain ledger; ruled, typewritten; no jokes, no stamps beyond VERIFIED.
- `routes/winners.tsx` — polaroid cards with biro captions, pinned at slight angles.
- `routes/draws.$id.reveal.tsx` — swap contents for `<ArcadeReveal />`.
- Header/footer — lockup stays as the current PNG for now (mascot re-illustration is a follow-up).

### Mascot

Del Boy re-illustration (two-colour print, halftone, misregistration, circular badge) is called out as a follow-up asset task, not included in this pass. Existing lockup keeps its slot.

### Restraint enforcement

Documented as comments in `styles.css` and in a short `src/components/README-print.md`:
- max 1 highlighter per screen
- max 1 stamp per card, 2 per screen
- 1 Alfa Slab One per screen
- misreg on display headings only
- ≤3 distinct textures per screen

### Accessibility

- Highlighter always behind text that already passes on cream.
- ScratchPanel: canvas + keyboard reveal button, `aria-live` result.
- CouponGrid: `role="grid"`, `aria-pressed`, roving tabindex, visible focus ring, number-input fallback.
- Misregistration contrast verified at display sizes only.
- All textures `aria-hidden` + `pointer-events: none`.
- Motion utilities gated on `prefers-reduced-motion`.

### Out of scope for this pass

- Route/data model changes
- Del Boy re-illustration (noted as follow-up)
- Real Stripe wiring, admin flows
