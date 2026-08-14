/**
 * Public winner identity. We publish a chosen display name and town — never
 * anything derived from an email address. Anything that looks like an address
 * (or is missing) collapses to the ticket-holder fallback.
 */
export function publicWinnerName(raw: string | null | undefined, ticketNumber: number | null | undefined): string {
  const name = (raw ?? "").trim();
  const fallback = ticketNumber ? `Ticket #${ticketNumber} holder` : "Ticket holder";
  if (!name) return fallback;
  if (name.includes("@") || /\.(com|co\.uk|net|org)$/i.test(name)) return fallback;
  return name;
}
