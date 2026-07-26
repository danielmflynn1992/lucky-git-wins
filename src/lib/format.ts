export const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);

export const shortNumber = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);

export function timeLeft(target: Date | string) {
  const t = typeof target === "string" ? new Date(target).getTime() : target.getTime();
  const diff = Math.max(0, t - Date.now());
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff / 3_600_000) % 24);
  const m = Math.floor((diff / 60_000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return { d, h, m, s, total: diff, urgent: diff < 3_600_000 };
}

/**
 * Cockney money slang for common round figures. Returns null when the amount
 * isn't one of the recognised values so callers can render nothing rather
 * than fake it.
 */
const MONEY_SLANG: Record<number, string> = {
  25: "a pony",
  50: "a bullseye",
  100: "a ton",
  500: "a monkey",
  1000: "a bag of sand",
  25000: "a lot of monkeys",
};
export function moneySlang(amount: number): string | null {
  return MONEY_SLANG[amount] ?? null;
}

/** Rotating deadpan loading lines. */
export const LOADING_QUIPS = ["Hang about…", "Two ticks…", "Won't be a sec…"] as const;
export function pickLoadingQuip() {
  return LOADING_QUIPS[Math.floor(Math.random() * LOADING_QUIPS.length)];
}