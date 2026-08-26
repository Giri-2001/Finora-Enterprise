// ============================================================
// FINORA ENTERPRISE OS™
// LOANS OFFICE RESPONSIVE ENGINE
// LAYOUT BUILDERS
// ============================================================

import type { CSSProperties } from "react";

import type { LoansOfficeResponsiveTokens } from "./loansOffice.types";

// ============================================================
// PAGE
// ============================================================

export function createLoansOfficePageStyle(
  tokens: LoansOfficeResponsiveTokens,
): CSSProperties {
  return {
    padding: `${tokens.layout.pagePaddingTop}px ${tokens.layout.pagePaddingX}px ${tokens.layout.pagePaddingBottom}px`,
  };
}

// ============================================================
// TOP BAR
// ============================================================

export function createLoansOfficeTopBarStyle(
  tokens: LoansOfficeResponsiveTokens,
): CSSProperties {
  return {
    gap: `${tokens.layout.headerGap}px`,
    flexDirection: tokens.viewport === "mobile" ? "column" : "row",
    alignItems: tokens.viewport === "mobile" ? "stretch" : "flex-start",
  };
}

// ============================================================
// STATISTICS GRID
// ============================================================

export function createLoansOfficeStatisticsGridStyle(
  tokens: LoansOfficeResponsiveTokens,
): CSSProperties {
  return {
    gridTemplateColumns: `repeat(${tokens.layout.cardColumns}, minmax(0, 1fr))`,
    gap: `${tokens.layout.cardGap}px`,
  };
}

// ============================================================
// STATISTIC CARD
// ============================================================

export function createLoansOfficeStatisticCardStyle(
  tokens: LoansOfficeResponsiveTokens,
): CSSProperties {
  return {
    minHeight: `${tokens.layout.cardMinHeight}px`,
  };
}

// ============================================================
// PORTFOLIO FILTERS GRID
//
// MOBILE
//   - One filter/control per row.
//
// TABLET
//   - ALL filters + actions in ONE SINGLE ROW.
//   - Do not use the previous 2-column tablet layout.
//
// DESKTOP
//   - Keep the existing single-row layout.
// ============================================================

export function createLoansOfficeFiltersGridStyle(
  tokens: LoansOfficeResponsiveTokens,
): CSSProperties {
  // ----------------------------------------------------------
  // MOBILE
  // ----------------------------------------------------------

  if (tokens.viewport === "mobile") {
    return {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: `${tokens.layout.filterGap}px`,
      width: "100%",
      minWidth: 0,
    };
  }

  // ----------------------------------------------------------
  // TABLET
  //
  // IMPORTANT:
  // Tablet must keep the complete Loan Portfolio filter bar
  // in ONE SINGLE ROW.
  //
  // Order:
  // Status | From | To | Clear | Apply | Refresh | Loans
  // ----------------------------------------------------------

  if (tokens.viewport === "tablet") {
    return {
      display: "grid",

      // Seven compact columns so the complete filter/action
      // group remains on one horizontal row.
      gridTemplateColumns:
        "auto minmax(105px, 1fr) minmax(105px, 1fr) auto auto auto auto",

      gap: `${Math.max(tokens.layout.filterGap, 6)}px`,

      width: "100%",
      minWidth: 0,

      // Never allow the tablet filter grid to create an
      // additional row.
      gridAutoFlow: "column",
      gridAutoColumns: "auto",
      alignItems: "center",
    };
  }

  // ----------------------------------------------------------
  // DESKTOP
  // ----------------------------------------------------------

  return {
    display: "grid",
    gridTemplateColumns:
      "minmax(150px, 1fr) minmax(170px, 1fr) minmax(170px, 1fr) auto",
    gap: `${tokens.layout.filterGap}px`,
    width: "100%",
    minWidth: 0,
    alignItems: "center",
  };
}

// ============================================================
// PORTFOLIO HEADER
// ============================================================

export function createLoansOfficePortfolioHeaderStyle(
  tokens: LoansOfficeResponsiveTokens,
): CSSProperties {
  return {
    minHeight: `${tokens.layout.portfolioHeaderMinHeight}px`,
    flexDirection: tokens.layout.portfolioHeaderStacked ? "column" : "row",
    alignItems: tokens.layout.portfolioHeaderStacked ? "stretch" : "center",
  };
}

// ============================================================
// PORTFOLIO ACTIONS
// ============================================================

export function createLoansOfficePortfolioActionsStyle(
  tokens: LoansOfficeResponsiveTokens,
): CSSProperties {
  return {
    flexWrap: tokens.layout.portfolioActionWrap ? "wrap" : "nowrap",
    justifyContent: tokens.layout.portfolioActionWrap
      ? "flex-start"
      : "flex-end",
  };
}

// ============================================================
// MOBILE LOAN RECORD
//
// NOTE:
// This is intentionally kept separate from the filter layout.
// Loan record responsive behavior must not be affected by the
// tablet filter-row change.
// ============================================================

export function createLoansOfficeMobileRecordStyle(
  tokens: LoansOfficeResponsiveTokens,
): CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    gap: `${tokens.layout.mobileRecordGap}px`,
    padding: `${tokens.layout.mobileRecordPadding}px`,
    boxSizing: "border-box",
    width: "100%",
  };
}

// ============================================================
// MOBILE LOAN FIELD
// ============================================================

export function createLoansOfficeMobileFieldStyle(
  tokens: LoansOfficeResponsiveTokens,
): CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    gap: `${tokens.layout.mobileFieldGap}px`,
    paddingBottom: tokens.layout.mobileFieldSeparator ? "10px" : 0,
    borderBottom: tokens.layout.mobileFieldSeparator
      ? "1px solid var(--finora-loans-office-field-border, rgba(148,163,184,0.14))"
      : undefined,
    minWidth: 0,
  };
}

// ============================================================
// TABLET LOAN FIELD GRID
//
// IMPORTANT:
// This controls the LOAN RECORD fields, not the Portfolio
// filter controls.
//
// Keep the existing tablet 2-column loan-record layout.
// ============================================================

export function createLoansOfficeTabletFieldGridStyle(
  tokens: LoansOfficeResponsiveTokens,
): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${tokens.layout.tabletFieldColumns}, minmax(0, 1fr))`,
    gap: `${tokens.layout.mobileRecordGap}px ${
      tokens.layout.mobileRecordGap + 4
    }px`,
    width: "100%",
  };
}
