/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN STUDIO
   STEP 1 — DETAILS

   PUBLIC RESPONSIVE API

   VERSION : 1.0
   STATUS  : Production
=========================================================== */

/* ===========================================================
   BREAKPOINTS
=========================================================== */

export {
  STEP1_DETAILS_BREAKPOINTS,
  resolveStep1DetailsViewport,
} from "./step1Details.breakpoints";

/* ===========================================================
   TYPES
=========================================================== */

export type {
  Step1DetailsViewport,
  Step1DetailsResponsiveTokens,
} from "./step1Details.types";

/* ===========================================================
   TOKENS
=========================================================== */

export {
  MOBILE_STEP1_DETAILS_TOKENS,
  TABLET_STEP1_DETAILS_TOKENS,
  LAPTOP_STEP1_DETAILS_TOKENS,
  DESKTOP_STEP1_DETAILS_TOKENS,
  DEFAULT_STEP1_DETAILS_TOKENS,
  getStep1DetailsTokens,
  getStep1DetailsTokensByWidth,
} from "./step1Details.tokens";

/* ===========================================================
   LAYOUT
=========================================================== */

export {
  createStep1DetailsWorkspaceStyle,
  createStep1DetailsTopStyle,
  createStep1DetailsCustomerStyle,
  createStep1DetailsOverviewStyle,
  createStep1DetailsStatisticsGridStyle,
  createStep1DetailsMainStyle,
  createStep1DetailsFormStyle,
  createStep1DetailsFormGridStyle,
  createStep1DetailsPreviewStyle,
  createStep1DetailsFooterStepGridStyle,
  createStep1DetailsFooterNavigationStyle,
} from "./step1Details.layout";

/* ===========================================================
   HOOK
=========================================================== */

export { useStep1DetailsResponsive } from "./step1Details.useResponsive";

/* ===========================================================
   END
=========================================================== */
