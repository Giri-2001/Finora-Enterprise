// ============================================================
// FINORA ENTERPRISE OS™
// LOAN DETAILS — RESPONSIVE ENGINE
// HELPERS
// ============================================================

import type { LoanDetailsViewport } from "./loanDetails.breakpoints";

// ============================================================
// VIEWPORT HELPERS
// ============================================================

export function isLoanDetailsMobile(viewport: LoanDetailsViewport): boolean {
  return viewport === "mobile";
}

export function isLoanDetailsTablet(viewport: LoanDetailsViewport): boolean {
  return viewport === "tablet";
}

export function isLoanDetailsLaptop(viewport: LoanDetailsViewport): boolean {
  return viewport === "laptop";
}

export function isLoanDetailsDesktop(viewport: LoanDetailsViewport): boolean {
  return viewport === "desktop";
}

// ============================================================
// GROUP HELPERS
// ============================================================

export function isLoanDetailsSmallScreen(
  viewport: LoanDetailsViewport,
): boolean {
  return viewport === "mobile" || viewport === "tablet";
}

export function isLoanDetailsLargeScreen(
  viewport: LoanDetailsViewport,
): boolean {
  return viewport === "laptop" || viewport === "desktop";
}

// ============================================================
// FORM HELPERS
// ============================================================

export function getLoanDetailsFormColumnCount(
  viewport: LoanDetailsViewport,
): number {
  if (viewport === "mobile") {
    return 1;
  }

  if (viewport === "tablet") {
    return 2;
  }

  return 4;
}

// ============================================================
// SUMMARY HELPERS
// ============================================================

export function getLoanDetailsSummaryColumnCount(
  viewport: LoanDetailsViewport,
): number {
  if (viewport === "mobile") {
    return 1;
  }

  if (viewport === "tablet") {
    return 2;
  }

  return 3;
}

// ============================================================
// FOOTER HELPERS
// ============================================================

export function getLoanDetailsFooterColumnCount(
  viewport: LoanDetailsViewport,
): number {
  if (viewport === "mobile") {
    return 1;
  }

  if (viewport === "tablet") {
    return 2;
  }

  return 6;
}

// ============================================================
// PREVIEW HELPERS
// ============================================================

export function shouldLoanDetailsPreviewStack(
  viewport: LoanDetailsViewport,
): boolean {
  return viewport === "mobile" || viewport === "tablet";
}
