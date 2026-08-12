// ============================================================
// FINORA ENTERPRISE V2
//
// GUARANTOR STUDIO
// GUARANTOR VERIFICATION STYLES
//
// RESPONSIBILITY:
// - GuarantorVerification presentation only
// - Premium compact verification configuration layout
// - FINORA Enterprise dark navy theme
// - Native input/select controls visually normalized
// - Single-viewport Step 4 compatibility
//
// DESIGN:
// - Primary Blue: #2563EB
// - No brown
// - No gold
// - Minimum font-size: 12px
// - Font weights: 500–750
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
  inputHover: "#0D192D",
  inputFocus: "#0A1425",

  border: "rgba(148, 163, 184, 0.18)",
  borderStrong: "rgba(37, 99, 235, 0.38)",

  primary: "#2563EB",
  primaryHover: "#3B82F6",

  primarySoft: "rgba(37, 99, 235, 0.14)",
  primaryGlow: "rgba(37, 99, 235, 0.20)",

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

  padding: "9px 12px",

  marginBottom: "10px",

  border: `1px solid ${COLORS.border}`,
  borderRadius: "10px",

  background: `linear-gradient(
    180deg,
    ${COLORS.panel},
    ${COLORS.panelSoft}
  )`,

  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.14)",

  overflow: "hidden",
};

// ============================================================
// HEADER
// ============================================================

export const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",

  gap: "7px",

  minHeight: "18px",

  marginBottom: "9px",

  color: COLORS.text,

  fontSize: "14px",
  fontWeight: 750,

  lineHeight: 1.2,

  boxSizing: "border-box",
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

  boxShadow: `0 0 10px ${COLORS.primaryGlow}`,
};

// ============================================================
// CONTENT
// ============================================================

export const contentStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",

  gap: "7px 10px",

  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",

  overflow: "hidden",
};

// ============================================================
// FIELD
// ============================================================

export const fieldStyle: CSSProperties = {
  minWidth: 0,
  width: "100%",

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",

  overflow: "hidden",
};

// ============================================================
// FIELD CONTENT
// ============================================================

export const fieldContentStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",
};

// ============================================================
// FINORA INPUT
// ============================================================

export const inputStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  height: "38px",

  padding: "8px 11px",

  borderRadius: "8px",

  border: `1px solid ${COLORS.border}`,

  background: COLORS.input,

  color: COLORS.text,

  fontSize: "12px",

  fontWeight: 550,

  lineHeight: 1.2,

  outline: "none",

  appearance: "none",

  WebkitAppearance: "none",

  transition:
    "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",

  boxShadow: "none",
};

// ============================================================
// FINORA SELECT
// ============================================================

export const selectStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  height: "38px",

  padding: "8px 34px 8px 11px",

  borderRadius: "8px",

  border: `1px solid ${COLORS.border}`,

  backgroundColor: COLORS.input,

  color: COLORS.text,

  fontSize: "12px",

  fontWeight: 550,

  lineHeight: 1.2,

  outline: "none",

  appearance: "none",

  WebkitAppearance: "none",

  cursor: "pointer",

  transition:
    "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",

  boxShadow: "none",
};

// ============================================================
// INPUT FOCUS
// ============================================================

export const inputFocusStyle: CSSProperties = {
  borderColor: COLORS.primary,

  boxShadow: `0 0 0 1px ${COLORS.primary},
    0 0 10px ${COLORS.primaryGlow}`,

  background: COLORS.inputFocus,
};

// ============================================================
// SELECT FOCUS
// ============================================================

export const selectFocusStyle: CSSProperties = {
  borderColor: COLORS.primary,

  boxShadow: `0 0 0 1px ${COLORS.primary},
    0 0 10px ${COLORS.primaryGlow}`,

  backgroundColor: COLORS.inputFocus,
};

// ============================================================
// END
// ============================================================
