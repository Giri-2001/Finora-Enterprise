// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN HEADER STYLES
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
// FINORA THEME TOKENS
// ============================================================

const THEME = {

  primary:
    "var(--finora-theme-brand-primary, #2563EB)",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(37, 99, 235, 0.55))",

};


// ============================================================
// HEADER
// ============================================================

export const headerStyle:
  CSSProperties = {

  width:
    "100%",

  boxSizing:
    "border-box",

  marginBottom:
    "10px",

  padding:
    "0 2px",

  display:
    "flex",

  flexDirection:
    "column",

  alignItems:
    "flex-start",

};


// ============================================================
// BLUE / PRIMARY ACCENT
// ============================================================

export const accentStyle:
  CSSProperties = {

  width:
    "34px",

  height:
    "3px",

  marginBottom:
    "5px",

  borderRadius:
    "999px",

  background:
    THEME.primary,

  boxShadow:
    `0 0 9px ${THEME.shadow}`,

};


// ============================================================
// TITLE
// ============================================================

export const titleStyle:
  CSSProperties = {

  margin:
    0,

  padding:
    0,

  color:
    THEME.text,

  fontSize:
    "21px",

  fontWeight:
    750,

  lineHeight:
    1.2,

  letterSpacing:
    "-0.01em",

};


// ============================================================
// SUBTITLE
// ============================================================

export const subtitleStyle:
  CSSProperties = {

  margin:
    "4px 0 0 0",

  padding:
    0,

  color:
    THEME.textMuted,

  fontSize:
    "12px",

  fontWeight:
    500,

  lineHeight:
    1.35,

};


// ============================================================
// END
// ============================================================