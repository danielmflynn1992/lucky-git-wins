/**
 * Terry's verdict lines for the purchase confirmation.
 * Dry, deadpan, faintly disappointed, warm underneath. No hype, no exclamation marks.
 * Tokens: {lowest} {highest} {count} {n} {comp} {ref}
 */
export const TERRY_VERDICTS: string[] = [
  "Bold. Wouldn't have picked {lowest} meself, but you crack on.",
  "{count} tickets. Someone's feeling brave.",
  "Number {n}? Optimist.",
  "Lucky dip. Trusting the machine — respect.",
  "Same numbers as a bloke from Wigan. He didn't win either. Good luck.",
  "Right, that's yours. Now go and forget about it like a normal person.",
  "{lowest} to {highest}. Spread out like a man hedging his bets.",
  "That's paid, stamped and in the book. Nothing left for you to do.",
  "I've seen worse picks. Not many, mind.",
  "Number {n} again. It's had a quiet decade, that one.",
  "{count} on the slip. Modest. I like modest.",
  "You'll be checking your email on Friday like everyone else. Try not to.",
  "Numbers are numbers, son. The machine can't smell fear.",
  "Kept it sensible. Rare round here.",
  "{highest} is a big number for a man with your nerves.",
  "Down in the ledger. If it goes your way, you never heard it from me.",
  "That's a proper handful of tickets. Hope you enjoyed picking them.",
  "One ticket, one chance, no complaints. Purest way to do it.",
  "Everyone who picks {lowest} tells me it's their lucky one. Statistically, it isn't.",
  "Coupon's in the tin. Tin's under the counter. Counter's watched.",
  "Don't come back Thursday asking me for a nudge. I haven't got one.",
  "Good spread. Won't help, but it looks tidy.",
  "That's a fiver's worth of hope, give or take. Reasonable.",
  "Terry's seen a thousand slips like this. Two of them came good.",
  "Not the numbers I'd have gone for. Then again, I'm still behind this counter.",
  "Signed, sealed, and out of your hands. That's the good bit.",
  "You've got {count}. The draw doesn't care, but I've noted it.",
  "Nice work. Now shut the laptop and go outside.",
  "If {n} comes up I'll eat the sheepskin. Prove me wrong.",
  "It's done. Win or lose, we'll tell you straight either way.",
  "Numbers picked, money taken, honesty maintained. Everyone's happy.",
  "That'll do. Off you pop.",
];

/** Deterministic 32-bit hash so the same buyer sees the same line on refresh. */
export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickVerdict(seed: string, numbers: number[], compTitle: string, ref: string): string {
  const sorted = [...numbers].sort((a, b) => a - b);
  const h = hashSeed(seed);
  const line = TERRY_VERDICTS[h % TERRY_VERDICTS.length];
  const lowest = sorted[0] ?? 0;
  const highest = sorted[sorted.length - 1] ?? 0;
  const n = sorted.length ? sorted[h % sorted.length] : 0;
  const pad = (v: number) => String(v).padStart(4, "0");
  return line
    .replaceAll("{lowest}", pad(lowest))
    .replaceAll("{highest}", pad(highest))
    .replaceAll("{count}", String(numbers.length))
    .replaceAll("{n}", pad(n))
    .replaceAll("{comp}", compTitle)
    .replaceAll("{ref}", ref);
}
