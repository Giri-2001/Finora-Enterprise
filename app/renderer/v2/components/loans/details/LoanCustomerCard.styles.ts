// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN CUSTOMER CARD STYLES
//
// THEME:
// - Visual colours come only from FINORA Theme Engine.
// - No local colour palette.
// - No hardcoded theme colours.
// - Layout / dimensions unchanged.
//
// IMPORTANT:
// - No business logic.
// - No responsive logic.
// - No behaviour changes.
// - No selector/dropdown geometry changes.
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
    "var(--finora-theme-brand-primary)",

  primarySoft:
    "var(--finora-theme-brand-accent-soft)",

  input:
    "var(--finora-theme-surface-strong)",

  dropdown:
    "var(--finora-theme-surface)",

  dropdownSoft:
    "var(--finora-theme-surface-muted)",

  border:
    "var(--finora-theme-border-default)",

  borderStrong:
    "var(--finora-theme-border-strong)",

  text:
    "var(--finora-theme-text-primary)",

  textSecondary:
    "var(--finora-theme-text-secondary)",

  textMuted:
    "var(--finora-theme-text-muted)",

  shadow:
    "var(--finora-theme-overlay-shadow)",

};


// ============================================================
// CARD
// ============================================================

export const cardStyle: CSSProperties = {

  width: "100%",

  height: "100%",

  minWidth: 0,

  minHeight: 0,

  boxSizing: "border-box",

  background:
    THEME.primarySoft,

  border:
    `1px solid ${THEME.border}`,

  borderRadius: "16px",

  color:
    THEME.text,

  boxShadow:
    `var(--finora-theme-overlay-shadow)`,

  overflow: "visible",

  position: "relative",

  zIndex: 10,
};


// ============================================================
// CONTENT
// ============================================================

export const contentStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  minHeight: 0,

  display: "flex",

  flexDirection: "column",

  gap: "10px",

  boxSizing: "border-box",

};


// ============================================================
// CUSTOMER SELECTOR WRAPPER
// ============================================================

export const selectorWrapperStyle: CSSProperties = {

  position: "relative",

  width: "100%",

  minWidth: "100%",

  maxWidth: "100%",

  alignSelf: "stretch",

  boxSizing: "border-box",

  zIndex: 1000,

};


// ============================================================
// CUSTOMER SELECTOR BUTTON
// ============================================================

export const selectorButtonStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  height: "36px",

  minHeight: "36px",

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "8px",

  padding: "0 11px",

  boxSizing: "border-box",

  borderRadius: "7px",

  border:
    `1px solid ${THEME.borderStrong}`,

  background:
    THEME.dropdownSoft,

  color:
    THEME.primary,

  cursor: "pointer",

  textAlign: "left",

  fontSize: "12px",

  fontWeight: 700,

  outline: "none",

};


// ============================================================
// SELECTOR BUTTON TEXT
// ============================================================

export const selectorButtonTextStyle: CSSProperties = {

  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color:
    THEME.text,

  fontSize: "12px",

  fontWeight: 700,

  lineHeight: 1.2,

};


// ============================================================
// SELECTOR ARROW
// ============================================================

export const selectorArrowStyle: CSSProperties = {

  flexShrink: 0,

  color:
    THEME.primary,

  fontSize: "9px",

  lineHeight: 1,

};


// ============================================================
// DROPDOWN
// ============================================================

export const dropdownStyle: CSSProperties = {

  position: "absolute",

  top: "calc(100% + 5px)",

  left: 0,

  width: "calc(100vw - 32px)",

  maxWidth: "380px",

  maxHeight: "280px",

  overflowY: "auto",

  overflowX: "hidden",

  boxSizing: "border-box",

  padding: "6px",

  borderRadius: "9px",

  border:
    `1px solid ${THEME.border}`,

  background:
    THEME.dropdown,

  boxShadow:
    `0 18px 40px ${THEME.shadow}`,

  zIndex: 99999,

  scrollbarWidth: "none",

};


// ============================================================
// SEARCH INPUT
// ============================================================

export const searchInputStyle: CSSProperties = {

  width: "100%",

  height: "34px",

  minHeight: "34px",

  boxSizing: "border-box",

  marginBottom: "6px",

  padding: "0 10px",

  borderRadius: "8px",

  border:
    `1px solid ${THEME.border}`,

  background:
    THEME.dropdownSoft,

  color:
    THEME.text,

  fontSize: "12px",

  outline: "none",

};


// ============================================================
// CUSTOMER OPTIONS
// ============================================================

export const customerOptionStyle: CSSProperties = {

  width: "100%",

  display: "flex",

  flexDirection: "column",

  alignItems: "flex-start",

  gap: "3px",

  padding: "8px 9px",

  margin: 0,

  boxSizing: "border-box",

  border: "1px solid transparent",

  borderRadius: "7px",

  background: "transparent",

  color:
    THEME.textSecondary,

  cursor: "pointer",

  textAlign: "left",

};


// ============================================================
// ACTIVE CUSTOMER OPTION
// ============================================================

export const customerOptionActiveStyle: CSSProperties = {

  ...customerOptionStyle,

  border:
    `1px solid ${THEME.primary}`,

  background:
    THEME.primarySoft,

};


// ============================================================
// CUSTOMER OPTION NAME
// ============================================================

export const customerOptionNameStyle: CSSProperties = {

  width: "100%",

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color:
    THEME.text,

  fontSize: "12px",

  fontWeight: 700,

  lineHeight: 1.2,

};


// ============================================================
// CUSTOMER OPTION META
// ============================================================

export const customerOptionMetaStyle: CSSProperties = {

  width: "100%",

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color:
    THEME.text,

  fontSize: "10px",

  fontWeight: 500,

  lineHeight: 1.2,

};


// ============================================================
// SELECTED CUSTOMER NAME
// ============================================================

export const customerNameStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color:
    THEME.text,

  fontSize: "13px",

  fontWeight: 700,

  lineHeight: 1.2,

  textAlign: "left",

};


// ============================================================
// CUSTOMER DETAILS
// ============================================================

export const detailStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  display: "block",

  boxSizing: "border-box",

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color:
    THEME.text,

  fontSize: "14px",

  fontWeight: 600,

  lineHeight: "18px",

  textAlign: "left",

  padding: "0 2px",

};


// ============================================================
// EMPTY STATE
// ============================================================

export const emptyStateStyle: CSSProperties = {

  width: "100%",

  boxSizing: "border-box",

  padding: "10px 8px",

  color:
    THEME.text,

  fontSize: "11px",

  fontWeight: 500,

  lineHeight: 1.3,

  textAlign: "center",

};


// ============================================================
// END
// ============================================================