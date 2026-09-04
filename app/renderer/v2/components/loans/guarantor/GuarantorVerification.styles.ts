// ============================================================
// FINORA ENTERPRISE V2
//
// GUARANTOR STUDIO
// GUARANTOR VERIFICATION STYLES
//
// RESPONSIBILITY:
// - GuarantorVerification presentation only
// - Premium compact verification configuration layout
// - FINORA Enterprise Theme Engine compatibility
// - Native input/select controls visually normalized
// - Single-viewport Step 4 compatibility
//
// DESIGN:
// - Theme colours are supplied by the existing FINORA Theme Engine
// - No local hard-coded application colours
// - Minimum font-size: 12px
// - Font weights: 500–750
//
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME TOKENS
//
// Values are resolved from the existing FINORA Theme Engine
// CSS variable bridge.
//
// No new colours are introduced.
// ============================================================

const THEME = {
  panel:
    "var(--finora-theme-background-surface)",

  panelSoft:
    "var(--finora-theme-background-surface-muted)",

  input:
    "var(--finora-theme-surface-strong)",

  inputHover:
    "var(--finora-theme-surface-strong)",

  inputFocus:
    "var(--finora-theme-surface-strong)",

  border:
    "var(--finora-theme-border-default)",

  borderStrong:
    "var(--finora-theme-border-strong)",

  primary:
    "var(--finora-theme-brand-primary)",

  primaryHover:
    "var(--finora-theme-brand-secondary)",

  primarySoft:
    "var(--finora-theme-brand-accent-soft)",

  primaryGlow:
    "var(--finora-theme-brand-accent-soft)",

  text:
    "var(--finora-theme-text-primary)",

  textSecondary:
    "var(--finora-theme-text-secondary)",

  textMuted:
    "var(--finora-theme-text-muted)",

  overlayShadow:
    "var(--finora-theme-overlay-shadow)",
} as const;

// ============================================================
// WRAPPER
// ============================================================

export const wrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",

  padding: "9px 12px",

  marginBottom: "10px",

  border: `1px solid ${THEME.border}`,
  borderRadius: "10px",

  background: `linear-gradient(
    180deg,
    ${THEME.panel},
    ${THEME.panelSoft}
  )`,

  boxShadow: `0 6px 18px ${THEME.overlayShadow}`,

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

  color: THEME.text,

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

  background: THEME.primary,

  boxShadow: `0 0 10px ${THEME.primaryGlow}`,
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

  border: `1px solid ${THEME.border}`,

  background: THEME.input,

  color: THEME.text,

  fontSize: "12px",

  fontWeight: 600,

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

  border: `1px solid ${THEME.border}`,

  backgroundColor: THEME.input,

  color: THEME.text,

  fontSize: "12px",

  fontWeight: 600,

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
  borderColor: THEME.primary,

  boxShadow: `0 0 0 1px ${THEME.primary},
    0 0 10px ${THEME.primaryGlow}`,

  background: THEME.inputFocus,
};

// ============================================================
// SELECT FOCUS
// ============================================================

export const selectFocusStyle: CSSProperties = {
  borderColor: THEME.primary,

  boxShadow: `0 0 0 1px ${THEME.primary},
    0 0 10px ${THEME.primaryGlow}`,

  backgroundColor: THEME.inputFocus,
};

// ============================================================
// END
// ============================================================