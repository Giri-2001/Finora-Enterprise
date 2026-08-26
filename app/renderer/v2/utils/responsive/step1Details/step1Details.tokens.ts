/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN STUDIO
   STEP 1 — DETAILS

   RESPONSIVE TOKENS

   RESPONSIBILITY:
   - Single source of truth for Step 1 responsive geometry.
   - Mobile / Tablet / Laptop / Desktop contracts.
   - No business logic.
   - No viewport detection.

   VERSION : 1.0
   STATUS  : Production
=========================================================== */

/* ===========================================================
   TYPES
=========================================================== */

import type {
  Step1DetailsResponsiveTokens,
  Step1DetailsViewport,
} from "./step1Details.types";

/* ===========================================================
   MOBILE
   0 — 767px

   CONTRACT:
   - One card per row.
   - One form field per row.
   - One footer step per row.
   - Preview stacks below form.
=========================================================== */

export const MOBILE_STEP1_DETAILS_TOKENS: Step1DetailsResponsiveTokens = {
  viewport: "mobile",

  topColumns: 1,

  topGap: 10,

  statisticsColumns: 1,

  statisticsGap: 10,

  mainColumns: 1,

  formWidth: "100%",

  previewWidth: "100%",

  mainGap: 10,

  formColumns: 1,

  formColumnGap: 8,

  formRowGap: 10,

  footerStepColumns: 1,

  footerStepGap: 8,

  footerNavigationColumns: 1,

  pageGap: 10,

  minWidth: 0,
};

/* ===========================================================
   TABLET
   768 — 1023px

   CONTRACT:
   - Two cards per row.
   - Two form fields per row.
   - Two footer steps per row.
   - Preview remains below form.
=========================================================== */

export const TABLET_STEP1_DETAILS_TOKENS: Step1DetailsResponsiveTokens = {
  viewport: "tablet",

  topColumns: 2,

  topGap: 12,

  statisticsColumns: 2,

  statisticsGap: 12,

  mainColumns: 1,

  formWidth: "100%",

  previewWidth: "100%",

  mainGap: 12,

  formColumns: 2,

  formColumnGap: 10,

  formRowGap: 10,

  footerStepColumns: 2,

  footerStepGap: 10,

  footerNavigationColumns: 2,

  pageGap: 12,

  minWidth: 0,
};

/* ===========================================================
   LAPTOP
   1024 — 1599px

   CONTRACT:
   CURRENT UI PRESERVED.
   - Customer + Statistics side by side.
   - Statistics remain 3 columns.
   - Form remains 4 columns.
   - Preview remains right side.
   - Footer remains one horizontal row.
=========================================================== */

export const LAPTOP_STEP1_DETAILS_TOKENS: Step1DetailsResponsiveTokens = {
  viewport: "laptop",

  topColumns: 2,

  topGap: 10,

  statisticsColumns: 3,

  statisticsGap: 10,

  mainColumns: 2,

  formWidth: "70%",

  previewWidth: "30%",

  mainGap: 10,

  formColumns: 4,

  formColumnGap: 10,

  formRowGap: 10,

  footerStepColumns: 6,

  footerStepGap: 10,

  footerNavigationColumns: 2,

  pageGap: 10,

  minWidth: 0,
};

/* ===========================================================
   DESKTOP
   1600px+

   CONTRACT:
   EXACTLY SAME AS LAPTOP.

   No new desktop geometry is introduced.
=========================================================== */

export const DESKTOP_STEP1_DETAILS_TOKENS: Step1DetailsResponsiveTokens = {
  viewport: "desktop",

  topColumns: 2,

  topGap: 10,

  statisticsColumns: 3,

  statisticsGap: 10,

  mainColumns: 2,

  formWidth: "70%",

  previewWidth: "30%",

  mainGap: 10,

  formColumns: 4,

  formColumnGap: 10,

  formRowGap: 10,

  footerStepColumns: 6,

  footerStepGap: 10,

  footerNavigationColumns: 2,

  pageGap: 10,

  minWidth: 0,
};

/* ===========================================================
   DEVICE TOKEN RESOLVER
=========================================================== */

export function getStep1DetailsTokens(
  viewport: Step1DetailsViewport,
): Step1DetailsResponsiveTokens {
  switch (viewport) {
    case "mobile":
      return MOBILE_STEP1_DETAILS_TOKENS;

    case "tablet":
      return TABLET_STEP1_DETAILS_TOKENS;

    case "laptop":
      return LAPTOP_STEP1_DETAILS_TOKENS;

    case "desktop":
      return DESKTOP_STEP1_DETAILS_TOKENS;
  }
}

/* ===========================================================
   VIEWPORT TOKEN RESOLVER
=========================================================== */

export function getStep1DetailsTokensByWidth(
  width: number,
): Step1DetailsResponsiveTokens {
  if (!Number.isFinite(width) || width < 768) {
    return MOBILE_STEP1_DETAILS_TOKENS;
  }

  if (width < 1024) {
    return TABLET_STEP1_DETAILS_TOKENS;
  }

  if (width < 1600) {
    return LAPTOP_STEP1_DETAILS_TOKENS;
  }

  return DESKTOP_STEP1_DETAILS_TOKENS;
}

/* ===========================================================
   DEFAULT
=========================================================== */

export const DEFAULT_STEP1_DETAILS_TOKENS: Step1DetailsResponsiveTokens =
  LAPTOP_STEP1_DETAILS_TOKENS;

/* ===========================================================
   END
=========================================================== */
