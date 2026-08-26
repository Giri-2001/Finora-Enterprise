// ============================================================
// FINORA ENTERPRISE OS™
// LOAN DETAILS — RESPONSIVE ENGINE
// PUBLIC EXPORTS
// ============================================================

// ============================================================
// BREAKPOINTS
// ============================================================

export {
  LOAN_DETAILS_BREAKPOINTS,
  getLoanDetailsViewport,
} from "./loanDetails.breakpoints";

export type { LoanDetailsViewport } from "./loanDetails.breakpoints";

// ============================================================
// TYPES
// ============================================================

export type {
  LoanDetailsLayoutTokens,
  LoanDetailsResponsiveTokens,
  LoanDetailsStyleBuilder,
} from "./loanDetails.types";

// ============================================================
// TOKENS
// ============================================================

export { createLoanDetailsTokens } from "./loanDetails.tokens";

// ============================================================
// LAYOUT
// ============================================================

export {
  createLoanDetailsPageStyle,
  createLoanDetailsCustomerStyle,
  createLoanDetailsSummaryGridStyle,
  createLoanDetailsSummaryCardStyle,
  createLoanDetailsMainContentStyle,
  createLoanDetailsFormSectionStyle,
  createLoanDetailsBasicDetailsGridStyle,
  createLoanDetailsFinancialTermsGridStyle,
  createLoanDetailsDurationGridStyle,
  createLoanDetailsAdditionalInformationGridStyle,
  createLoanDetailsPreviewStyle,
  createLoanDetailsFooterStyle,
  createLoanDetailsFooterStepStyle,
} from "./loanDetails.layout";

// ============================================================
// HELPERS
// ============================================================

export {
  isLoanDetailsMobile,
  isLoanDetailsTablet,
  isLoanDetailsLaptop,
  isLoanDetailsDesktop,
  isLoanDetailsSmallScreen,
  isLoanDetailsLargeScreen,
  getLoanDetailsFormColumnCount,
  getLoanDetailsSummaryColumnCount,
  getLoanDetailsFooterColumnCount,
  shouldLoanDetailsPreviewStack,
} from "./loanDetails.helpers";

// ============================================================
// RESPONSIVE HOOK
// ============================================================

export { useLoanDetailsResponsive } from "./loanDetails.useResponsive";
