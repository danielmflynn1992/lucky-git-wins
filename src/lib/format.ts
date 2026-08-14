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
 * Human countdown phrasing: "1d 4h" over a day, "18h 23m" over an hour,
 * "23m" under the hour, "45s" in the last minute.
 */
export function humanTimeLeft(t: { d: number; h: number; m: number; s: number; total: number }) {
  if (t.total <= 0) return "Closed";
  if (t.d > 0) return `${t.d}d ${t.h}h`;
  if (t.h > 0) return `${t.h}h ${t.m}m`;
  if (t.m > 0) return `${t.m}m`;
  return `${t.s}s`;
}

/** Precise digits, kept for tooltips/title attributes. */
export function exactTimeLeft(t: { d: number; h: number; m: number; s: number }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(t.d)}d ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`;
}

/** Rotating deadpan loading lines. */
export const LOADING_QUIPS = ["Hang about…", "Two ticks…", "Won't be a sec…"] as const;
export function pickLoadingQuip() {
  return LOADING_QUIPS[Math.floor(Math.random() * LOADING_QUIPS.length)];
}
/**
 * Dates are always rendered in UK time. The server runs in UTC and browsers
 * run wherever the punter is — pinning the zone is what keeps SSR and the
 * client byte-identical, so no hydration mismatch.
 */
const UK = "Europe/London";

export function ukDate(iso: string | number | Date): string {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: UK });
}

export function ukDateTime(iso: string | number | Date): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: UK,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ukTime(iso: string | number | Date): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: UK,
    hour: "2-digit",
    minute: "2-digit",
  });
}
