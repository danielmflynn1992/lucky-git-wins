# Lucky Git Comps — Build Plan

This is a big app. I'll ship it in **3 phases** so you get something usable at the end of each. You approve this plan, I start Phase 1 immediately.

## Phase 1 — Brand, design system & the 4 money screens (frontend, mock data)

Goal: a clickable, on-brand site you can share for feedback before we wire real payments.

1. **Design system in `src/styles.css`**
   - Palette tokens: Clover Green `#0F5132`, Lucky Gold `#F5B700`, Cream `#FFF8ED`, Ink `#1A1A1A`, Hot Pink `#FF3D81`.
   - Fonts via `<link>` in `__root.tsx`: **Fraunces** (rounded slab display) for headings/prices, **Inter** for body/legal.
   - Semantic tokens for card, sticker-badge, shimmer, wobble hover, confetti, clover-pattern background.
   - Shadcn button variants: `gold` (primary CTA), `git` (dark green), `sticker` (rotated badge).

2. **Gary the Git mascot** — inline SVG component (`src/components/GaryMascot.tsx`): four-leaf clover, flat cap, wink, golden ticket. Horizontal + stacked logo lockups. Favicon variant.

3. **Priority pages (mock data in `src/lib/mock-comps.ts`)**
   - `/` Homepage — hero rotator, filterable comp grid, How It Works, Winners Wall carousel, trust strip, newsletter.
   - `/competitions/$slug` Detail — gallery, ticket qty stepper + Lucky Dip + number-picker grid, progress, countdown, skill-question modal gate, instant-win reveal, T&Cs, free-entry link.
   - `/checkout` — cart summary, Stripe placeholder, confetti confirmation screen.
   - `/admin/competitions/new` — the single-page fast wizard (still mock-persisted this phase, real in Phase 2).

4. **Supporting pages** (lighter): `/live-draws`, `/winners`, `/free-postal-entry` (serious tone), `/faq`, `/terms`, `/privacy`, `/responsible-play`, `/about`, `/contact`. Each with its own `head()` metadata.

5. **Global chrome**: sticky nav with Gary logo, cart badge, account link; footer with stacked logo, trust icons, legal links, free-entry callout.

## Phase 2 — Lovable Cloud backend, real auth, real tickets

1. **Enable Lovable Cloud.**
2. **Schema migration**: `competitions`, `tickets` (one row per number, unique on `(competition_id, number)` — prevents double-sell), `orders`, `order_items`, `skill_questions`, `instant_wins`, `winners`, `referrals`, `draw_logs`, `profiles`, `user_roles` (separate table, `has_role` security-definer function — no role on profile).
3. **RLS + GRANTs** on every public table. Public SELECT on live competitions/winners; owner-scoped on orders/tickets; admin-only via `has_role`.
4. **Server functions** (`createServerFn`): `listLiveComps`, `getComp`, `reserveTickets` (transactional, locks rows), `submitSkillAnswer`, `createCheckoutIntent`, admin `createComp`, `duplicateComp`, `drawWinner`.
5. **Auth**: email/password + Google via Lovable Cloud, `/auth` route, `_authenticated/` gate, `_authenticated/_admin` role gate.
6. **Account dashboard**: `/account` — My Entries, My Wins, orders, referral code.
7. **Admin panel** at `/admin`: comp list, new/edit wizard, duplicate, templates, bulk actions, animated draw tool, analytics dashboard.
8. **Stripe** via `payments--enable_stripe_payments` (seamless, full compliance handling — eligible digital service). Webhook route at `/api/public/webhooks/stripe` confirms order + assigns ticket numbers.

## Phase 3 — Compliance, comms, polish

1. **Resend integration** for order confirmation, draw reminder, winner emails (in-voice copy).
2. **Live draw page** with YouTube/Facebook Live embed placeholder + realtime results feed via Supabase Realtime.
3. **Instant-win scratch reveal** animation post-purchase.
4. **Free postal entry** flow — admin can log postal entries as free tickets.
5. **SEO**: `sitemap.xml` route, `robots.txt`, per-comp OG images.
6. **Compliance audit pass**: skill question strictly enforced server-side, free-entry link on every comp card + detail, cash-alt value visible, dated draw log page.
7. **Placeholders** for Twilio SMS (stub component + secret slot).

## Technical notes

- Ticket integrity: `reserveTickets` uses `INSERT ... ON CONFLICT DO NOTHING` on `(competition_id, number)` inside a transaction; unsold reservations expire via `expires_at` + cron cleanup. Supabase Realtime channel per comp broadcasts taken numbers.
- Skill question gate is enforced in the server fn that creates the checkout intent, not just the UI modal.
- Admin role via `user_roles` table + `has_role(uuid, app_role)` SECURITY DEFINER — never on `profiles`.
- All money displayed in GBP, formatted via `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`.
- Mobile-first: every screen designed at 390px viewport first, scales up.

## What I need from you before Phase 2

- Confirm **Stripe** (seamless, Lovable-managed) is fine — no BYOK Stripe account needed.
- Confirm Google sign-in + email/password for auth (standard Lovable Cloud default).
- A **Resend API key** when we reach Phase 3 (I'll prompt then, not now).

Approve and I'll start Phase 1 now.
