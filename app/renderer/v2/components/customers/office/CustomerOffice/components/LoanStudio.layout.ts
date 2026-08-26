// FINORA ENTERPRISE OS™
// LOAN STUDIO™
// RESPONSIVE LAYOUT STYLES
//
// STEP 2 CONTRACT:
// - Mobile  : Summary -> Preview -> EMI Schedule
// - Tablet  : Summary -> Preview -> EMI Schedule
// - Laptop  : Summary + Preview | EMI Schedule
// - Desktop : Summary + Preview | EMI Schedule
//
// IMPORTANT:
// - Uses FINORA Responsive Engine tokens.
// - No viewport media queries.
// - No business logic.
// - Repayment Draft is not rendered by LoanStudioView.
// ============================================================

import type { CSSProperties } from "react";

import type { ResponsiveTokens } from "../../../../../utils/responsive";

import {
  step1WorkspaceStyle,
  step1BottomStyle,
  step1FormStyle,
  step1PreviewStyle,
} from "./LoanStudio.styles";

// ============================================================
// STEP 2 RESPONSIVE CONTRACT
// ============================================================

export interface LoanStudioStep2Layout {
  step2WorkspaceStyle: CSSProperties;
  step2GridStyle: CSSProperties;
  step2LeftColumnStyle: CSSProperties;
  step2SummaryWrapperStyle: CSSProperties;
  step2PreviewDraftStackStyle: CSSProperties;
  step2PreviewWrapperStyle: CSSProperties;
  step2ScheduleWrapperStyle: CSSProperties;
}

// ============================================================
// STEP 2 STYLE FACTORY
// ============================================================

export function createLoanStudioStep2Layout(
  tokens: ResponsiveTokens,
): LoanStudioStep2Layout {
  const compact =
    tokens.meta.viewport === "mobile" || tokens.meta.viewport === "tablet";

  const gap = Math.max(8, tokens.spacing.small);

  return {
    step2WorkspaceStyle: {
      width: "100%",
      minWidth: 0,
      minHeight: 0,
      boxSizing: "border-box",
      overflow: "visible",
      paddingRight: 0,
      paddingBottom: `${Math.max(4, gap / 2)}px`,
    },

    step2GridStyle: {
      width: "100%",
      minWidth: 0,
      display: "grid",
      gridTemplateColumns: compact
        ? "minmax(0, 1fr)"
        : "minmax(0, 55%) minmax(0, 45%)",
      gap: `${gap}px`,
      alignItems: "start",
      boxSizing: "border-box",
    },

    step2LeftColumnStyle: {
      width: "100%",
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: `${gap}px`,
      boxSizing: "border-box",
    },

    step2SummaryWrapperStyle: {
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    },

    step2PreviewDraftStackStyle: {
      width: "100%",
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: `${gap}px`,
      alignItems: "stretch",
      boxSizing: "border-box",
    },

    step2PreviewWrapperStyle: {
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    },

    step2ScheduleWrapperStyle: {
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
      overflow: "visible",
    },
  };
}

// ============================================================
// LEGACY STATIC ALIASES
//
// Kept only for compatibility with any existing imports.
// LoanStudioView uses createLoanStudioStep2Layout().
// ============================================================

export const step2WorkspaceStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
  overflow: "visible",
  paddingRight: 0,
  paddingBottom: "4px",
};

export const step2GridStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "minmax(0, 55%) minmax(0, 45%)",
  gap: "8px",
  alignItems: "start",
  boxSizing: "border-box",
};

export const step2LeftColumnStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  boxSizing: "border-box",
};

export const step2SummaryWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

export const step2PreviewDraftStackStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  alignItems: "stretch",
  boxSizing: "border-box",
};

export const step2PreviewWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

export const step2ScheduleWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

// ============================================================
// STEP 5
// ============================================================

export const step5WorkspaceStyle: CSSProperties = {
  ...step1WorkspaceStyle,
  overflow: "visible",
};

export const step5BottomStyle: CSSProperties = {
  ...step1BottomStyle,
  height: "auto",
  overflow: "visible",
  alignItems: "start",
};

export const step5ChecklistColumnStyle: CSSProperties = {
  ...step1FormStyle,
  height: "auto",
  minHeight: 0,
  overflow: "visible",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

export const step5PreviewColumnStyle: CSSProperties = {
  ...step1PreviewStyle,
  height: "auto",
  minHeight: 0,
  overflow: "visible",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

// ============================================================
// STEP 6
// ============================================================

export const step6WorkspaceStyle: CSSProperties = {
  ...step1WorkspaceStyle,
  overflow: "visible",
};

export const step6BottomStyle: CSSProperties = {
  ...step1BottomStyle,
  height: "auto",
  minHeight: 0,
  overflow: "visible",
  alignItems: "start",
  alignContent: "start",
};

export const step6PaymentModeWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
};

export const step6PreviewColumnStyle: CSSProperties = {
  ...step1PreviewStyle,
  height: "auto",
  minHeight: 0,
  overflow: "visible",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

// ============================================================
// END
// ============================================================
