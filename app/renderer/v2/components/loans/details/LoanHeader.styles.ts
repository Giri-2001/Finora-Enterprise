// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN HEADER STYLES
//
// RESPONSIBILITY:
// - LoanHeader presentation only
// - Compact premium FINORA blue theme
//
// DESIGN:
// - Login-inspired dark navy
// - Primary Blue: #2563EB
// - No brown.
// - No gold.
// - Minimum font-size: 12px.
// - Font weights: 500–750.
//
// ============================================================

import type {
  CSSProperties,
} from "react";

// ============================================================
// COLORS
// ============================================================

const COLORS = {

  primary:
    "#2563EB",

  text:
    "#FFFFFF",

  textMuted:
    "#94A3B8",

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
// BLUE ACCENT
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
    COLORS.primary,

  boxShadow:
    "0 0 9px rgba(37, 99, 235, 0.55)",

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
    COLORS.text,

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
    COLORS.textMuted,

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
