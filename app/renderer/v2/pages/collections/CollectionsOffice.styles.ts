// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS OFFICE™
//
// COLLECTIONS OFFICE STYLES
//
// RESPONSIBILITY:
// - Collections Office presentation
// - Preserve Loans Office visual geometry
// - Collection portfolio table
// - Collection badges
// - Responsive portfolio support
//
// IMPORTANT:
// - No business logic.
// - No persistence.
// - No service access.
// - Theme values come from FINORA Theme Engine.
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

import type { CSSProperties } from "react";

import type { CollectionReviewData } from "../../components/collections/CollectionReviewData";

// ============================================================
// THEME
// ============================================================

const THEME = {
  background:
    "var(--finora-theme-background-page, var(--finora-theme-page, #0B1220))",

  surface:
    "var(--finora-theme-background-surface, var(--finora-theme-surface, #111C2E))",

  surfaceMuted:
    "var(--finora-theme-background-surface-muted, var(--finora-theme-surface-muted, #142238))",

  textPrimary: "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary: "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted: "var(--finora-theme-text-muted, #94A3B8)",

  textInverse: "var(--finora-theme-text-inverse, #FFFFFF)",

  border: "var(--finora-theme-border-default, rgba(148,163,184,0.16))",

  borderStrong: "var(--finora-theme-border-strong, rgba(148,163,184,0.30))",

  primary: "var(--finora-theme-brand-primary, #C9A227)",

  accentSoft: "var(--finora-theme-brand-accent-soft, rgba(201,162,39,0.12))",

  success: "var(--finora-theme-success, #34D399)",

  successSoft: "var(--finora-theme-success-soft, rgba(16,185,129,0.10))",

  info: "var(--finora-theme-info, #60A5FA)",

  infoSoft: "var(--finora-theme-info-soft, rgba(96,165,250,0.10))",

  warning: "var(--finora-theme-warning, #F59E0B)",

  warningSoft: "var(--finora-theme-warning-soft, rgba(245,158,11,0.10))",

  shadow: "var(--finora-theme-overlay-shadow, rgba(0,0,0,0.18))",
} as const;

// ============================================================
// TABLE GEOMETRY
// ============================================================
//
// #           5
// Receipt    13
// Customer   14
// Loan       14
// Type        8
// Collected  11
// Outstanding11
// Date       10
// Status      8
// View        6
//
// Total = 100
// ============================================================

export const collectionTableGridTemplate =
  "5% 13% 14% 14% 8% 11% 11% 10% 8% 6%";

// ============================================================
// PAGE
// ============================================================

export const pageStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: "100%",
  boxSizing: "border-box",
  padding: "28px 24px 40px",
  background: THEME.background,
  color: THEME.textPrimary,
};

// ============================================================
// TOP BAR
// ============================================================

export const topBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "18px",
};

export const headingGroupStyle: CSSProperties = {
  minWidth: 0,
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: THEME.textPrimary,
  fontSize: "24px",
  fontWeight: 800,
  lineHeight: 1.15,
  letterSpacing: "-0.02em",
};

export const pageSubtitleStyle: CSSProperties = {
  margin: "7px 0 0",
  color: THEME.textMuted,
  fontSize: "13px",
  fontWeight: 450,
  lineHeight: 1.4,
};

export const createButtonStyle: CSSProperties = {
  flexShrink: 0,
  minHeight: "38px",
  padding: "0 18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  border: `1px solid ${THEME.borderStrong}`,
  borderRadius: "9px",
  background: THEME.primary,
  color: THEME.textInverse,
  fontSize: "13px",
  fontWeight: 750,
  cursor: "pointer",
  boxShadow: `0 7px 18px ${THEME.shadow}`,
  whiteSpace: "nowrap",
};

// ============================================================
// STATISTICS
// ============================================================

export const statisticsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "14px",
  width: "100%",
  marginBottom: "20px",
};

export const statisticCardStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "80px",
  boxSizing: "border-box",
  padding: "16px",
  border: `1px solid ${THEME.border}`,
  borderRadius: "10px",
  background: THEME.surface,
  boxShadow: `0 6px 18px ${THEME.shadow}`,
};

export const statisticLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: THEME.textMuted,
  fontSize: "12px",
  fontWeight: 550,
  lineHeight: 1.2,
};

export const statisticValueStyle: CSSProperties = {
  display: "block",
  color: THEME.textPrimary,
  fontSize: "20px",
  fontWeight: 600,
  lineHeight: 1.1,
};

// ============================================================
// PORTFOLIO
// ============================================================

export const portfolioStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  overflow: "hidden",
  border: `1px solid ${THEME.border}`,
  borderRadius: "12px",
  background: THEME.surface,
  boxShadow: `0 10px 28px ${THEME.shadow}`,
};

export const portfolioHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  minHeight: "58px",
  boxSizing: "border-box",
  padding: "0 14px",
  borderBottom: `1px solid ${THEME.border}`,
  background: `
    linear-gradient(
      90deg,
      ${THEME.surfaceMuted},
      ${THEME.surface}
    )
  `,
};

export const portfolioTitleStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: THEME.textPrimary,
  fontSize: "13px",
  fontWeight: 750,
  lineHeight: 1.2,
};

export const portfolioActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "7px",
  minWidth: 0,
  flexWrap: "nowrap",
};

// ============================================================
// FILTERS
// ============================================================

export const filtersStyle: CSSProperties = {
  width: "auto",
  margin: 0,
  padding: 0,
  border: "none",
  background: "transparent",
};

export const filtersGridStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "7px",
  padding: 0,
  flexWrap: "nowrap",
};

export const filterFieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "5px",
  minWidth: 0,
};

export const filterLabelStyle: CSSProperties = {
  color: THEME.textMuted,
  fontSize: "10px",
  fontWeight: 650,
  whiteSpace: "nowrap",
};

export const filterControlStyle: CSSProperties = {
  height: "31px",
  boxSizing: "border-box",
  padding: "0 8px",
  border: `1px solid ${THEME.border}`,
  borderRadius: "7px",
  outline: "none",
  background: THEME.background,
  color: THEME.textPrimary,
  fontSize: "11px",
  fontWeight: 550,
};

export const filterSelectStyle: CSSProperties = {
  ...filterControlStyle,
  width: "90px",
  cursor: "pointer",
};

export const filterDateInputStyle: CSSProperties = {
  ...filterControlStyle,
  width: "126px",
};

export const filterActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginLeft: "1px",
};

export const clearFilterButtonStyle: CSSProperties = {
  minHeight: "31px",
  padding: "0 9px",
  border: `1px solid ${THEME.border}`,
  borderRadius: "7px",
  background: THEME.surfaceMuted,
  color: THEME.textSecondary,
  fontSize: "10px",
  fontWeight: 650,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const applyFilterButtonStyle: CSSProperties = {
  minHeight: "31px",
  padding: "0 11px",
  border: `1px solid ${THEME.primary}`,
  borderRadius: "7px",
  background: THEME.primary,
  color: THEME.textInverse,
  fontSize: "10px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const refreshButtonStyle: CSSProperties = {
  minHeight: "31px",
  padding: "0 10px",
  border: `1px solid ${THEME.border}`,
  borderRadius: "7px",
  background: THEME.surfaceMuted,
  color: THEME.textSecondary,
  fontSize: "10px",
  fontWeight: 650,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const collectionCountStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "31px",
  padding: "0 9px",
  border: `1px solid ${THEME.borderStrong}`,
  borderRadius: "999px",
  background: THEME.successSoft,
  color: THEME.success,
  fontSize: "10px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

// ============================================================
// TABLE
// ============================================================

export const tableWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: "1080px",
  overflowX: "auto",
};

export const tableHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: collectionTableGridTemplate,
  alignItems: "center",
  width: "100%",
  minHeight: "34px",
  boxSizing: "border-box",
  padding: "0 12px",
  borderBottom: `1px solid ${THEME.border}`,
  background: THEME.surfaceMuted,
};

export const tableHeaderCellStyle: CSSProperties = {
  minWidth: 0,
  padding: "0 7px",
  boxSizing: "border-box",
  color: THEME.textMuted,
  fontSize: "10px",
  fontWeight: 650,
  lineHeight: 1.2,
  textAlign: "left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const tableHeaderRightStyle: CSSProperties = {
  ...tableHeaderCellStyle,
  textAlign: "right",
};

export const tableHeaderCenterStyle: CSSProperties = {
  ...tableHeaderCellStyle,
  textAlign: "center",
};

export const tableBodyStyle: CSSProperties = {
  width: "100%",
};

export const tableRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: collectionTableGridTemplate,
  alignItems: "center",
  width: "100%",
  minHeight: "64px",
  boxSizing: "border-box",
  padding: "0 12px",
  borderBottom: `1px solid ${THEME.border}`,
  background: THEME.surface,
};

export const tableCellStyle: CSSProperties = {
  minWidth: 0,
  padding: "7px",
  boxSizing: "border-box",
  color: THEME.textSecondary,
  fontSize: "11px",
  fontWeight: 550,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const tableCellRightStyle: CSSProperties = {
  ...tableCellStyle,
  textAlign: "right",
};

export const tableCellCenterStyle: CSSProperties = {
  ...tableCellStyle,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};

export const serialCellStyle: CSSProperties = {
  ...tableCellCenterStyle,
  fontSize: "11px",
  fontWeight: 700,
};

// ============================================================
// RECEIPT
// ============================================================

export const receiptIdentityStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  gap: "3px",
};

export const receiptNumberStyle: CSSProperties = {
  color: THEME.textPrimary,
  fontSize: "11px",
  fontWeight: 750,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const receiptReferenceStyle: CSSProperties = {
  color: THEME.textMuted,
  fontSize: "9px",
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// ============================================================
// CUSTOMER
// ============================================================

export const customerNameStyle: CSSProperties = {
  color: THEME.textPrimary,
  fontSize: "11px",
  fontWeight: 700,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const customerPhoneStyle: CSSProperties = {
  marginTop: "4px",
  color: THEME.textMuted,
  fontSize: "9px",
  fontWeight: 500,
  whiteSpace: "nowrap",
};

// ============================================================
// LOAN
// ============================================================

export const loanIdentityStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  gap: "3px",
};

export const loanNumberStyle: CSSProperties = {
  color: THEME.textPrimary,
  fontSize: "10px",
  fontWeight: 750,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const loanIdStyle: CSSProperties = {
  color: THEME.textMuted,
  fontSize: "8px",
  fontWeight: 500,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// ============================================================
// AMOUNTS
// ============================================================

export const amountStyle: CSSProperties = {
  color: THEME.textPrimary,
  fontSize: "11px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

export const outstandingStyle: CSSProperties = {
  display: "inline-block",
  padding: "3px 7px",
  borderRadius: "6px",
  background: THEME.successSoft,
  color: THEME.success,
  fontSize: "11px",
  fontWeight: 750,
  whiteSpace: "nowrap",
};

// ============================================================
// COLLECTION TYPE
// ============================================================

export function collectionTypeBadgeStyle(
  type: "EMI" | "MANUAL",
): CSSProperties {
  const isEmi = type === "EMI";

  return {
    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    minWidth: "58px",

    minHeight: "24px",

    padding: "0 9px",

    /*
     * COLLECTION TYPE BADGE
     *
     * EMI follows the active FINORA brand colour.
     * Manual remains a quieter secondary badge while still
     * inheriting the active theme surfaces / borders / text.
     *
     * No fixed yellow / blue / purple / green colour exists
     * here.
     */

    border: `1px solid ${isEmi ? THEME.primary : THEME.borderStrong}`,

    borderRadius: "999px",

    background: isEmi ? THEME.accentSoft : THEME.surfaceMuted,

    color: isEmi ? THEME.primary : THEME.textSecondary,

    fontSize: "9px",

    fontWeight: 700,

    whiteSpace: "nowrap",
  };
}

// ============================================================
// STATUS
// ============================================================

export function statusBadgeStyle(
  status: CollectionReviewData["status"] | string | undefined,
): CSSProperties {
  const approved =
    String(status ?? "")
      .trim()
      .toUpperCase() === "APPROVED";

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "62px",
    minHeight: "24px",
    padding: "0 9px",
    border: `1px solid ${approved ? THEME.success : THEME.borderStrong}`,
    borderRadius: "999px",
    background: approved ? THEME.successSoft : THEME.surfaceMuted,
    color: approved ? THEME.success : THEME.textMuted,
    fontSize: "9px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
}

// ============================================================
// VIEW BUTTON
// ============================================================

export const viewButtonStyle: CSSProperties = {
  minHeight: "28px",
  padding: "0 9px",
  border: `1px solid ${THEME.borderStrong}`,
  borderRadius: "6px",
  background: THEME.accentSoft,
  color: THEME.primary,
  fontSize: "9px",
  fontWeight: 750,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

// ============================================================
// EMPTY
// ============================================================

export const emptyStateStyle: CSSProperties = {
  minHeight: "250px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "36px 24px",
  boxSizing: "border-box",
  textAlign: "center",
  background: THEME.surface,
};

export const emptyTitleStyle: CSSProperties = {
  color: THEME.textPrimary,
  fontSize: "15px",
  fontWeight: 750,
};

export const emptyDescriptionStyle: CSSProperties = {
  maxWidth: "560px",
  marginTop: "8px",
  color: THEME.textMuted,
  fontSize: "12px",
  lineHeight: 1.45,
};

export const emptyCreateButtonStyle: CSSProperties = {
  marginTop: "16px",
  minHeight: "38px",
  padding: "0 17px",
  border: `1px solid ${THEME.borderStrong}`,
  borderRadius: "8px",
  background: THEME.primary,
  color: THEME.textInverse,
  fontSize: "12px",
  fontWeight: 750,
  cursor: "pointer",
};

// ============================================================
// FOOTER
// ============================================================

export const tableFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  minHeight: "36px",
  padding: "0 14px",
  borderTop: `1px solid ${THEME.border}`,
  background: THEME.surface,
  boxSizing: "border-box",
};

export const tableShowingStyle: CSSProperties = {
  color: THEME.textMuted,
  fontSize: "11px",
  fontWeight: 550,
};

// ============================================================
// PAGINATION
// ============================================================

export const paginationBarStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  minHeight: "46px",

  boxSizing: "border-box",

  padding: "7px 14px",

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "12px",

  borderTop: `1px solid ${THEME.border}`,

  background: THEME.surface,
};

export const paginationSummaryStyle: CSSProperties = {
  color: THEME.textMuted,

  fontSize: "11px",

  fontWeight: 550,

  whiteSpace: "nowrap",
};

export const paginationControlsStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "flex-end",

  gap: "5px",

  flexWrap: "wrap",
};

export const paginationNavButtonStyle: CSSProperties = {
  minWidth: "58px",

  minHeight: "30px",

  padding: "0 9px",

  border: `1px solid ${THEME.border}`,

  borderRadius: "7px",

  background: THEME.surfaceMuted,

  color: THEME.textSecondary,

  fontSize: "10px",

  fontWeight: 650,

  cursor: "pointer",

  whiteSpace: "nowrap",
};

export function paginationPageButtonStyle(active: boolean): CSSProperties {
  return {
    minWidth: "30px",

    minHeight: "30px",

    padding: "0 7px",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    border: `1px solid ${active ? THEME.primary : THEME.border}`,

    borderRadius: "7px",

    background: active ? THEME.primary : THEME.surfaceMuted,

    color: active ? THEME.textInverse : THEME.textSecondary,

    fontSize: "10px",

    fontWeight: active ? 750 : 650,

    cursor: "pointer",
  };
}

export const paginationEllipsisStyle: CSSProperties = {
  minWidth: "22px",

  color: THEME.textMuted,

  fontSize: "11px",

  fontWeight: 700,

  textAlign: "center",
};

// ============================================================
// END
// ============================================================
