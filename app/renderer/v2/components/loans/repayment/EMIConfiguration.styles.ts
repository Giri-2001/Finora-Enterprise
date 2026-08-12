// ============================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO
// EMI CONFIGURATION STYLES
//
// RESPONSIBILITY:
// - EMIConfiguration presentation only
// - Compact vertical repayment controls
// - FINORA Enterprise dark navy theme
//
// IMPORTANT:
// - No business logic.
// - No calculations.
// - No schedule logic.
// - No persistence.
// - Global common input styles are NOT modified.
//
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {
  panel: "#111C2E",
  panelSoft: "#142238",

  input: "#0A1425",

  border: "rgba(148, 163, 184, 0.20)",
  inputBorder: "rgba(148, 163, 184, 0.22)",

  primary: "#2563EB",
  primarySoft: "rgba(37, 99, 235, 0.14)",
  primaryGlow: "rgba(37, 99, 235, 0.22)",

  text: "#FFFFFF",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
};

// ============================================================
// WRAPPER
// ============================================================

export const wrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",

  padding: "10px 14px",

  border: `1px solid ${COLORS.border}`,
  borderRadius: "10px",

  background: `linear-gradient(
    180deg,
    ${COLORS.panel},
    ${COLORS.panelSoft}
  )`,

  boxShadow:
    "0 6px 18px rgba(0, 0, 0, 0.14)",

  overflow: "visible",
};

// ============================================================
// CONTENT
//
// Two controls are intentionally stacked vertically.
// ============================================================

export const contentStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns:
    "minmax(0, 1fr)",

  gridAutoRows: "auto",

  gap: "0px",

  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",

  overflow: "visible",
};

// ============================================================
// HEADER
// ============================================================

export const headerStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "8px",

  minHeight: "18px",

  marginBottom: "8px",

  color: COLORS.text,

  fontSize: "14px",

  fontWeight: 750,

  lineHeight: 1.2,
};

// ============================================================
// HEADER ACCENT
// ============================================================

export const accentStyle: CSSProperties = {
  width: "3px",
  height: "16px",

  flexShrink: 0,

  borderRadius: "3px",

  background: COLORS.primary,

  boxShadow:
    `0 0 10px ${COLORS.primarySoft}`,
};

// ============================================================
// FIELD
// ============================================================

export const fieldStyle: CSSProperties = {
  minWidth: 0,

  width: "100%",

  boxSizing: "border-box",

  overflow: "visible",
};

// ============================================================
// FIELD CONTENT
// ============================================================

export const fieldContentStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
};

// ============================================================
// FINORA INPUT STYLE
//
// Applied ONLY to EMIConfiguration controls.
// Does not modify global SelectInput/TextInput.
// ============================================================

export const inputStyle: CSSProperties = {
  width: "100%",

  minHeight: "42px",

  padding: "10px 12px",

  boxSizing: "border-box",

  borderRadius: "8px",

  border:
    `1px solid ${COLORS.inputBorder}`,

  background: COLORS.input,

  color: COLORS.text,

  fontSize: "12px",

  fontWeight: 600,

  outline: "none",

  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.02)",

  transition:
    "border-color 0.16s ease, box-shadow 0.16s ease",
};

// ============================================================
// END
// ============================================================
