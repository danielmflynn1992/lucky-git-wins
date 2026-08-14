/**
 * Statutory company details, shown in the footer on every page.
 *
 * TODO(client): replace COMPANY_NUMBER and REGISTERED_OFFICE with the real
 * Companies House number and registered address before launch. These are the
 * only two placeholder values left on the site.
 */
export const COMPANY_NAME = "Lucky Git Comps Ltd";
export const COMPANY_NUMBER = "[XXXXXXXX]";
export const REGISTERED_OFFICE = "[Registered office address]";
export const SUPPORT_EMAIL = "hello@luckygitcomps.co.uk";
export const LEGAL_EMAIL = "legal@luckygitcomps.co.uk";
export const FREE_ENTRY_EMAIL = "freeentry@luckygitcomps.co.uk";

/** Postal address for free entries, printed on /free-entry. */
export const FREE_ENTRY_ADDRESS = `${COMPANY_NAME} — Free Entry`;

/** A value is a placeholder if it's empty or still wrapped in brackets. */
function isPlaceholder(v: string): boolean {
  return !v.trim() || /^\[.*\]$/.test(v.trim());
}

export const HAS_REAL_COMPANY_DETAILS =
  !isPlaceholder(COMPANY_NUMBER) && !isPlaceholder(REGISTERED_OFFICE);

/**
 * Statutory line for the footer. Until the real Companies House number and
 * registered address are set above, we print the safe short form rather than
 * leaking bracketed placeholders onto production.
 */
export const COMPANY_LINE = HAS_REAL_COMPANY_DETAILS
  ? `${COMPANY_NAME} · Company No. ${COMPANY_NUMBER} · Registered office: ${REGISTERED_OFFICE} · Registered in England & Wales`
  : `${COMPANY_NAME} · Registered in England & Wales`;
