# Skill-competition conversion

Convert Lucky Git Comps from a free-entry prize draw to a Section 14 skill competition. Legal defensibility depends on the skill question being server-validated and its difficulty measurable — that shapes every step.

Order follows the priority list you gave. Everything below is one delivery; I'll ship it in the sequence shown so the site is never in a broken half-state (schema first, then payment gate, then draw, then teardown).

---

## 1. Schema migration (single migration, up front)

New:
- `skill_questions` — one row per competition; `question_text`, `option_a..d`, `correct_option` enum `a|b|c|d`. RLS: read-safe columns only for `anon`/`authenticated` via a view/RPC — the raw table blocks `correct_option` to everyone except `service_role`.
- `entry_answers` — append-only evidence log; `order_id`, `user_id`, `competition_id`, `skill_question_id`, `selected_option`, `is_correct`, `answered_at`. No UPDATE/DELETE policies; only INSERT via `SECURITY DEFINER` RPC.
- Trigger on `competitions`: block `status='live'` unless a `skill_questions` row exists.

Changed:
- `tickets`: add `is_qualifying boolean not null default false`, index on `(competition_id, is_qualifying)`; drop `entry_method` column and its enum; drop `is_instant_win`, `instant_win_prize`.
- `competitions`: drop `instant_win`, `instant_win_count`, `instant_win_prize`, `free_entry_enabled`.
- `draws`: add `total_sold`, `qualifying_pool_size` (int, nullable for legacy rows).

Removed:
- `free_entries` table (drop).
- Instant-win logic in `create_competition_with_tickets` — rewrite to also create the `skill_questions` row atomically. Signature loses `p_instant_win*`; gains `p_question`, `p_options` (text[4]), `p_correct_option`.
- `submit_free_entry` function.

Rewritten:
- `draw_competition`: pool = `tickets WHERE is_qualifying = true`. Persist `total_sold` + `qualifying_pool_size` on the draws row. If pool = 0, insert a `draws` row with `status='void_no_qualifying'` and flag the competition; T&Cs will state that this triggers a fallback draw across all sold tickets (implemented as a second pass in the same function, recorded distinctly).
- New RPC `submit_skill_answer(p_order_id, p_question_id, p_selected)` — `SECURITY DEFINER`, reads `correct_option` server-side, writes `entry_answers`, flips `tickets.is_qualifying` on the order's tickets, returns `{ is_correct: boolean }` only. Never returns the correct option.
- Public view `skill_questions_public` exposing `id, competition_id, question_text, option_a..d` (no `correct_option`). Client reads from this view.

**Age gate:** add `date_of_birth date` to `profiles`; trigger blocks insert/update where age < 18. Guest checkout stores an `age_confirmed_at` timestamp on the order row.

## 2. Payment gate (checkout)

- After ticket selection, before Stripe redirect, render `<SkillQuestionStep>` with radiogroup semantics (arrow keys, visible focus ring, no timer).
- Fetch question via `skill_questions_public` — verify the network payload contains no `correct_option` field (Playwright assertion in the E2E test).
- Submit calls `submit_skill_answer` server-side. Payment button disabled until submission returns.
- Prominent warning block above the pay button — black rule border, `--color-ink-red` heading, cream fill:
  > **Answer correctly to enter the draw.** Tickets bought against an incorrect answer will not be entered. This is a competition of skill.
- Same block appears on the competition detail page above the ticket selector.
- One answer per order. On wrong answer: order proceeds, tickets issue as `is_qualifying=false`, confirmation email + `/account` show "Not entered — incorrect answer" after the draw closes only.

## 3. Draw

Covered by the rewritten `draw_competition` above. Public surfaces updated:
- `/past-draws` and the per-draw result page display `qualifying_pool_size / total_sold` and note when a fallback ran.
- `/promise` and `/verify` copy updated to explain the qualifying-pool basis for the HMAC.

## 4. Teardown

- Delete `src/routes/free-entry.tsx`.
- Rename `src/routes/legal-structure.tsx` → `src/routes/how-entry-works.tsx`; rewrite copy for the skill basis.
- Delete `StampMark` variant `INSTANT WIN`, remove `£1 Instant Wins` from `CATEGORIES`, purge related mock data.
- Delete `ScratchPanel` (grep confirms it's only used for instant-win reveals).
- Purge "free entry / postal / no purchase necessary" copy from `SiteFooter`, `SiteNav`, `CompCard`, `/faq`, `/about`, `/terms`, `/how-it-works`, `/promise`.
- Remove instant-win section from admin wizard.

## 5. Admin

- Wizard: new required "Skill Question" step (text + 4 options + correct flag) with inline guidance about not making the answer findable on-page. Cannot save `status='live'` without it (mirrors the DB trigger).
- New `/admin/question-performance` route: table of competition × entries / correct / incorrect / % incorrect, aggregate row at the top, warning row on any comp < 10% incorrect. "Export CSV" button (client-side blob).

## 6. Legal, age, footer

- Registration form: DOB picker, `18+ only` copy, blocks under-18 client-side and server-side (trigger).
- Guest checkout: mandatory 18+ checkbox writing `age_confirmed_at`.
- Persistent `18+` mark in `SiteFooter`.
- Update `/terms`: full rewrite of the entry-mechanism section to state (a) correct answer required, (b) incorrect = not entered, (c) HMAC selection from qualifying pool, (d) fallback if zero qualifying.
- Update `/faq`: new "Why is there a question?" and "What happens if I get it wrong?".
- Update `/how-it-works`: three steps → pick tickets → answer question → draw runs.

## 7. Accessibility check

`SkillQuestionStep` uses native `<fieldset><legend>` + `role="radiogroup"` + `<input type="radio">`, focus-visible ring in `--color-ink-red`, real text, no timer. E2E test tabs through and submits.

---

## Technical section

**Files changed (new):**
`src/lib/skill-questions.functions.ts`, `src/components/SkillQuestionStep.tsx`, `src/components/SkillWarning.tsx`, `src/routes/how-entry-works.tsx`, `src/routes/admin.question-performance.tsx`, `supabase/migrations/*_skill_competition.sql`

**Files changed (edit):**
`src/routes/checkout.tsx`, `src/routes/competitions.$slug.tsx`, `src/routes/admin.competitions.new.tsx`, `src/routes/past-draws.tsx`, `src/routes/draws.$id.reveal.tsx`, `src/routes/{terms,faq,how-it-works,promise,verify,about}.tsx`, `src/routes/auth.tsx`, `src/components/{SiteNav,SiteFooter,CompCard,CompRow,StampMark}.tsx`, `src/lib/mock-comps.ts`, `src/hooks/use-basket.ts`

**Files deleted:**
`src/routes/free-entry.tsx`, `src/routes/legal-structure.tsx`, `src/components/ScratchPanel.tsx` (subject to grep)

**Deliberate scope choices:**
- No `entry_method` filter/UI anywhere — the column is gone.
- The `correct_option` column is guarded by (a) no SELECT policy for anon/authenticated, (b) reads go through the `skill_questions_public` view which omits it, (c) all comparisons happen inside `SECURITY DEFINER` RPCs. Three layers, because leaking this once ends the business.
- Fallback draw for zero-qualifying case is implemented and labelled distinctly in `draws.notes` and on the public result page, matching what the T&Cs will state.
- No skill-question edit after any entry_answer exists (immutability keeps the evidence log honest — enforced by trigger).
- Age verification stores DOB; the trigger uses `age(dob) >= 18 years` so future birthdays don't slip through.

**Out of scope for this pass** (flag now to avoid surprise):
- Migrating existing purchased tickets to a `is_qualifying` value — I'll set legacy tickets `is_qualifying = true` so any in-flight competitions still draw. Say the word if you want them voided instead.
- Rewriting transactional emails beyond the confirmation "answer result" line.
- Changing the Stripe integration shape — only its trigger (button disabled until answer submitted).