// ============================================================
// FINORA ENTERPRISE OS™
// LOANS OFFICE RESPONSIVE ENGINE
// HELPERS
// ============================================================

import {
  LOANS_OFFICE_BREAKPOINTS,
  type LoansOfficeViewport,
} from "./loansOffice.breakpoints";

export function getLoansOfficeViewport(width: number): LoansOfficeViewport {
  if (width <= LOANS_OFFICE_BREAKPOINTS.mobileMax) {
    return "mobile";
  }

  if (width <= LOANS_OFFICE_BREAKPOINTS.tabletMax) {
    return "tablet";
  }

  if (width <= LOANS_OFFICE_BREAKPOINTS.laptopMax) {
    return "laptop";
  }

  return "desktop";
}
