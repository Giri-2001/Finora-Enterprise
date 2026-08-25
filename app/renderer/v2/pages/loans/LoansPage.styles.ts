// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOANS OFFICE™
//
// LOANS PAGE STYLES
//
// RESPONSIBILITY:
//
// - Keep Loans Office presentation separate from logic
// - Provide exact shared column geometry
// - Maintain premium FINORA V2 workspace
// - Consume the central FINORA Theme Engine
//
// IMPORTANT:
//
// - No business logic.
// - No persistence logic.
// - No V1 styles.
// - No inline CSS dependency.
// - No local theme palette.
// - Theme colours come from FINORA Theme CSS variables.
// - Responsive / layout geometry remains unchanged.
//
// THEME CONTRACT:
//
// ThemeProvider
//      ↓
// FINORA Theme Engine
//      ↓
// FINORA Theme CSS variables
//      ↓
// Loans Office styles
//
// SUPPORTED APPLICATION THEMES:
//
// - Imperial Gold
// - Royal Navy
// - Amethyst
// - Emerald
// - Obsidian
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
} from "react";


import type {
  Loan,
} from "../../components/customers/office/CustomerOffice/types";


// ============================================================
// THEME VARIABLES
// ============================================================
//
// IMPORTANT:
//
// LoansPage.styles.ts does NOT define five independent themes.
//
// The five application themes are owned by the central
// FINORA Theme Registry / ThemeProvider.
//
// These variables resolve automatically from the currently
// selected FINORA theme.
//
// Defensive fallbacks exist only for temporary cases where
// the theme CSS variable is unavailable.
//
// ============================================================

const THEME = {

  // ----------------------------------------------------------
  // PAGE / BACKGROUND
  // ----------------------------------------------------------

  page:
    "var(--finora-theme-page, var(--finora-theme-background-page, var(--finora-theme-surface, #0B1220)))",

  background:
    "var(--finora-theme-background-page, var(--finora-theme-page, var(--finora-theme-surface, #0B1220)))",


  // ----------------------------------------------------------
  // SURFACES
  // ----------------------------------------------------------

  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  surfaceStrong:
    "var(--finora-theme-surface-strong, var(--finora-theme-surface-muted, #17263D))",


  // ----------------------------------------------------------
  // BRAND
  // ----------------------------------------------------------

  brandPrimary:
    "var(--finora-theme-brand-primary, #C9A227)",

  brandSecondary:
    "var(--finora-theme-brand-secondary, var(--finora-theme-brand-primary, #B8860B))",

  brandAccent:
    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

  brandAccentSoft:
    "var(--finora-theme-brand-accent-soft, var(--finora-theme-brand-primary, #D4AF37))",


  // ----------------------------------------------------------
  // TEXT
  // ----------------------------------------------------------

  textPrimary:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",

  textInverse:
    "var(--finora-theme-text-inverse, #FFFFFF)",


  // ----------------------------------------------------------
  // BORDERS
  // ----------------------------------------------------------

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.16))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.35))",

  borderSubtle:
    "var(--finora-theme-border-subtle, rgba(148, 163, 184, 0.10))",


  // ----------------------------------------------------------
  // PRIMARY ACTION
  // ----------------------------------------------------------

  primary:
    "var(--finora-theme-brand-primary, #2563EB)",

  primaryHover:
    "var(--finora-theme-brand-secondary, #1D4ED8)",


  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  success:
    "var(--finora-theme-success, #34D399)",

  successSoft:
    "var(--finora-theme-success-soft, rgba(16, 185, 129, 0.10))",

  successBorder:
    "var(--finora-theme-success-border, var(--finora-theme-border-strong, rgba(16, 185, 129, 0.35)))",

  closed:
    "var(--finora-theme-text-muted, #94A3B8)",

  closedSoft:
    "var(--finora-theme-surface-muted, rgba(148, 163, 184, 0.10))",


  // ----------------------------------------------------------
  // EFFECTS
  // ----------------------------------------------------------

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.18))",

} as const;


// ============================================================
// EXACT PORTFOLIO COLUMN SYSTEM
// ============================================================
//
// IMPORTANT:
//
// Header and every row use this exact same template.
//
// This prevents the Principal / Outstanding / Date / Status
// values from drifting away from their headings.
//
// Total = 100%
//
// #            5%
// Loan         16%
// Customer     16%
// Type         11%
// Principal    14%
// Outstanding  14%
// Loan Date    12%
// Status       12%
//
// ============================================================

export const loanTableGridTemplate =
  "5% 16% 16% 11% 14% 14% 12% 12%";


// ============================================================
// PAGE
// ============================================================

export const pageStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  minHeight:
    "100%",

  boxSizing:
    "border-box",

  padding:
    "28px 24px 40px",

  background:
    THEME.background,

  color:
    THEME.textPrimary,

};


// ============================================================
// TOP BAR
// ============================================================

export const topBarStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "flex-start",

  justifyContent:
    "space-between",

  gap:
    "20px",

  marginBottom:
    "18px",

};


// ============================================================
// HEADING GROUP
// ============================================================

export const headingGroupStyle:
  CSSProperties = {

  minWidth:
    0,

};


// ============================================================
// PAGE TITLE
// ============================================================

export const pageTitleStyle:
  CSSProperties = {

  margin:
    0,

  color:
    THEME.textPrimary,

  fontSize:
    "24px",

  fontWeight:
    800,

  lineHeight:
    1.15,

  letterSpacing:
    "-0.02em",

};


// ============================================================
// PAGE SUBTITLE
// ============================================================

export const pageSubtitleStyle:
  CSSProperties = {

  margin:
    "7px 0 0",

  color:
    THEME.textMuted,

  fontSize:
    "13px",

  fontWeight:
    450,

  lineHeight:
    1.4,

};


// ============================================================
// CREATE BUTTON
// ============================================================

export const createButtonStyle:
  CSSProperties = {

  flexShrink:
    0,

  minHeight:
    "38px",

  padding:
    "0 18px",

  border:
    `1px solid ${THEME.borderStrong}`,

  borderRadius:
    "9px",

  background:
    THEME.primary,

  color:
    THEME.textInverse,

  fontSize:
    "13px",

  fontWeight:
    750,

  cursor:
    "pointer",

  boxShadow:
    `0 7px 18px ${THEME.shadow}`,

};


// ============================================================
// STATISTICS GRID
// ============================================================

export const statisticsGridStyle:
  CSSProperties = {

  display:
    "grid",

  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",

  gap:
    "14px",

  width:
    "100%",

  marginBottom:
    "20px",

};


// ============================================================
// STATISTIC CARD
// ============================================================

export const statisticCardStyle:
  CSSProperties = {

  minWidth:
    0,

  minHeight:
    "80px",

  boxSizing:
    "border-box",

  padding:
    "16px",

  border:
    `1px solid ${THEME.border}`,

  borderRadius:
    "10px",

  background:
    THEME.surface,

  boxShadow:
    `0 6px 18px ${THEME.shadow}`,

};


// ============================================================
// STATISTIC LABEL
// ============================================================

export const statisticLabelStyle:
  CSSProperties = {

  display:
    "block",

  marginBottom:
    "8px",

  color:
    THEME.textMuted,

  fontSize:
    "12px",

  fontWeight:
    550,

  lineHeight:
    1.2,

};


// ============================================================
// STATISTIC VALUE
// ============================================================

export const statisticValueStyle:
  CSSProperties = {

  display:
    "block",

  color:
    THEME.textPrimary,

  fontSize:
    "20px",

  fontWeight:
    600,

  lineHeight:
    1.1,

};


// ============================================================
// PORTFOLIO
// ============================================================

export const portfolioStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  boxSizing:
    "border-box",

  overflow:
    "hidden",

  border:
    `1px solid ${THEME.border}`,

  borderRadius:
    "12px",

  background:
    THEME.surface,

  boxShadow:
    `0 10px 28px ${THEME.shadow}`,

};


// ============================================================
// PORTFOLIO HEADER
// ============================================================

export const portfolioHeaderStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "space-between",

  gap:
    "14px",

  minHeight:
    "58px",

  boxSizing:
    "border-box",

  padding:
    "0 14px",

  borderBottom:
    `1px solid ${THEME.border}`,

  background:
    `
      linear-gradient(
        90deg,
        ${THEME.surfaceMuted},
        ${THEME.surface}
      )
    `,

};


// ============================================================
// PORTFOLIO TITLE
// ============================================================

export const portfolioTitleStyle:
  CSSProperties = {

  color:
    THEME.textPrimary,

  fontSize:
    "13px",

  fontWeight:
    750,

  lineHeight:
    1.2,

};


// ============================================================
// PORTFOLIO ACTIONS
// ============================================================

export const portfolioActionsStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "flex-end",

  gap:
    "7px",

  minWidth:
    0,

  flexWrap:
    "nowrap",

};


// ============================================================
// REFRESH BUTTON
// ============================================================

export const refreshButtonStyle:
  CSSProperties = {

  minHeight:
    "31px",

  padding:
    "0 10px",

  border:
    `1px solid ${THEME.border}`,

  borderRadius:
    "7px",

  background:
    "color-mix(in srgb, var(--finora-theme-text-primary, #FFFFFF) 2.5%, transparent)",

  color:
    THEME.textSecondary,

  fontSize:
    "10px",

  fontWeight:
    650,

  cursor:
    "pointer",

  whiteSpace:
    "nowrap",

};


// ============================================================
// LOAN COUNT
// ============================================================

export const loanCountStyle:
  CSSProperties = {

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  minHeight:
    "31px",

  padding:
    "0 9px",

  border:
    `1px solid ${THEME.borderStrong}`,

  borderRadius:
    "999px",

  background:
    `
      color-mix(
        in srgb,
        ${THEME.brandPrimary} 12%,
        transparent
      )
    `,

  color:
    THEME.brandAccent,

  fontSize:
    "10px",

  fontWeight:
    700,

  whiteSpace:
    "nowrap",

};


// ============================================================
// FILTERS
// ============================================================
//
// LOCKED V2 PREMIUM HEADER FILTER LAYOUT
//
// Filters are intentionally embedded inside the Loan Portfolio
// header. There is NO separate filter card/section.
//
// Order:
//
// Status → From → To → Clear → Apply → Refresh → Count
//
// ============================================================

export const filtersStyle:
  CSSProperties = {

  width:
    "auto",

  margin:
    0,

  padding:
    0,

  border:
    "none",

  borderRadius:
    0,

  background:
    "transparent",

  overflow:
    "visible",

  boxSizing:
    "border-box",

};


export const filtersGridStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "flex-end",

  gap:
    "7px",

  padding:
    0,

  flexWrap:
    "nowrap",

};


export const filterFieldStyle:
  CSSProperties = {

  display:
    "flex",

  flexDirection:
    "row",

  alignItems:
    "center",

  gap:
    "5px",

  minWidth:
    0,

};


export const filterLabelStyle:
  CSSProperties = {

  color:
    THEME.textMuted,

  fontSize:
    "10px",

  fontWeight:
    650,

  whiteSpace:
    "nowrap",

};


export const filterControlStyle:
  CSSProperties = {

  height:
    "31px",

  boxSizing:
    "border-box",

  padding:
    "0 8px",

  border:
    `1px solid ${THEME.border}`,

  borderRadius:
    "7px",

  outline:
    "none",

  background:
    THEME.background,

  color:
    THEME.textPrimary,

  fontSize:
    "11px",

  fontWeight:
    550,

};


export const filterSelectStyle:
  CSSProperties = {

  ...filterControlStyle,

  width:
    "86px",

  cursor:
    "pointer",

};


export const filterDateInputStyle:
  CSSProperties = {

  ...filterControlStyle,

  width:
    "126px",

};


export const filterActionsStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "6px",

  marginLeft:
    "1px",

};


export const clearFilterButtonStyle:
  CSSProperties = {

  minHeight:
    "31px",

  padding:
    "0 9px",

  border:
    `1px solid ${THEME.border}`,

  borderRadius:
    "7px",

  background:
    "color-mix(in srgb, var(--finora-theme-text-primary, #FFFFFF) 2.5%, transparent)",

  color:
    THEME.textSecondary,

  fontSize:
    "10px",

  fontWeight:
    650,

  cursor:
    "pointer",

  whiteSpace:
    "nowrap",

};


export const applyFilterButtonStyle:
  CSSProperties = {

  minHeight:
    "31px",

  padding:
    "0 11px",

  border:
    `1px solid ${THEME.primary}`,

  borderRadius:
    "7px",

  background:
    THEME.primary,

  color:
    THEME.textInverse,

  fontSize:
    "10px",

  fontWeight:
    700,

  cursor:
    "pointer",

  whiteSpace:
    "nowrap",

};


// ============================================================
// TABLE WRAPPER
// ============================================================

export const tableWrapperStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    "900px",

  overflowX:
    "auto",

};


// ============================================================
// TABLE HEADER
// ============================================================
//
// EXACT SAME GRID AS TABLE ROW.
// ============================================================

export const tableHeaderStyle:
  CSSProperties = {

  display:
    "grid",

  gridTemplateColumns:
    loanTableGridTemplate,

  alignItems:
    "center",

  width:
    "100%",

  minHeight:
    "34px",

  boxSizing:
    "border-box",

  padding:
    "0 12px",

  borderBottom:
    `1px solid ${THEME.border}`,

  background:
    THEME.surfaceMuted,

};


// ============================================================
// TABLE HEADER CELL
// ============================================================

export const tableHeaderCellStyle:
  CSSProperties = {

  minWidth:
    0,

  padding:
    "0 8px",

  boxSizing:
    "border-box",

  color:
    THEME.textMuted,

  fontSize:
    "11px",

  fontWeight:
    650,

  lineHeight:
    1.2,

  textAlign:
    "left",

  whiteSpace:
    "nowrap",

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

};


// ============================================================
// TABLE HEADER RIGHT
// ============================================================

export const tableHeaderRightStyle:
  CSSProperties = {

  ...tableHeaderCellStyle,

  textAlign:
    "right",

};


// ============================================================
// TABLE HEADER CENTER
// ============================================================

export const tableHeaderCenterStyle:
  CSSProperties = {

  ...tableHeaderCellStyle,

  textAlign:
    "center",

};


// ============================================================
// TABLE BODY
// ============================================================

export const tableBodyStyle:
  CSSProperties = {

  width:
    "100%",

};


// ============================================================
// TABLE ROW
// ============================================================
//
// EXACT SAME GRID AS HEADER.
// ============================================================

export const tableRowStyle:
  CSSProperties = {

  display:
    "grid",

  gridTemplateColumns:
    loanTableGridTemplate,

  alignItems:
    "center",

  width:
    "100%",

  minHeight:
    "64px",

  boxSizing:
    "border-box",

  padding:
    "0 12px",

  borderBottom:
    `1px solid ${THEME.border}`,

  background:
    THEME.surface,

};


// ============================================================
// TABLE CELL
// ============================================================

export const tableCellStyle:
  CSSProperties = {

  minWidth:
    0,

  padding:
    "7px 8px",

  boxSizing:
    "border-box",

  color:
    THEME.textSecondary,

  fontSize:
    "12px",

  fontWeight:
    550,

  lineHeight:
    1.25,

  textAlign:
    "left",

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

};


// ============================================================
// TABLE CELL SECONDARY
// ============================================================

export const tableCellSecondaryStyle:
  CSSProperties = {

  ...tableCellStyle,

  color:
    THEME.textSecondary,

};


// ============================================================
// TABLE CELL RIGHT
// ============================================================

export const tableCellRightStyle:
  CSSProperties = {

  ...tableCellStyle,

  textAlign:
    "right",

};


// ============================================================
// TABLE CELL CENTER
// ============================================================

export const tableCellCenterStyle:
  CSSProperties = {

  ...tableCellStyle,

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

};


// ============================================================
// SERIAL NUMBER CELL
//
// Used by the first "#" column in the Loan Portfolio table.
// Keeps serial numbers centered and visually aligned with
// the portfolio header.
// ============================================================

export const serialCellStyle:
  CSSProperties = {

  ...tableCellCenterStyle,

  color:
    THEME.textSecondary,

  fontSize:
    "11px",

  fontWeight:
    700,

  lineHeight:
    1.2,

};


// ============================================================
// LOAN IDENTITY
// ============================================================

export const loanIdentityStyle:
  CSSProperties = {

  display:
    "flex",

  flexDirection:
    "column",

  minWidth:
    0,

  gap:
    "3px",

};


// ============================================================
// LOAN NUMBER
// ============================================================

export const loanNumberStyle:
  CSSProperties = {

  display:
    "block",

  color:
    THEME.textPrimary,

  fontSize:
    "11px",

  fontWeight:
    750,

  lineHeight:
    1.2,

  whiteSpace:
    "nowrap",

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

};


// ============================================================
// LOAN TITLE
// ============================================================

export const loanTitleStyle:
  CSSProperties = {

  display:
    "block",

  color:
    THEME.textMuted,

  fontSize:
    "10px",

  fontWeight:
    500,

  lineHeight:
    1.2,

  whiteSpace:
    "nowrap",

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

};


// ============================================================
// CUSTOMER NAME
// ============================================================

export const customerNameStyle:
  CSSProperties = {

  color:
    THEME.textPrimary,

  fontSize:
    "12px",

  fontWeight:
    700,

  lineHeight:
    1.2,

  whiteSpace:
    "nowrap",

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

};


// ============================================================
// CUSTOMER PHONE
// ============================================================

export const customerPhoneStyle:
  CSSProperties = {

  marginTop:
    "4px",

  color:
    THEME.textMuted,

  fontSize:
    "10px",

  fontWeight:
    500,

  lineHeight:
    1.1,

  whiteSpace:
    "nowrap",

};


// ============================================================
// AMOUNT
// ============================================================

export const amountStyle:
  CSSProperties = {

  color:
    THEME.textPrimary,

  fontSize:
    "12px",

  fontWeight:
    700,

  whiteSpace:
    "nowrap",

};


// ============================================================
// OUTSTANDING
// ============================================================

export const outstandingStyle:
  CSSProperties = {

  color:
    THEME.textPrimary,

  fontSize:
    "12px",

  fontWeight:
    750,

  whiteSpace:
    "nowrap",

};


// ============================================================
// STATUS BADGE
// ============================================================

export function statusBadgeStyle(
  status:
    Loan["status"],
):
  CSSProperties {

  const isClosed =
    status === "CLOSED";


  return {

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    minWidth:
      "58px",

    minHeight:
      "24px",

    padding:
      "0 10px",

    border:
      `1px solid ${
        isClosed
          ? THEME.border
          : THEME.successBorder
      }`,

    borderRadius:
      "999px",

    background:
      isClosed
        ? THEME.closedSoft
        : THEME.successSoft,

    color:
      isClosed
        ? THEME.closed
        : THEME.success,

    fontSize:
      "10px",

    fontWeight:
      700,

    lineHeight:
      1.1,

    whiteSpace:
      "nowrap",

  };

}


// ============================================================
// EMPTY STATE
// ============================================================

export const emptyStateStyle:
  CSSProperties = {

  minHeight:
    "250px",

  display:
    "flex",

  flexDirection:
    "column",

  alignItems:
    "center",

  justifyContent:
    "center",

  padding:
    "36px 24px",

  boxSizing:
    "border-box",

  textAlign:
    "center",

  background:
    THEME.surface,

};


// ============================================================
// EMPTY TITLE
// ============================================================

export const emptyTitleStyle:
  CSSProperties = {

  color:
    THEME.textPrimary,

  fontSize:
    "15px",

  fontWeight:
    750,

  lineHeight:
    1.25,

};


// ============================================================
// EMPTY DESCRIPTION
// ============================================================

export const emptyDescriptionStyle:
  CSSProperties = {

  maxWidth:
    "560px",

  marginTop:
    "8px",

  color:
    THEME.textMuted,

  fontSize:
    "12px",

  fontWeight:
    450,

  lineHeight:
    1.45,

};


// ============================================================
// EMPTY CREATE BUTTON
// ============================================================

export const emptyCreateButtonStyle:
  CSSProperties = {

  marginTop:
    "16px",

  minHeight:
    "38px",

  padding:
    "0 17px",

  border:
    `1px solid ${THEME.borderStrong}`,

  borderRadius:
    "8px",

  background:
    THEME.primary,

  color:
    THEME.textInverse,

  fontSize:
    "12px",

  fontWeight:
    750,

  cursor:
    "pointer",

  boxShadow:
    `0 7px 18px ${THEME.shadow}`,

};


// ============================================================
// TABLE FOOTER
// ============================================================

export const tableFooterStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "flex-end",

  minHeight:
    "36px",

  padding:
    "0 14px",

  borderTop:
    `1px solid ${THEME.border}`,

  background:
    THEME.surface,

  boxSizing:
    "border-box",

};


export const tableShowingStyle:
  CSSProperties = {

  color:
    THEME.textMuted,

  fontSize:
    "11px",

  fontWeight:
    550,

};


// ============================================================
// END
// ============================================================