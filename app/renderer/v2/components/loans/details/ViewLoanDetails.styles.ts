// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOANS OFFICE™
// VIEW LOAN DETAILS
//
// STYLES
//
// RESPONSIBILITY:
// - View Loan Details presentation styling
// - Read-only enterprise loan workspace
//
// IMPORTANT:
// - No business logic
// - No calculations
// - No persistence
// - No repository access
// - No Loan Studio styling modification
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

import type {
  CSSProperties,
} from "react";


// ============================================================
// COLORS
// ============================================================

export const COLORS = {

  background:
    "#0B1220",

  panel:
    "#111C2E",

  panelSoft:
    "#142238",

  panelHover:
    "#182A43",

  border:
    "rgba(148,163,184,0.18)",

  borderStrong:
    "rgba(148,163,184,0.28)",

  primary:
    "#2563EB",

  primarySoft:
    "rgba(37,99,235,0.12)",

  primaryBorder:
    "rgba(37,99,235,0.35)",

  text:
    "#FFFFFF",

  textSecondary:
    "#CBD5E1",

  textMuted:
    "#94A3B8",

  textDim:
    "#64748B",

  success:
    "#22C55E",

  successSoft:
    "rgba(34,197,94,0.10)",

  warning:
    "#F59E0B",

  warningSoft:
    "rgba(245,158,11,0.10)",

  danger:
    "#EF4444",

  dangerSoft:
    "rgba(239,68,68,0.10)",

} as const;


// ============================================================
// PAGE
// ============================================================

export const pageStyle:
  CSSProperties = {

  width:
    "100%",

  minHeight:
    "100%",

  boxSizing:
    "border-box",

  padding:
    "20px",

  background:
    COLORS.background,

  color:
    COLORS.text,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "16px",

};


// ============================================================
// HEADER
// ============================================================

export const headerStyle:
  CSSProperties = {

  width:
    "100%",

  minHeight:
    "68px",

  boxSizing:
    "border-box",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "space-between",

  gap:
    "16px",

  padding:
    "14px 18px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius:
    "14px",

  background:
    `linear-gradient(180deg, ${COLORS.panel}, ${COLORS.panelSoft})`,

  boxShadow:
    "0 8px 24px rgba(0,0,0,0.16)",

};


export const headerLeftStyle:
  CSSProperties = {

  minWidth:
    0,

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "12px",

};


export const backButtonStyle:
  CSSProperties = {

  minWidth:
    "78px",

  height:
    "34px",

  padding:
    "0 12px",

  border:
    `1px solid ${COLORS.borderStrong}`,

  borderRadius:
    "8px",

  background:
    "rgba(255,255,255,0.04)",

  color:
    COLORS.textSecondary,

  fontSize:
    "12px",

  fontWeight:
    700,

  cursor:
    "pointer",

};


export const headerAccentStyle:
  CSSProperties = {

  width:
    "3px",

  height:
    "38px",

  flexShrink:
    0,

  borderRadius:
    "3px",

  background:
    COLORS.primary,

  boxShadow:
    "0 0 12px rgba(37,99,235,0.35)",

};


export const titleGroupStyle:
  CSSProperties = {

  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "3px",

};


export const titleStyle:
  CSSProperties = {

  margin:
    0,

  color:
    COLORS.text,

  fontSize:
    "18px",

  fontWeight:
    800,

  lineHeight:
    1.2,

};


export const subtitleStyle:
  CSSProperties = {

  margin:
    0,

  color:
    COLORS.textMuted,

  fontSize:
    "11px",

  fontWeight:
    500,

  lineHeight:
    1.3,

};


export const headerMetaStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "8px",

  flexShrink:
    0,

};


export const loanNumberBadgeStyle:
  CSSProperties = {

  padding:
    "7px 10px",

  border:
    `1px solid ${COLORS.primaryBorder}`,

  borderRadius:
    "7px",

  background:
    COLORS.primarySoft,

  color:
    "#93C5FD",

  fontSize:
    "11px",

  fontWeight:
    750,

  whiteSpace:
    "nowrap",

};


// ============================================================
// STATUS
// ============================================================

export function statusBadgeStyle(
  status: string,
): CSSProperties {

  const normalized =
    status
      .trim()
      .toUpperCase();

  if (
    normalized ===
    "CLOSED"
  ) {

    return {

      padding:
        "6px 10px",

      border:
        "1px solid rgba(34,197,94,0.28)",

      borderRadius:
        "999px",

      background:
        COLORS.successSoft,

      color:
        "#86EFAC",

      fontSize:
        "11px",

      fontWeight:
        750,

      whiteSpace:
        "nowrap",

    };

  }

  if (
    normalized ===
    "ACTIVE" ||
    normalized ===
    "RUNNING"
  ) {

    return {

      padding:
        "6px 10px",

      border:
        "1px solid rgba(37,99,235,0.32)",

      borderRadius:
        "999px",

      background:
        COLORS.primarySoft,

      color:
        "#93C5FD",

      fontSize:
        "11px",

      fontWeight:
        750,

      whiteSpace:
        "nowrap",

    };

  }

  return {

    padding:
      "6px 10px",

    border:
      "1px solid rgba(245,158,11,0.28)",

    borderRadius:
      "999px",

    background:
      COLORS.warningSoft,

    color:
      "#FCD34D",

    fontSize:
      "11px",

    fontWeight:
      750,

    whiteSpace:
      "nowrap",

  };

}


// ============================================================
// GRID
// ============================================================

export const contentGridStyle:
  CSSProperties = {

  width:
    "100%",

  display:
    "grid",

  gridTemplateColumns:
    "minmax(0, 1.35fr) minmax(320px, 0.65fr)",

  gap:
    "16px",

  alignItems:
    "start",

};


export const sectionStyle:
  CSSProperties = {

  minWidth:
    0,

  boxSizing:
    "border-box",

  padding:
    "16px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius:
    "14px",

  background:
    `linear-gradient(180deg, ${COLORS.panel}, ${COLORS.panelSoft})`,

  boxShadow:
    "0 7px 20px rgba(0,0,0,0.12)",

};


export const fullWidthSectionStyle:
  CSSProperties = {

  ...sectionStyle,

  width:
    "100%",

};


export const sectionHeaderStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "space-between",

  gap:
    "12px",

  marginBottom:
    "12px",

};


export const sectionTitleStyle:
  CSSProperties = {

  margin:
    0,

  color:
    COLORS.text,

  fontSize:
    "13px",

  fontWeight:
    750,

};


export const sectionSubtitleStyle:
  CSSProperties = {

  margin:
    "3px 0 0",

  color:
    COLORS.textMuted,

  fontSize:
    "10px",

  fontWeight:
    500,

};


// ============================================================
// INFORMATION GRID
// ============================================================

export const infoGridStyle:
  CSSProperties = {

  display:
    "grid",

  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",

  gap:
    "8px",

};


export const infoItemStyle:
  CSSProperties = {

  minWidth:
    0,

  padding:
    "10px",

  border:
    "1px solid rgba(148,163,184,0.12)",

  borderRadius:
    "9px",

  background:
    "rgba(255,255,255,0.025)",

};


export const infoLabelStyle:
  CSSProperties = {

  display:
    "block",

  marginBottom:
    "4px",

  color:
    COLORS.textMuted,

  fontSize:
    "10px",

  fontWeight:
    550,

};


export const infoValueStyle:
  CSSProperties = {

  display:
    "block",

  color:
    COLORS.textSecondary,

  fontSize:
    "12px",

  fontWeight:
    700,

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace:
    "nowrap",

};


export const customerNameValueStyle:
  CSSProperties = {

  ...infoValueStyle,

  color:
    COLORS.text,

  fontSize:
    "13px",

};


// ============================================================
// FINANCIAL
// ============================================================

export const financialGridStyle:
  CSSProperties = {

  display:
    "grid",

  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",

  gap:
    "8px",

};


export const financialCardStyle:
  CSSProperties = {

  minWidth:
    0,

  padding:
    "12px",

  border:
    "1px solid rgba(148,163,184,0.13)",

  borderRadius:
    "9px",

  background:
    "rgba(255,255,255,0.025)",

};


export const financialLabelStyle:
  CSSProperties = {

  display:
    "block",

  marginBottom:
    "5px",

  color:
    COLORS.textMuted,

  fontSize:
    "10px",

  fontWeight:
    550,

};


export const financialValueStyle:
  CSSProperties = {

  display:
    "block",

  color:
    COLORS.text,

  fontSize:
    "14px",

  fontWeight:
    800,

};


export const primaryFinancialCardStyle:
  CSSProperties = {

  ...financialCardStyle,

  border:
    `1px solid ${COLORS.primaryBorder}`,

  background:
    COLORS.primarySoft,

};


export const outstandingFinancialCardStyle:
  CSSProperties = {

  ...financialCardStyle,

  border:
    "1px solid rgba(245,158,11,0.24)",

  background:
    COLORS.warningSoft,

};


// ============================================================
// TEXT BLOCKS
// ============================================================

export const textBlockStyle:
  CSSProperties = {

  minHeight:
    "54px",

  padding:
    "10px",

  border:
    "1px solid rgba(148,163,184,0.12)",

  borderRadius:
    "9px",

  background:
    "rgba(255,255,255,0.025)",

  color:
    COLORS.textSecondary,

  fontSize:
    "11px",

  fontWeight:
    500,

  lineHeight:
    1.5,

  whiteSpace:
    "pre-wrap",

  overflowWrap:
    "anywhere",

};


// ============================================================
// SCHEDULE
// ============================================================

export const scheduleWrapperStyle:
  CSSProperties = {

  width:
    "100%",

  overflowX:
    "auto",

  border:
    "1px solid rgba(148,163,184,0.12)",

  borderRadius:
    "9px",

};


export const scheduleHeaderStyle:
  CSSProperties = {

  display:
    "grid",

  gridTemplateColumns:
    "70px minmax(130px, 1fr) repeat(4, minmax(110px, 1fr))",

  minWidth:
    "720px",

  padding:
    "9px 10px",

  borderBottom:
    "1px solid rgba(148,163,184,0.14)",

  background:
    "rgba(255,255,255,0.035)",

};


export const scheduleHeaderCellStyle:
  CSSProperties = {

  color:
    COLORS.textMuted,

  fontSize:
    "9px",

  fontWeight:
    700,

  textTransform:
    "uppercase",

  letterSpacing:
    "0.03em",

};


export const scheduleRowStyle:
  CSSProperties = {

  display:
    "grid",

  gridTemplateColumns:
    "70px minmax(130px, 1fr) repeat(4, minmax(110px, 1fr))",

  minWidth:
    "720px",

  padding:
    "9px 10px",

  borderBottom:
    "1px solid rgba(148,163,184,0.08)",

};


export const scheduleCellStyle:
  CSSProperties = {

  color:
    COLORS.textSecondary,

  fontSize:
    "10px",

  fontWeight:
    600,

};


export const scheduleEmptyStyle:
  CSSProperties = {

  padding:
    "18px",

  textAlign:
    "center",

  color:
    COLORS.textMuted,

  fontSize:
    "11px",

};


// ============================================================
// FOOTER
// ============================================================

export const footerStyle:
  CSSProperties = {

  display:
    "flex",

  justifyContent:
    "flex-end",

  alignItems:
    "center",

  padding:
    "4px 0",

};


export const footerBackButtonStyle:
  CSSProperties = {

  minHeight:
    "36px",

  padding:
    "0 16px",

  border:
    `1px solid ${COLORS.primaryBorder}`,

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
    "0 7px 18px rgba(37,99,235,0.20)",

};


// ============================================================
// RESPONSIVE
// ============================================================

export const responsiveMediaQuery = `
  @media (max-width: 1100px) {
    .finora-view-loan-details-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 760px) {
    .finora-view-loan-details-grid {
      gap: 12px !important;
    }
  }
`;



// ============================================================
// END
// ============================================================
