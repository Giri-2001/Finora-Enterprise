// ============================================================
// FINORA ENTERPRISE OS™
// LOAN DETAILS — RESPONSIVE ENGINE
// LAYOUT BUILDERS
// ============================================================

import type { CSSProperties } from "react";

import type { LoanDetailsResponsiveTokens } from "./loanDetails.types";

// ============================================================
// PAGE
// ============================================================

export function createLoanDetailsPageStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",

    padding: `${tokens.layout.pagePaddingTop}px ${tokens.layout.pagePaddingX}px ${tokens.layout.pagePaddingBottom}px`,
  };
}

// ============================================================
// CUSTOMER SELECTOR
// ============================================================

export function createLoanDetailsCustomerStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    display: "grid",

    gridTemplateColumns: `repeat(${tokens.layout.customerColumns}, minmax(0, 1fr))`,

    gap: `${tokens.layout.customerGap}px`,

    minHeight: `${tokens.layout.customerMinHeight}px`,

    boxSizing: "border-box",
  };
}

// ============================================================
// SUMMARY CARDS
// ============================================================

export function createLoanDetailsSummaryGridStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    display: "grid",

    gridTemplateColumns: `repeat(${tokens.layout.summaryColumns}, minmax(0, 1fr))`,

    gap: `${tokens.layout.summaryGap}px`,

    boxSizing: "border-box",
  };
}

export function createLoanDetailsSummaryCardStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    minHeight: `${tokens.layout.summaryCardMinHeight}px`,
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  };
}

// ============================================================
// MAIN CONTENT
// ============================================================

export function createLoanDetailsMainContentStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    display: "grid",

    gridTemplateColumns:
      tokens.viewport === "mobile" ? "minmax(0, 1fr)" : "minmax(0, 1fr)",

    gap: `${tokens.layout.mainContentGap}px`,

    alignItems: "start",

    boxSizing: "border-box",
  };
}

// ============================================================
// FORM SECTION
// ============================================================

export function createLoanDetailsFormSectionStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    minWidth: 0,

    display: "grid",

    gap: `${tokens.layout.sectionGap}px`,

    boxSizing: "border-box",
  };
}

// ============================================================
// BASIC DETAILS
// ============================================================

export function createLoanDetailsBasicDetailsGridStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    display: "grid",

    gridTemplateColumns: `repeat(${tokens.layout.basicDetailsColumns}, minmax(0, 1fr))`,

    gap: `${tokens.layout.formGap}px`,

    boxSizing: "border-box",
  };
}

// ============================================================
// FINANCIAL TERMS
// ============================================================

export function createLoanDetailsFinancialTermsGridStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    display: "grid",

    gridTemplateColumns: `repeat(${tokens.layout.financialTermsColumns}, minmax(0, 1fr))`,

    gap: `${tokens.layout.formGap}px`,

    boxSizing: "border-box",
  };
}

// ============================================================
// LOAN DURATION
// ============================================================

export function createLoanDetailsDurationGridStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    display: "grid",

    gridTemplateColumns: `repeat(${tokens.layout.durationColumns}, minmax(0, 1fr))`,

    gap: `${tokens.layout.formGap}px`,

    boxSizing: "border-box",
  };
}

// ============================================================
// ADDITIONAL INFORMATION
// ============================================================

export function createLoanDetailsAdditionalInformationGridStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    display: "grid",

    gridTemplateColumns: `repeat(${tokens.layout.additionalInformationColumns}, minmax(0, 1fr))`,

    gap: `${tokens.layout.formGap}px`,

    boxSizing: "border-box",
  };
}

// ============================================================
// PREVIEW
// ============================================================

export function createLoanDetailsPreviewStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    minWidth: 0,

    boxSizing: "border-box",

    ...(tokens.viewport === "mobile" || tokens.viewport === "tablet"
      ? {
          marginTop: `${tokens.layout.sectionGap}px`,
        }
      : {
          minWidth: `${tokens.layout.previewMinWidth}px`,
        }),
  };
}

// ============================================================
// FOOTER
// ============================================================

export function createLoanDetailsFooterStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",

    display: "grid",

    gridTemplateColumns: `repeat(${tokens.layout.footerColumns}, minmax(0, 1fr))`,

    gap: `${tokens.layout.footerGap}px`,

    boxSizing: "border-box",
  };
}

export function createLoanDetailsFooterStepStyle(
  tokens: LoanDetailsResponsiveTokens,
): CSSProperties {
  return {
    width: "100%",
    minWidth: 0,

    boxSizing: "border-box",

    display: "flex",

    alignItems: "center",

    ...(tokens.layout.footerStacked
      ? {
          minHeight: "64px",
        }
      : {}),
  };
}
