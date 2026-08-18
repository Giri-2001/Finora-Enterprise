/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   CUSTOMERS RESPONSIVE ENGINE
   CENTRAL EXPORTS

   RESPONSIBILITY:
   - Customers Responsive Engine public exports ONLY
   - Single public import entry point
   - No visual values
   - No breakpoint calculations
   - No layout calculations
   - No React logic

   ARCHITECTURE:

   customers.types.ts
   customers.breakpoints.ts
   customers.helpers.ts
   customers.tokens.ts
   customers.layout.ts
   customers.useResponsive.ts
        ↓
   customers.index.ts

   IMPORTANT:
   - Global responsive contracts remain in ../types
   - Customer-specific compatibility types remain in
     customers.types.ts
   - Customer layout contracts are owned by customers.layout.ts
   - This file exports ONLY members that actually exist
   - Device system contains ONLY:
       01. MOBILE
       02. TABLET
       03. LAPTOP
       04. DESKTOP
=========================================================== */


/* ===========================================================
   CUSTOMER TYPES
=========================================================== */

/*
 * Customers-specific compatibility contracts.
 *
 * Do not create duplicate responsive contracts here.
 * Global contracts remain owned by ../types.
 */

export type {
  CustomersResponsiveState,
  CustomersResponsiveActions,
  CustomersResponsiveDetails,
  CustomersResponsiveValue,
  CustomersResponsiveNumber,
  CustomersResponsiveString,
  CustomersResponsiveDimension,
  CustomersResponsiveBoolean,
} from "./customers.types";


/* ===========================================================
   CUSTOMER LAYOUT TYPES
=========================================================== */

export type {
  CustomerLayout,
  CustomerGridLayout,
  CustomerCardLayout,
  CustomerTableLayout,
  CustomerFormLayout,
  CustomerPageLayout,
  CustomerLayoutInput,
  CustomerResponsiveDevice,
  CustomerResponsiveState,
  CustomerResponsiveTokens,
} from "./customers.layout";


/* ===========================================================
   BREAKPOINTS
=========================================================== */

/*
 * Customers uses the canonical four-device responsive system.
 *
 * Device classes:
 *
 *   Mobile
 *   Tablet
 *   Laptop
 *   Desktop
 *
 * No additional device classifications are exported here.
 */

export {
  CUSTOMERS_MOBILE_MIN_WIDTH,
  CUSTOMERS_MOBILE_MAX_WIDTH,

  CUSTOMERS_TABLET_MIN_WIDTH,
  CUSTOMERS_TABLET_MAX_WIDTH,

  CUSTOMERS_LAPTOP_MIN_WIDTH,
  CUSTOMERS_LAPTOP_MAX_WIDTH,

  CUSTOMERS_DESKTOP_MIN_WIDTH,

  CUSTOMERS_MOBILE,
  CUSTOMERS_TABLET,
  CUSTOMERS_LAPTOP,
  CUSTOMERS_DESKTOP,

  isCustomersMobileWidth,
  isCustomersTabletWidth,
  isCustomersLaptopWidth,
  isCustomersDesktopWidth,

  isValidCustomersViewportWidth,
} from "./customers.breakpoints";


/* ===========================================================
   HELPERS
=========================================================== */

export {
  normalizeCustomerWidth,
  normalizeCustomerHeight,
  normalizeCustomerViewport,

  getCustomerDevice,
  resolveCustomerDevice,

  getCustomerDeviceIndex,

  getCustomerViewport,
  resolveCustomerViewport,

  isCustomerMobile,
  isCustomerTablet,
  isCustomerLaptop,
  isCustomerDesktop,

  isValidCustomerViewportWidth,
  isValidCustomerViewport,

  getCustomerDeviceFlags,

  isCustomerMobileOrTablet,
  isCustomerLaptopOrAbove,
  isCustomerDesktopOrAbove,

  isCustomerLargeDisplay,

  getCustomerBreakpointName,

  getCustomerResponsiveProfile,

  isCustomerWidthBetween,
  isCustomerBreakpointBoundary,
} from "./customers.helpers";


/* ===========================================================
   TOKENS
=========================================================== */

/*
 * customers.tokens.ts currently exposes getCustomerTokens()
 * as the public token resolver.
 *
 * Do not export non-existing compatibility names such as:
 *
 * - resolveCustomerTokens
 * - CUSTOMER_TOKENS
 */

export {
  getCustomerTokens,
} from "./customers.tokens";


/* ===========================================================
   LAYOUT
=========================================================== */

export {
  getSafeCustomerWidth,
  getSafeCustomerHeight,

  resolveCustomerLayoutState,
  resolveCustomerLayoutTokens,
  resolveCustomerLayoutDevice,

  getCustomerPageLayout,
  getCustomerGridLayout,
  getCustomerCardLayout,
  getCustomerTableLayout,
  getCustomerFormLayout,

  getCustomerLayout,
  getCustomerResponsiveLayout,

  getCustomerContentWidth,
  getCustomerGridWidth,
  getCustomerCardWidth,
  getCustomerGridColumnCount,
  getCustomerGridHeight,

  getCustomerListMinimumHeight,
  getCustomerFormWidth,
  getCustomerTableWidth,

  isValidCustomerLayoutWidth,
  isValidCustomerLayoutHeight,

  createCustomerLayoutSnapshot,
} from "./customers.layout";


/* ===========================================================
   RESPONSIVE HOOKS
=========================================================== */

export {
  useCustomerViewport,
  useCustomerResponsive,
  useCustomerDevice,
  useCustomerResponsiveState,
  useCustomerResponsiveTokens,
  useCustomerResponsiveLayout,
} from "./customers.useResponsive";


/* ===========================================================
   ENGINE VERSION
=========================================================== */

export const CUSTOMERS_RESPONSIVE_ENGINE =
  "FINORA-CUSTOMERS-RESPONSIVE-ENGINE";


/* ===========================================================
   END
=========================================================== */