/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN STUDIO
   STEP 1 — DETAILS

   RESPONSIVE TYPES

   RESPONSIBILITY:
   - Define responsive geometry contract.
   - No breakpoint calculation.
   - No business logic.
   - No UI rendering.

   VERSION : 1.0
   STATUS  : Production
=========================================================== */

/* ===========================================================
   VIEWPORT
=========================================================== */

export type Step1DetailsViewport = "mobile" | "tablet" | "laptop" | "desktop";

/* ===========================================================
   RESPONSIVE TOKENS
=========================================================== */

export interface Step1DetailsResponsiveTokens {
  viewport: Step1DetailsViewport;

  /* ---------------------------------------------------------
     TOP WORKSPACE
  --------------------------------------------------------- */

  topColumns: number;

  topGap: number;

  /* ---------------------------------------------------------
     STATISTICS
     
     Desktop:
       3 statistic cards

     Tablet:
       2 cards per row

     Mobile:
       1 card per row
  --------------------------------------------------------- */

  statisticsColumns: number;

  statisticsGap: number;

  /* ---------------------------------------------------------
     MAIN WORKSPACE
  --------------------------------------------------------- */

  mainColumns: number;

  formWidth: string;

  previewWidth: string;

  mainGap: number;

  /* ---------------------------------------------------------
     FORM
  --------------------------------------------------------- */

  formColumns: number;

  formColumnGap: number;

  formRowGap: number;

  /* ---------------------------------------------------------
     FOOTER
  --------------------------------------------------------- */

  footerStepColumns: number;

  footerStepGap: number;

  footerNavigationColumns: number;

  /* ---------------------------------------------------------
     GENERAL
  --------------------------------------------------------- */

  pageGap: number;

  minWidth: number;
}

/* ===========================================================
   END
=========================================================== */
