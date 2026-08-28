/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN RESPONSIVE ENGINE

   CENTRAL EXPORTS

   MODULE  : Gold Loan
   LAYER   : Responsive Public API
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Expose Gold Loan responsive contracts
   - Expose Gold Loan responsive boundaries
   - Expose Gold Loan responsive helpers
   - Expose Gold Loan responsive tokens
   - Expose Gold Loan responsive layout resolver
   - Expose Gold Loan responsive React hook

   IMPORTANT:

   Gold Loan components should preferably import from:

   utils/responsive/goldloan/goldLoan.index

   instead of importing internal responsive files directly.

=========================================================== */

/* ===========================================================
   TYPES
=========================================================== */

export type {
  GoldLoanResponsiveDevice,
  GoldLoanResponsiveState,
  GoldLoanResponsiveTokens,
  GoldLoanViewport,
  GoldLoanDeviceFlags,
  GoldLoanResponsiveDetails,
  GoldLoanPageLayout,
  GoldLoanTopWorkspaceLayout,
  GoldLoanCustomerSelectorLayout,
  GoldLoanLockerRoomLayout,
  GoldLoanLockerCardLayout,
  GoldLoanRackGridLayout,
  GoldLoanRackCardLayout,
  GoldLoanFormLayout,
  GoldLoanValuationLayout,
  GoldLoanItemsLayout,
  GoldLoanStorageAllocationLayout,
  GoldLoanActionLayout,
  GoldLoanLayout,
  GoldLoanLayoutInput,
  GoldLoanResponsiveValue,
  GoldLoanResponsiveSnapshot,
  GoldLoanResponsiveNumber,
  GoldLoanResponsiveString,
  GoldLoanResponsiveBoolean,
  GoldLoanResponsiveDimension,
} from "./goldLoan.types";

/* ===========================================================
   BREAKPOINTS
=========================================================== */

export {
  GOLD_LOAN_MOBILE_MIN_WIDTH,
  GOLD_LOAN_MOBILE_MAX_WIDTH,
  GOLD_LOAN_TABLET_MIN_WIDTH,
  GOLD_LOAN_TABLET_MAX_WIDTH,
  GOLD_LOAN_LAPTOP_MIN_WIDTH,
  GOLD_LOAN_LAPTOP_MAX_WIDTH,
  GOLD_LOAN_DESKTOP_MIN_WIDTH,
  GOLD_LOAN_MOBILE,
  GOLD_LOAN_TABLET,
  GOLD_LOAN_LAPTOP,
  GOLD_LOAN_DESKTOP,
  isValidGoldLoanViewportWidth,
  isGoldLoanMobileWidth,
  isGoldLoanTabletWidth,
  isGoldLoanLaptopWidth,
  isGoldLoanDesktopWidth,
  isGoldLoanCompactWidth,
  isGoldLoanLargeWidth,
  isGoldLoanBreakpointBoundary,
  isGoldLoanWidthBetween,
} from "./goldLoan.breakpoints";

/* ===========================================================
   HELPERS
=========================================================== */

export {
  GOLD_LOAN_FALLBACK_WIDTH,
  GOLD_LOAN_FALLBACK_HEIGHT,
  getSafeGoldLoanViewportDimension,
  getSafeGoldLoanViewportWidth,
  getSafeGoldLoanViewportHeight,
  resolveGoldLoanDevice,
  resolveGoldLoanDeviceFlags,
  resolveGoldLoanDeviceFlagsFromWidth,
  createGoldLoanViewport,
  isGoldLoanCompactDevice,
  isGoldLoanLargeDevice,
  shouldStackGoldLoanTopWorkspace,
  resolveGoldLoanFormFieldColumns,
  resolveGoldLoanItemColumns,
  resolveGoldLoanRackColumns,
  resolveGoldLoanLockerColumns,
  resolveGoldLoanSummaryColumns,
  resolveGoldLoanActionColumns,
  clampGoldLoanResponsiveValue,
} from "./goldLoan.helpers";

/* ===========================================================
   TOKENS
=========================================================== */

export {
  GOLD_LOAN_FONT_FAMILY,
  getGoldLoanModuleTokens,
} from "./goldLoan.tokens";

export type {
  GoldLoanTypographyTokens,
  GoldLoanSpacingTokens,
  GoldLoanControlTokens,
  GoldLoanPanelTokens,
  GoldLoanCustomerSelectorTokens,
  GoldLoanLockerTokens,
  GoldLoanRackTokens,
  GoldLoanItemTokens,
  GoldLoanMetricTokens,
  GoldLoanModuleTokens,
} from "./goldLoan.tokens";

/* ===========================================================
   LAYOUT
=========================================================== */

export { createGoldLoanLayout } from "./goldLoan.layout";

/* ===========================================================
   REACT HOOK
=========================================================== */

export { useGoldLoanResponsive } from "./goldLoan.useResponsive";

export { default as useGoldLoanResponsiveDefault } from "./goldLoan.useResponsive";

/* ===========================================================
   END
=========================================================== */
