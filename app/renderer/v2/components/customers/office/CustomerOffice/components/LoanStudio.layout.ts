// ============================================================
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
// STEP 5 CONTRACT:
// - Mobile  : Review Header -> Validation -> Preview
// - Tablet  : Review Header -> Validation | Preview
// - Laptop  : Review Header -> Validation | Preview
// - Desktop : Review Header -> Validation | Preview
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
// Kept only for compatibility with existing imports.
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
// STEP 5 RESPONSIVE CONTRACT
// ============================================================

export interface LoanStudioStep5Layout {
  step5WorkspaceStyle: CSSProperties;
  step5BottomStyle: CSSProperties;
  step5ChecklistColumnStyle: CSSProperties;
  step5PreviewColumnStyle: CSSProperties;
}

// ============================================================
// STEP 5 RESPONSIVE STYLE FACTORY
//
// Mobile:
//   Validation Checklist
//   ↓
//   Final Loan Preview
//
// Tablet / Laptop / Desktop:
//   Validation Checklist | Final Loan Preview
// ============================================================

export function createLoanStudioStep5Layout(
  tokens: ResponsiveTokens,
): LoanStudioStep5Layout {
  const mobile = tokens.meta.viewport === "mobile";

  const gap = Math.max(8, tokens.spacing.small);

  return {
    step5WorkspaceStyle: {
      ...step1WorkspaceStyle,
      width: "100%",
      minWidth: 0,
      overflow: "visible",
      boxSizing: "border-box",
    },

    step5BottomStyle: {
      ...step1BottomStyle,
      width: "100%",
      minWidth: 0,
      height: "auto",
      minHeight: 0,
      overflow: "visible",

      display: "grid",

      gridTemplateColumns: mobile
        ? "minmax(0, 1fr)"
        : "minmax(0, 1fr) minmax(0, 1fr)",

      gap: `${gap}px`,

      alignItems: "start",
      boxSizing: "border-box",
    },

    step5ChecklistColumnStyle: {
      ...step1FormStyle,
      width: "100%",
      minWidth: 0,
      height: "auto",
      minHeight: 0,
      overflow: "visible",
      display: "flex",
      flexDirection: "column",
      gap: `${gap}px`,
      boxSizing: "border-box",
    },

    step5PreviewColumnStyle: {
      ...step1PreviewStyle,
      width: "100%",
      minWidth: 0,
      height: "auto",
      minHeight: 0,
      overflow: "visible",
      display: "flex",
      flexDirection: "column",
      gap: `${gap}px`,
      boxSizing: "border-box",
    },
  };
}

// ============================================================
// STEP 5 LEGACY STATIC ALIASES
//
// Kept only for compatibility with existing imports.
// LoanStudioView uses createLoanStudioStep5Layout().
// ============================================================

export const step5WorkspaceStyle: CSSProperties = {
  ...step1WorkspaceStyle,
  width: "100%",
  minWidth: 0,
  overflow: "visible",
  boxSizing: "border-box",
};

export const step5BottomStyle: CSSProperties = {
  ...step1BottomStyle,
  width: "100%",
  minWidth: 0,
  height: "auto",
  minHeight: 0,
  overflow: "visible",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: "8px",
  alignItems: "start",
  boxSizing: "border-box",
};

export const step5ChecklistColumnStyle: CSSProperties = {
  ...step1FormStyle,
  width: "100%",
  minWidth: 0,
  height: "auto",
  minHeight: 0,
  overflow: "visible",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  boxSizing: "border-box",
};

export const step5PreviewColumnStyle: CSSProperties = {
  ...step1PreviewStyle,
  width: "100%",
  minWidth: 0,
  height: "auto",
  minHeight: 0,
  overflow: "visible",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  boxSizing: "border-box",
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