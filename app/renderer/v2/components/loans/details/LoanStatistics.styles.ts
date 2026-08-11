// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN STATISTICS STYLES
//
// RESPONSIBILITY:
// - LoanStatistics presentation only
// - Premium KPI presentation
// - Dark navy enterprise finance theme
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
// STATISTICS GRID
// ============================================================

export const statisticsGridStyle:
  CSSProperties = {

  display:
    "grid",

  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",

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
// STATISTIC ITEM
// ============================================================

export const statisticItemStyle:
  CSSProperties = {

  display:
    "flex",

  flexDirection:
    "column",

  justifyContent:
    "center",

  gap:
    "5px",

  minWidth:
    0,

  minHeight:
    "78px",

  padding:
    "11px 12px",

  boxSizing:
    "border-box",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius:
    "9px",

  background:
    COLORS.panelSoft,

  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.02)",
};

// ============================================================
// STATISTIC LABEL
// ============================================================

export const statisticLabelStyle:
  CSSProperties = {

  minWidth:
    0,

  color:
    COLORS.textMuted,

  fontSize:
    "12px",

  fontWeight:
    600,

  lineHeight:
    1.2,

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace:
    "nowrap",
};

// ============================================================
// STATISTIC VALUE
// ============================================================

export const statisticValueStyle:
  CSSProperties = {

  minWidth:
    0,

  color:
    COLORS.text,

  fontSize:
    "18px",

  fontWeight:
    750,

  lineHeight:
    1.1,

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace:
    "nowrap",
};

// ============================================================
// PRIMARY STATISTIC
// ============================================================

export const primaryStatisticItemStyle:
  CSSProperties = {

  ...statisticItemStyle,

  border:
    `1px solid ${COLORS.borderStrong}`,

  background:
    `linear-gradient(
      135deg,
      ${COLORS.primarySoft},
      ${COLORS.panel}
    )`,

  boxShadow:
    "0 8px 20px rgba(37, 99, 235, 0.08)",
};

// ============================================================
// PRIMARY VALUE
// ============================================================

export const primaryValueStyle:
  CSSProperties = {

  ...statisticValueStyle,

  color:
    COLORS.text,
};

// ============================================================
// END
// ============================================================
