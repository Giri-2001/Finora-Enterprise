// ============================================================
// FINORA ENTERPRISE V2
//
// GUARANTOR STUDIO
// GUARANTOR FORM STYLES
//
// RESPONSIBILITY:
// - GuarantorForm presentation only
// - Compact 4-column guarantor information layout
// - Equal-width fields
// - FINORA Enterprise Theme Engine compatibility
// - Theme-connected guarantor inputs
// - Single-viewport Step 4 compatibility
//
// LAYOUT:
// Guarantor Name | Mobile Number | Occupation | Address
//
// THEME:
// - Visual colours come only from FINORA Theme Engine
// - No local application colour palette
// - No hard-coded application colours
//
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {
  panel:
    "var(--finora-theme-background-surface)",

  panelSoft:
    "var(--finora-theme-background-surface-muted)",

  input:
    "var(--finora-theme-background-surface-deep)",

  border:
    "var(--finora-theme-border-default)",

  primary:
    "var(--finora-theme-brand-primary)",

  primarySoft:
    "var(--finora-theme-brand-accent-soft)",

  text:
    "var(--finora-theme-text-primary)",

  textMuted:
    "var(--finora-theme-text-muted)",

  shadow:
    "var(--finora-theme-overlay-shadow)",
  
  textSecondary: "var(--finora-theme-text-secondary)",

  
} as const;

// ============================================================
// WRAPPER
//
// Four fields remain in ONE ROW.
//
// Guarantor Name | Mobile Number | Occupation | Address
// ============================================================

export const wrapperStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",

  columnGap: "9px",
  rowGap: "0px",

  width: "100%",
  minWidth: 0,

  marginBottom: "10px",

  boxSizing: "border-box",

  padding: "8px 10px 4px 10px",

  border:
    `1px solid ${THEME.border}`,

  borderRadius: "9px",

  background:
    `linear-gradient(
      180deg,
      ${THEME.panel},
      ${THEME.panelSoft}
    )`,

  boxShadow:
    `0 4px 14px ${THEME.shadow}`,

  overflow: "hidden",
};

// ============================================================
// HEADER
// ============================================================

export const headerStyle: CSSProperties = {
  gridColumn: "1 / -1",

  display: "flex",

  alignItems: "center",

  gap: "6px",

  minHeight: "17px",

  margin: "0 0 10px 0",

  padding: 0,

  color: THEME.text,

  fontSize: "13px",

  fontWeight: 750,

  lineHeight: 1.15,

  boxSizing: "border-box",
};

// ============================================================
// HEADER ACCENT
// ============================================================

export const accentStyle: CSSProperties = {
  width: "3px",

  height: "15px",

  flexShrink: 0,

  borderRadius: "3px",

  background: THEME.primary,

  boxShadow:
    `0 0 8px ${THEME.primarySoft}`,
};

// ============================================================
// FIELD
//
// FormField internal spacing is neutralized so the four
// guarantor fields remain aligned in one row.
// ============================================================

export const fieldStyle: CSSProperties = {
  minWidth: 0,

  width: "100%",

  boxSizing: "border-box",

  display: "flex",

  flexDirection: "column",

  overflow: "hidden",

  margin: 0,

  padding: 0,
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

  margin: 0,

  padding: 0,

  overflow: "hidden",
};

// ============================================================
// THEME-CONNECTED GUARANTOR INPUT
//
// This style is intentionally applied from GuarantorForm
// instead of changing the shared TextInput component.
//
// Therefore:
// - Other screens remain untouched.
// - Guarantor inputs consume FINORA Theme Engine tokens.
// - Existing TextInput API remains unchanged.
// ============================================================

export const inputStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  height: "38px",

  padding: "8px 11px",

  borderRadius: "8px",

  border:
    `1px solid ${THEME.border}`,

  background:
    THEME.input,

  color: THEME.primary,

  fontSize: "12px",

  fontWeight: 500,

  lineHeight: 1.2,

  outline: "none",

  boxSizing: "border-box",

  transition:
    "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",

  WebkitAppearance: "none",

  MozAppearance: "textfield",
};

// ============================================================
// FULL WIDTH FIELD
//
// Preserved for API compatibility.
// ============================================================

export const fullWidthFieldStyle: CSSProperties = {
  ...fieldStyle,

  gridColumn: "1 / -1",

  width: "100%",
};

// ============================================================
// END
// ============================================================