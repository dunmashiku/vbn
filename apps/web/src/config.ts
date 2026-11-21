/** Single place for names and links that may change. */
export const PRODUCT_NAME = "Benefits Navigator";
export const COMPANY_NAME = "Selabrook LLC";
export const COPYRIGHT_YEAR = 2026;

/** TODO: replace the placeholder address before sharing the demo outside the meeting. */
export const CONTACT_EMAIL = "partners@selabrook.example";
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${PRODUCT_NAME} for our organization`)}`;

export const LINKS = {
  accreditedRepSearch: "https://www.va.gov/get-help-from-accredited-representative/find-rep/",
  claimSharks: "https://klrd.gov/2026/03/02/briefing-book-2026-veterans-affairs-claim-sharks/",
  crisisLineChat: "https://www.veteranscrisisline.net/get-help-now/chat/",
  crisisLineHome: "https://www.veteranscrisisline.net/",
  vaGov: "https://www.va.gov/",
} as const;

export const DEMO_NOTICE =
  "Prototype for demonstration. General information only. Not affiliated with the U.S. Department of Veterans Affairs.";
