// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN PREVIEW CARD STYLES
//
// THEME:
// - Visual colours come from FINORA Theme Engine CSS variables.
// - No local theme palette.
// - Layout / dimensions unchanged.
//
// ============================================================

import type {
  CSSProperties,
} from "react";


// ============================================================
// THEME TOKENS
// ============================================================

const THEME = {

  background:
    "var(--finora-theme-background-page, var(--finora-theme-surface, #0F172A))",

  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.16))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.42))",

  primarySoft:
    "var(--finora-theme-brand-accent-soft, rgba(37, 99, 235, 0.14))",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.18))",

  primary:
  "var(--finora-theme-brand-primary, #2563EB)",

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
    "10px 18px 18px",

  border:
    `1px solid ${THEME.border}`,

  borderRadius:
    "13px",

  background:
  THEME.panel,

  color:
    THEME.text,

  boxShadow:
  "none",

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
    THEME.textSecondary,

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
    `1px solid ${THEME.border}`,

  borderRadius:
    "6px",

  background:
    THEME.panelSoft,

  color:
    THEME.textSecondary,

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
    THEME.textMuted,

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
    THEME.text,

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
    THEME.text,

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
    THEME.text,

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
    THEME.borderStrong,

  background:
  THEME.panel,

  boxShadow:
  "none",

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
  THEME.panel,

  borderColor:
    THEME.borderStrong,

};

export const previewBadgeStyle: CSSProperties = {
  padding: "5px 9px",
  borderRadius: "6px",
  border: `1px solid ${THEME.borderStrong}`,
  background: THEME.panelSoft,
  color: THEME.textSecondary,
  fontSize: "12px",
  fontWeight: 650,
  whiteSpace: "nowrap",
};


// ============================================================
// END
// ============================================================