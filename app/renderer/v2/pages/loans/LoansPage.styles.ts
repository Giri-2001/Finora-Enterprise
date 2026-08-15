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
// - Maintain premium FINORA V2 dark workspace
//
// IMPORTANT:
//
// - No business logic.
// - No persistence logic.
// - No V1 styles.
// - No inline CSS dependency.
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
// COLORS
// ============================================================

const COLORS = {

  background:
    "#0B1220",

  panel:
    "#111C2E",

  panelSoft:
    "#142238",

  panelHover:
    "#17263D",

  border:
    "rgba(148, 163, 184, 0.16)",

  borderStrong:
    "rgba(37, 99, 235, 0.35)",

  primary:
    "#2563EB",

  primaryHover:
    "#1D4ED8",

  primarySoft:
    "rgba(37, 99, 235, 0.12)",

  text:
    "#FFFFFF",

  textSecondary:
    "#CBD5E1",

  textMuted:
    "#94A3B8",

  success:
    "#34D399",

  successSoft:
    "rgba(16, 185, 129, 0.10)",

  successBorder:
    "rgba(16, 185, 129, 0.35)",

  closed:
    "#94A3B8",

  closedSoft:
    "rgba(148, 163, 184, 0.10)",

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
// Loan         15%
// Customer     15%
// Type         12%
// Principal    14%
// Outstanding  14%
// Loan Date    12%
// Status       18%
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
    COLORS.background,

  color:
    COLORS.text,

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
    COLORS.text,

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
    COLORS.textMuted,

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
    "1px solid rgba(96, 165, 250, 0.35)",

  borderRadius:
    "9px",

  background:
    COLORS.primary,

  color:
    COLORS.text,

  fontSize:
    "13px",

  fontWeight:
    750,

  cursor:
    "pointer",

  boxShadow:
    "0 7px 18px rgba(37, 99, 235, 0.22)",

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
    `1px solid ${COLORS.border}`,

  borderRadius:
    "10px",

  background:
    COLORS.panel,

  boxShadow:
    "0 6px 18px rgba(0, 0, 0, 0.12)",

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
    COLORS.textMuted,

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
    COLORS.text,

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
    `1px solid ${COLORS.border}`,

  borderRadius:
    "12px",

  background:
    COLORS.panel,

  boxShadow:
    "0 10px 28px rgba(0, 0, 0, 0.18)",

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
    `1px solid ${COLORS.border}`,

  background:
    `linear-gradient(
      90deg,
      ${COLORS.panelSoft},
      ${COLORS.panel}
    )`,

};


// ============================================================
// PORTFOLIO TITLE
// ============================================================

export const portfolioTitleStyle:
  CSSProperties = {

  color:
    COLORS.text,

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
    `1px solid ${COLORS.border}`,

  borderRadius:
    "7px",

  background:
    "rgba(255, 255, 255, 0.025)",

  color:
    COLORS.textSecondary,

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
    `1px solid ${COLORS.borderStrong}`,

  borderRadius:
    "999px",

  background:
    COLORS.primarySoft,

  color:
    "#93C5FD",

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
 // Status → From → To → Clear → Apply → Refresh → Count
 //
 // ============================================================

export const filtersStyle: CSSProperties = {
  width: "auto",
  margin: 0,
  padding: 0,
  border: "none",
  borderRadius: 0,
  background: "transparent",
  overflow: "visible",
  boxSizing: "border-box",
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
  color: COLORS.textMuted,
  fontSize: "10px",
  fontWeight: 650,
  whiteSpace: "nowrap",
};

export const filterControlStyle: CSSProperties = {
  height: "31px",
  boxSizing: "border-box",
  padding: "0 8px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "7px",
  outline: "none",
  background: COLORS.background,
  color: COLORS.text,
  fontSize: "11px",
  fontWeight: 550,
};

export const filterSelectStyle: CSSProperties = {
  ...filterControlStyle,
  width: "86px",
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
  border: `1px solid ${COLORS.border}`,
  borderRadius: "7px",
  background: "rgba(255,255,255,0.025)",
  color: COLORS.textSecondary,
  fontSize: "10px",
  fontWeight: 650,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const applyFilterButtonStyle: CSSProperties = {
  minHeight: "31px",
  padding: "0 11px",
  border: `1px solid ${COLORS.primary}`,
  borderRadius: "7px",
  background: COLORS.primary,
  color: COLORS.text,
  fontSize: "10px",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
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
    `1px solid ${COLORS.border}`,

  background:
    COLORS.panelSoft,

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
    COLORS.textMuted,

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
    `1px solid ${COLORS.border}`,

  background:
    COLORS.panel,

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
    COLORS.textSecondary,

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
    "#BFDBFE",

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
    COLORS.textSecondary,

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
    COLORS.text,

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
    COLORS.textMuted,

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
    COLORS.text,

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
    COLORS.textMuted,

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
    COLORS.text,

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
    "#60A5FA",

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
  status: Loan["status"],
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
          ? COLORS.border
          : COLORS.successBorder
      }`,

    borderRadius:
      "999px",

    background:
      isClosed
        ? COLORS.closedSoft
        : COLORS.successSoft,

    color:
      isClosed
        ? COLORS.closed
        : COLORS.success,

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
    COLORS.panel,

};


// ============================================================
// EMPTY TITLE
// ============================================================

export const emptyTitleStyle:
  CSSProperties = {

  color:
    COLORS.text,

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
    COLORS.textMuted,

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
    "1px solid rgba(96, 165, 250, 0.35)",

  borderRadius:
    "8px",

  background:
    COLORS.primary,

  color:
    COLORS.text,

  fontSize:
    "12px",

  fontWeight:
    750,

  cursor:
    "pointer",

  boxShadow:
    "0 7px 18px rgba(37, 99, 235, 0.20)",

};



// ============================================================
// TABLE FOOTER
// ============================================================

export const tableFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  minHeight: "36px",
  padding: "0 14px",
  borderTop: `1px solid ${COLORS.border}`,
  background: COLORS.panel,
  boxSizing: "border-box",
};

export const tableShowingStyle: CSSProperties = {
  color: COLORS.textMuted,
  fontSize: "11px",
  fontWeight: 550,
};

// ============================================================
// END
// ============================================================
