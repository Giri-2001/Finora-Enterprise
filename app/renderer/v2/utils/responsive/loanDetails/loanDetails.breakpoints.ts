// ============================================================
// FINORA ENTERPRISE OS™
// LOAN DETAILS — RESPONSIVE ENGINE
// BREAKPOINTS
// ============================================================

export const LOAN_DETAILS_BREAKPOINTS = {
  mobile: 767,
  tablet: 1023,
  laptop: 1279,
} as const;

export type LoanDetailsViewport = "mobile" | "tablet" | "laptop" | "desktop";

export function getLoanDetailsViewport(width: number): LoanDetailsViewport {
  if (width <= LOAN_DETAILS_BREAKPOINTS.mobile) {
    return "mobile";
  }

  if (width <= LOAN_DETAILS_BREAKPOINTS.tablet) {
    return "tablet";
  }

  if (width <= LOAN_DETAILS_BREAKPOINTS.laptop) {
    return "laptop";
  }

  return "desktop";
}
