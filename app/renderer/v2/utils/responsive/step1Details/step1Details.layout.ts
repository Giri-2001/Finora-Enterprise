/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN STUDIO
   STEP 1 — DETAILS

   RESPONSIVE LAYOUT FACTORY

   RESPONSIBILITY:
   - Convert Step 1 responsive tokens into CSS geometry.
   - No breakpoint detection.
   - No business logic.
   - No theme colour ownership.

   VERSION : 1.1
   STATUS  : Production
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { CSSProperties } from "react";

import type { Step1DetailsResponsiveTokens } from "./step1Details.types";

/* ===========================================================
   WORKSPACE
=========================================================== */

export function createStep1DetailsWorkspaceStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    minWidth: 0,

    minHeight: 0,

    display: "grid",

    gridTemplateRows: "auto auto",

    gap: `${tokens.pageGap}px`,

    boxSizing: "border-box",
  };
}

/* ===========================================================
   TOP AREA
=========================================================== */

export function createStep1DetailsTopStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  if (tokens.viewport === "laptop" || tokens.viewport === "desktop") {
    return {
      width: "100%",

      minWidth: 0,

      display: "grid",

      gridTemplateColumns: "minmax(240px, 30%) minmax(0, 70%)",

      gap: `${tokens.topGap}px`,

      alignItems: "stretch",

      boxSizing: "border-box",
    };
  }

  return {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: `repeat(${tokens.topColumns}, minmax(0, 1fr))`,

    gap: `${tokens.topGap}px`,

    alignItems: "stretch",

    boxSizing: "border-box",
  };
}

/* ===========================================================
   CUSTOMER PANEL
=========================================================== */

export function createStep1DetailsCustomerStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    minWidth: 0,

    minHeight: 0,

    alignSelf: "stretch",

    justifySelf: "stretch",

    display: "flex",

    flexDirection: "column",

    boxSizing: "border-box",

    overflow: "visible",
  };
}

/* ===========================================================
   STATISTICS PANEL
=========================================================== */

export function createStep1DetailsOverviewStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    minWidth: 0,

    minHeight: 0,

    alignSelf: "stretch",

    justifySelf: "stretch",

    display: "flex",

    flexDirection: "column",

    boxSizing: "border-box",

    overflow: "visible",
  };
}

/* ===========================================================
   STATISTICS GRID
=========================================================== */

export function createStep1DetailsStatisticsGridStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: `repeat(${tokens.statisticsColumns}, minmax(0, 1fr))`,

    gap: `${tokens.statisticsGap}px`,

    boxSizing: "border-box",
  };
}

/* ===========================================================
   MAIN AREA
=========================================================== */

export function createStep1DetailsMainStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  if (tokens.viewport === "laptop" || tokens.viewport === "desktop") {
    return {
      width: "100%",

      minWidth: 0,

      minHeight: 0,

      display: "grid",

      gridTemplateColumns: `${tokens.formWidth} ${tokens.previewWidth}`,

      gap: `${tokens.mainGap}px`,

      alignItems: "start",

      boxSizing: "border-box",
    };
  }

  return {
    width: "100%",

    minWidth: 0,

    minHeight: 0,

    display: "grid",

    gridTemplateColumns: "minmax(0, 1fr)",

    gap: `${tokens.mainGap}px`,

    alignItems: "start",

    boxSizing: "border-box",
  };
}

/* ===========================================================
   FORM WRAPPER
=========================================================== */

export function createStep1DetailsFormStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    minWidth: 0,

    minHeight: 0,

    alignSelf: "stretch",

    justifySelf: "stretch",

    boxSizing: "border-box",

    overflow: "visible",
  };
}

/* ===========================================================
   FORM FIELD GRID
=========================================================== */

export function createStep1DetailsFormGridStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: `repeat(${tokens.formColumns}, minmax(0, 1fr))`,

    columnGap: `${tokens.formColumnGap}px`,

    rowGap: `${tokens.formRowGap}px`,

    boxSizing: "border-box",

    alignItems: "start",
  };
}

/* ===========================================================
   PREVIEW
=========================================================== */

export function createStep1DetailsPreviewStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    minWidth: 0,

    minHeight: 0,

    alignSelf: "stretch",

    justifySelf: "stretch",

    boxSizing: "border-box",

    overflow: "visible",
  };
}

/* ===========================================================
   FOOTER STEP GRID
=========================================================== */

export function createStep1DetailsFooterStepGridStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: `repeat(${tokens.footerStepColumns}, minmax(0, 1fr))`,

    gap: `${tokens.footerStepGap}px`,

    boxSizing: "border-box",

    alignItems: "center",
  };
}

/* ===========================================================
   FOOTER NAVIGATION

   IMPORTANT:
   - Consume footerNavigationColumns directly.
   - No hard-coded mobile/tablet breakpoint logic.
   - Token contract remains the single source of truth.

   Mobile  → 1 column
   Tablet  → 2 columns
   Laptop  → 2 columns
   Desktop → 2 columns
=========================================================== */

export function createStep1DetailsFooterNavigationStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: `repeat(${tokens.footerNavigationColumns}, minmax(0, auto))`,

    gap: `${tokens.footerStepGap}px`,

    alignItems: "center",

    justifyContent: "end",

    boxSizing: "border-box",
  };
}

/* ===========================================================
   FOOTER CONTAINER
=========================================================== */

export function createStep1DetailsFooterStyle(
  tokens: Step1DetailsResponsiveTokens,
): CSSProperties {
  const compact = tokens.viewport === "mobile" || tokens.viewport === "tablet";

  return {
    width: "100%",

    minWidth: 0,

    display: "flex",

    flexDirection: compact ? "column" : "row",

    alignItems: compact ? "stretch" : "center",

    gap: `${tokens.footerStepGap}px`,

    boxSizing: "border-box",
  };
}

/* ===========================================================
   END
=========================================================== */
