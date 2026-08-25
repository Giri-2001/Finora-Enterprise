/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN STUDIO™
   STEP 1 PRESENTATION STYLES

   RESPONSIBILITY:
   - Step 1 workspace geometry only
   - Responsive geometry from ResponsiveTokens
   - Theme appearance from FINORA Theme CSS variables

   IMPORTANT:
   - No breakpoint detection
   - No media queries
   - No window.innerWidth
   - No business logic
=========================================================== */

import type { CSSProperties } from "react";
import type { ResponsiveTokens } from "../../../../../../utils/responsive";
import { LAPTOP_TOKENS } from "../../../../../../utils/responsive/tokens";

/* ===========================================================
   STYLE FACTORY
=========================================================== */

export interface LoanStudioStep1Styles {
  step1WorkspaceStyle: CSSProperties;
  step1TopStyle: CSSProperties;
  step1BottomStyle: CSSProperties;
  step1CustomerStyle: CSSProperties;
  step1OverviewStyle: CSSProperties;
  step1FormStyle: CSSProperties;
  step1PreviewStyle: CSSProperties;
}

export function createLoanStudioStep1Styles(
  tokens: ResponsiveTokens,
): LoanStudioStep1Styles {
  const compact =
    tokens.meta.viewport === "mobile" ||
    tokens.meta.viewport === "tablet";

  const gap = `${tokens.spacing.small}px`;

  return {
    step1WorkspaceStyle: {
      width: "100%",
      height: "auto",
      minWidth: 0,
      minHeight: 0,
      display: "grid",
      gridTemplateRows: "auto auto",
      gap,
      boxSizing: "border-box",
    },

    step1TopStyle: {
      width: "100%",
      minWidth: 0,
      minHeight: 0,
      display: "grid",
      gridTemplateColumns: compact
        ? "minmax(0, 1fr)"
        : "minmax(240px, 30%) minmax(0, 70%)",
      gap,
      alignItems: "stretch",
      boxSizing: "border-box",
      overflow: "visible",
    },

    step1BottomStyle: {
      width: "100%",
      height: "auto",
      minWidth: 0,
      minHeight: 0,
      display: "grid",
      gridTemplateColumns: compact
        ? "minmax(0, 1fr)"
        : "minmax(0, 70%) minmax(260px, 30%)",
      gap,
      alignItems: "start",
      alignContent: "start",
      boxSizing: "border-box",
      overflow: "visible",
    },

    step1CustomerStyle: {
      width: "100%",
      minWidth: 0,
      minHeight: 0,
      alignSelf: "stretch",
      justifySelf: "stretch",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      overflow: "visible",
    },

    step1OverviewStyle: {
      width: "100%",
      minWidth: 0,
      minHeight: 0,
      alignSelf: "stretch",
      justifySelf: "stretch",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      overflow: "visible",
    },

    step1FormStyle: {
      width: "100%",
      minWidth: 0,
      minHeight: 0,
      alignSelf: "stretch",
      justifySelf: "stretch",
      boxSizing: "border-box",
      overflow: "hidden",
      scrollbarWidth: "thin",
    },

    step1PreviewStyle: {
      width: "100%",
      minWidth: 0,
      minHeight: 0,
      alignSelf: "stretch",
      justifySelf: "stretch",
      boxSizing: "border-box",
      overflow: "hidden",
      scrollbarWidth: "thin",
    },
  };
}

/* ===========================================================
   COMPATIBILITY EXPORTS
=========================================================== */

const DEFAULT_STYLES =
  createLoanStudioStep1Styles(
    LAPTOP_TOKENS,
  );

export const step1WorkspaceStyle =
  DEFAULT_STYLES.step1WorkspaceStyle;

export const step1TopStyle =
  DEFAULT_STYLES.step1TopStyle;

export const step1BottomStyle =
  DEFAULT_STYLES.step1BottomStyle;

export const step1CustomerStyle =
  DEFAULT_STYLES.step1CustomerStyle;

export const step1OverviewStyle =
  DEFAULT_STYLES.step1OverviewStyle;

export const step1FormStyle =
  DEFAULT_STYLES.step1FormStyle;

export const step1PreviewStyle =
  DEFAULT_STYLES.step1PreviewStyle;

/* ===========================================================
   END
=========================================================== */