/**
 * Payout and draw-timing wording. One string, used on every page, so the
 * commitment can never differ between the homepage, the guarantee and the FAQ.
 */
export const DRAW_AND_PAY_LINE =
  "Winner drawn automatically at close. Cash prizes paid within 48 hours by bank transfer.";

/** Odds never vary: every pool is capped at 499 tickets. */
export const FIXED_ODDS_LINE = "1 in 499";

/** How long a closed competition may sit undrawn before we say so out loud. */
export const DRAW_DELAY_GRACE_MS = 15 * 60 * 1000;

export const DRAW_DELAYED_LINE =
  "Draw delayed — investigating. The result will be published and verifiable.";
