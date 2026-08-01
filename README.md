# Lucky Git Competitions

Build a full web app called Lucky Git Comps — a UK online prize competition site (same category as RevComps, CompCity, Ryda Comps) where users buy numbered tickets for a chance to win prizes (cars, tech, cash alternatives, holidays). The brand personality is cheeky and self-deprecating on the surface, rock-solid and trustworthy underneath — think "a proper business that doesn't take itself too seriously, but takes your money and the draw very seriously."

1. Brand & Tone

Name: Lucky Git Comps. Tagline options to use across the site: "Go on then, you lucky git", "Someone's got to win it", "Chancers welcome."

Voice: warm, very British, pub-banter humour, self-aware about the absurdity of competitions ("yes, you could actually win this car"), never mean-spirited, never mocks winners or losers.

Underlying feel must still say "legitimate business": clear T&Cs, visible live draw footage, verified winners, real customer support — the humour is packaging, not substance.

2. Logo & Mascot (generate as SVG/inline component, not an image upload)

Create a mascot called "Gary the Git" — a cartoon four-leaf clover with a smug, cheeky grin, wearing a flat cap tilted to one side, one eyebrow raised, winking, holding a golden ticket between two leaf-fingers like a cigarette. Rendered as a simple flat-vector SVG (2–3 colours max: clover green, gold, cream outline) so it scales cleanly as a favicon, nav logo, and loading spinner. Logo lockup = "Gary" icon + wordmark "Lucky Git Comps" in a bold rounded slab-serif, with "COMPS" in a smaller condensed all-caps beneath "LUCKY GIT". Provide a horizontal version (nav) and a stacked version (footer/social).

3. Visual Design System

Palette: Clover Green (#0F5132 deep base), Lucky Gold (#F5B700 accent for CTAs/prices), Cream (#FFF8ED background), near-black (#1A1A1A text), with a hot-pink "instant win" accent (#FF3D81) used sparingly for urgency badges.

Typography: a bold rounded/slab display font for headings and prices (playful, confident), paired with a clean grotesk for body text and legal copy (so T&Cs feel serious even if headings are fun).

Style: bright, glossy, high-contrast cards with soft shadows and slight rotation/"sticker" effects on badges ("HOT!", "ALMOST GONE", "INSTANT WIN"), confetti burst micro-animation on ticket purchase, subtle four-leaf-clover pattern as a background texture (very low opacity) behind hero sections.

Motion: countdown timers with a gentle pulse when under 1 hour left; progress bars fill with a shimmer animation; buttons have a small "wobble" hover state to feel playful, not corporate.

4. Core Pages

Homepage

Hero: rotating banner of the top 3 live "big" competitions (prize photo, price, ticket progress bar, countdown).

"Live Competitions" grid: filterable by category (Cars, Tech, Cash, Holidays, £1 Instant Wins), sortable by ending soonest / most popular / price.

Each competition card shows: prize image, title, price per ticket, tickets sold progress bar with percentage, countdown timer, "odds" (e.g. "1 in 4,000"), and an "Instant Win" ribbon if applicable.

"How It Works" 3-step strip: Pick tickets → Answer the skill question → We draw it live.

Winners Wall carousel: photo/video testimonials, prize handed over, big goofy grin, name + town (e.g. "Dave from Cardiff, won the Defender").

Trust strip: "Every draw streamed live", "Free postal entry available", "Verified winners", "UK company, UK support".

Newsletter/SMS opt-in for new comp alerts.

Competition Detail Page

Image gallery/video of the prize.

Ticket selector: quantity stepper, "Lucky Dip" quick-pick button, manual number picker grid (shows taken numbers greyed out).

Live progress bar + tickets remaining + countdown.

Skill question modal appears before checkout is enabled (multiple choice, simple maths/logic question — required by law, keep genuinely answerable but not throwaway-easy).

Instant win reveal mechanic if the comp has instant-win tickets (scratch-style reveal animation post-purchase).

Full T&Cs, prize cash-alternative value, closing date, and a clearly linked "Free Entry Route" (postal entry instructions — required for UK compliance).

Related/similar competitions carousel at the bottom.

Cart & Checkout

Stripe-based checkout, guest checkout allowed, account creation optional at point of purchase.

Order summary shows ticket numbers assigned, comp name, skill-question answer confirmation.

Post-purchase confetti animation + "You're in the draw, you lucky git" confirmation screen with social share buttons.

Account Dashboard

"My Entries" (active competitions + ticket numbers), "My Wins", order history, referral code + rewards balance, saved payment method, marketing preferences.

Live Draw Page

Public page listing upcoming scheduled draws with countdowns, embeds for live stream (placeholder embed component for YouTube/Facebook Live), and a results feed showing winning ticket number + winner name as draws complete.

Winners Wall (full page)

Filterable by prize type/date, grid of winner cards (photo, prize, quote, video if available).

Free Postal Entry Page

Clear, plain-English instructions per current UK format, separate from the humorous tone — this page should read as unambiguously serious and compliant.

Static pages: FAQ, T&Cs, Privacy Policy, Responsible Play / Fair Draw info, Contact/Support, About Us (tell the "why we built this" story with the same self-aware humour).

5. Admin Panel — Fast Competition Creation (this is the priority feature)

Build an authenticated /admin area optimised for creating new competitions in under 2 minutes:

"New Competition" wizard (single-page form, not multi-step where avoidable):

Prize name, category, short + long description

Image/video upload (multi-image gallery)

Ticket price, total ticket count, max tickets per person

Close date/time (auto-countdown), auto-draw toggle (draw fires automatically when sold out or time expires, whichever first)

Skill question builder (question + 4 answer options + correct answer flag)

Optional: instant-win tickets (set specific ticket numbers or a random % to be instant winners, with their own smaller prizes)

Cash alternative value field (for compliance)

Status toggle: Draft / Live / Paused / Ended / Drawn

"Duplicate competition" button on every existing comp — clones all fields so recurring comp types (e.g. weekly £1 instant wins) can be relaunched in one click with just date/price tweaks.

Competition templates: save any comp as a reusable template (e.g. "Weekly Cash Draw Template").

Bulk actions: pause/resume/end multiple comps at once.

Draw tool: one-click random ticket-number draw with an on-screen animated wheel/reveal (for recording the live draw), auto-fills winner into Winners Wall once confirmed.

Dashboard analytics: tickets sold vs remaining per comp, revenue per comp, conversion rate, top referrers.

6. Data Model (Supabase)

Suggested tables: competitions, tickets, orders, users, skill_questions, instant_wins, winners, referrals, draw_logs. Tickets should be individually numbered rows linked to competition_id and order_id so number-picking and "taken number" checks are real-time accurate (use Supabase realtime or row locking to prevent double-selling a ticket number).

7. Integrations

Stripe for checkout (one-off payments; consider Stripe subscriptions later for a "sub club" of monthly ticket credit).

Resend for order confirmations, draw reminders, and winner notification emails (in the same cheeky-but-trustworthy voice).

Supabase Auth for accounts.

Placeholder components for a live-stream embed and for SMS notifications (Twilio) on draw day.

8. Compliance Notes to Build In (not just legal text)

Skill question must be shown and answered before any ticket purchase completes.

Free postal entry route must be linked from every competition page, not buried.

Display the cash-alternative value of every prize.

Keep a visible, dated log of past draws and winners for transparency.

Build this as a modern responsive React app, mobile-first (most entrants will buy tickets from their phone at the pub). Prioritise the homepage, competition detail page, checkout flow, and the admin "New Competition" wizard first — those four screens are the whole business.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://lucky-git-wins.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c368be97-a3f0-4855-a39b-0e99d8063688).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
