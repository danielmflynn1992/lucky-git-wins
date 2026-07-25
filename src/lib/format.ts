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