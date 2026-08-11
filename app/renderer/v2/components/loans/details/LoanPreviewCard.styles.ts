// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN PREVIEW CARD STYLES
//
// RESPONSIBILITY:
// - LoanPreviewCard presentation only
// - Clean enterprise financial summary
// - Step 1 information hierarchy
//
// DESIGN:
// - Primary Blue: #2563EB
// - Dark Navy: #0F172A
// - No brown
// - No gold
// - Minimum font-size: 12px
// - Font weights: 500–750
//
// ============================================================

import type {
  CSSProperties,
} from "react";


// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {

  background:
    "#0F172A",

  panel:
    "#111C2E",

  panelSoft:
    "#142238",

  border:
    "rgba(148, 163, 184, 0.16)",

  borderStrong:
    "rgba(37, 99, 235, 0.42)",

  primary:
    "#2563EB",

  primarySoft:
    "rgba(37, 99, 235, 0.14)",

  text:
    "#FFFFFF",

  textSecondary:
    "#CBD5E1",

  textMuted:
    "#94A3B8",

};


// ============================================================
// CARD WRAPPER
// ============================================================

export const cardStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  boxSizing:
    "border-box",

  padding:
    "17px 18px 18px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius:
    "13px",

  background:
    `linear-gradient(
      180deg,
      ${COLORS.panel},
      ${COLORS.background}
    )`,

  color:
    COLORS.text,

  boxShadow:
    "0 10px 28px rgba(0, 0, 0, 0.18)",
};


// ============================================================
// CONTENT
// ============================================================

export const contentStyle:
  CSSProperties = {

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "10px",

  width:
    "100%",

  minWidth:
    0,

  boxSizing:
    "border-box",
};


// ============================================================
// GROUP
// ============================================================

export const groupStyle:
  CSSProperties = {

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "5px",

  width:
    "100%",

  minWidth:
    0,

  boxSizing:
    "border-box",
};


// ============================================================
// GROUP TITLE
// ============================================================

export const groupTitleStyle:
  CSSProperties = {

  padding:
    "1px 2px",

  color:
    COLORS.textSecondary,

  fontSize:
    "11px",

  fontWeight:
    750,

  lineHeight:
    1.2,

  textTransform:
    "uppercase",

  letterSpacing:
    "0.06em",
};


// ============================================================
// PREVIEW ROW
// ============================================================

export const rowStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "space-between",

  gap:
    "8px",

  minWidth:
    0,

  minHeight:
    "31px",

  padding:
    "6px 8px",

  boxSizing:
    "border-box",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius:
    "6px",

  background:
    COLORS.panelSoft,

  color:
    COLORS.textSecondary,

  fontSize:
    "12px",

  fontWeight:
    500,

  lineHeight:
    1.25,
};


// ============================================================
// LABEL
// ============================================================

export const labelStyle:
  CSSProperties = {

  minWidth:
    0,

  color:
    COLORS.textMuted,

  fontSize:
    "12px",

  fontWeight:
    550,

  lineHeight:
    1.25,

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace:
    "nowrap",
};


// ============================================================
// VALUE
// ============================================================

export const valueStyle:
  CSSProperties = {

  minWidth:
    0,

  color:
    COLORS.text,

  fontSize:
    "12px",

  fontWeight:
    650,

  lineHeight:
    1.25,

  textAlign:
    "right",

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace:
    "nowrap",
};


// ============================================================
// CUSTOMER VALUE
// ============================================================

export const customerValueStyle:
  CSSProperties = {

  ...valueStyle,

  color:
    COLORS.text,

  fontWeight:
    700,
};


// ============================================================
// FINANCIAL VALUE
// ============================================================

export const financialValueStyle:
  CSSProperties = {

  ...valueStyle,

  color:
    COLORS.text,

  fontSize:
    "13px",

  fontWeight:
    750,
};


// ============================================================
// HIGHLIGHT ROW
// ============================================================

export const highlightRowStyle:
  CSSProperties = {

  ...rowStyle,

  borderColor:
    COLORS.borderStrong,

  background:
    `linear-gradient(
      90deg,
      ${COLORS.primarySoft},
      ${COLORS.panelSoft}
    )`,

  boxShadow:
    "inset 2px 0 0 rgba(37, 99, 235, 0.55)",
};


// ============================================================
// FULL WIDTH CUSTOMER ROW
// ============================================================

export const fullWidthRowStyle:
  CSSProperties = {

  ...rowStyle,

  minHeight:
    "34px",

  padding:
    "7px 9px",

  background:
    `linear-gradient(
      90deg,
      ${COLORS.primarySoft},
      ${COLORS.panelSoft}
    )`,

  borderColor:
    COLORS.borderStrong,
};


// ============================================================
// END
// ============================================================
