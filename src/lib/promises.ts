/**
 * Every promise the site makes, in one file. Payout timing, the pool cap,
 * the void-question position and the contact addresses all live here so the
 * homepage, the guarantee, the FAQ and the T&Cs can never drift apart.
 */

/** The single timing statement. Used verbatim, everywhere. */
export const TIMING_LINE =
  "Winner drawn automatically at close and announced within 24 hours. Cash paid within 48 hours of winner verification; physical prizes delivered within 7 working days.";

/** Legacy alias — same string, so older imports stay correct. */
export const DRAW_AND_PAY_LINE = TIMING_LINE;

/** The 499 promise is a cap, not a fixed pool size. */
export const POOL_CAP_LINE = "Never more than 499 tickets. Exact pool size always shown.";

/** Odds for a specific competition, stamped the same way everywhere. */
export function oddsLine(total: number): string {
  return `1 in ${total.toLocaleString()}. Full stop.`;
}

/** How long a closed competition may sit undrawn before we say so out loud. */
export const DRAW_DELAY_GRACE_MS = 10 * 60 * 1000;

export const DRAW_DELAYED_LINE =
  "Draw delayed — investigating; the sealed seed means the result cannot be altered.";

/** What happens when nobody gets the question right. */
export const VOID_QUESTION_LINE =
  "If a competition closes with zero correct entries the competition is void: every entrant is refunded in full, no prize is awarded, and the void record is still published on the draw log.";

/** One support address, one privacy address, one domain. */
export const SUPPORT_EMAIL = "support@luckygitcomps.co.uk";
export const PRIVACY_EMAIL = "privacy@luckygitcomps.co.uk";

/** Provider-neutral payments wording. */
export const PAYMENTS_LINE =
  "Card payments are processed by our PCI-DSS-compliant payment provider; we never store card details.";

/** Shown at the foot of the legal pages. */
export const LEGAL_LAST_UPDATED = "14 August 2026";
