// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN CUSTOMER CARD STYLES
//
// RESPONSIBILITY:
// - Customer selector presentation
// - Selected customer details presentation
// - Premium compact enterprise layout
// - Dropdown visibility and scrolling
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
} from "react";

// ============================================================
// CARD
// ============================================================

export const cardStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,

  boxSizing: "border-box",

  alignSelf: "stretch",

  overflow: "visible",
};

// ============================================================
// CONTENT
//
// Layout:
// 1. Customer selector
// 2. Customer ID
// 3. Phone number
//
// Everything stays left aligned.
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
  border: "1px solid #2563EB",

  background: "#0D192D",
  color: "#F8FAFC",

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

  color: "#F8FAFC",

  fontSize: "12px",

  fontWeight: 700,

  lineHeight: 1.2,
};

// ============================================================
// SELECTOR ARROW
// ============================================================

export const selectorArrowStyle: CSSProperties = {
  flexShrink: 0,

  color: "#60A5FA",

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

  border: "1px solid #334155",

  background: "#0B1426",

  boxShadow:
    "0 18px 40px rgba(0,0,0,0.48)",

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

  border: "1px solid #334155",

  background: "#111D33",

  color: "#F8FAFC",

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

  color: "#E2E8F0",

  cursor: "pointer",

  textAlign: "left",
};

// ============================================================
// ACTIVE CUSTOMER OPTION
// ============================================================

export const customerOptionActiveStyle: CSSProperties = {
  ...customerOptionStyle,

  border:
    "1px solid #2563EB",

  background:
    "#14264A",
};

// ============================================================
// CUSTOMER OPTION NAME
// ============================================================

export const customerOptionNameStyle: CSSProperties = {
  width: "100%",

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color: "#F8FAFC",

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

  color: "#94A3B8",

  fontSize: "10px",

  fontWeight: 500,

  lineHeight: 1.2,
};

// ============================================================
// SELECTED CUSTOMER NAME
//
// Kept for compatibility with existing imports.
// Not rendered by the current customer card layout.
// ============================================================

export const customerNameStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color: "#F8FAFC",

  fontSize: "13px",

  fontWeight: 700,

  lineHeight: 1.2,

  textAlign: "left",
};

// ============================================================
// CUSTOMER DETAILS
//
// Used for:
// - Customer ID
// - Phone Number
//
// Both appear vertically below the selector.
// ============================================================

export const detailStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  display: "block",

  boxSizing: "border-box",

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color: "#CBD5E1",

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

  color: "#94A3B8",

  fontSize: "11px",

  fontWeight: 500,

  lineHeight: 1.3,

  textAlign: "center",
};

// ============================================================
// END
// ============================================================
