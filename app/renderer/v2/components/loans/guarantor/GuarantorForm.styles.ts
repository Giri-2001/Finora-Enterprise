// ============================================================
// FINORA ENTERPRISE V2
//
// GUARANTOR STUDIO
// GUARANTOR FORM STYLES
//
// RESPONSIBILITY:
// - GuarantorForm presentation only
// - Responsive guarantor information layout
// - FINORA Enterprise Theme Engine compatibility
// - Theme-connected guarantor inputs
// - No business logic
// - No viewport detection
// - No window.innerWidth
//
// RESPONSIVE LAYOUT:
// - Mobile  < 768px   → 1 field per row
// - Tablet  768-1199  → 2 fields per row
// - Laptop  >= 1200px → 4 fields per row
//
// IMPORTANT:
// React inline style objects cannot process @media rules.
// Therefore responsive grid rules are provided through
// `responsiveGridCss` and attached as a real <style> block
// by GuarantorForm.
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

  textSecondary:
    "var(--finora-theme-text-secondary)",
} as const;

// ============================================================
// RESPONSIVE WRAPPER CLASS
// ============================================================

export const wrapperClassName =
  "finora-guarantor-form-responsive";

// ============================================================
// RESPONSIVE GRID CSS
//
// REAL CSS MEDIA QUERIES.
//
// Mobile:
//   1 column
//
// Tablet:
//   2 columns
//
// Laptop/Desktop:
//   4 columns
//
// This is presentation-only CSS.
// No JavaScript viewport detection is used.
// ============================================================

export const responsiveGridCss = `
  .${wrapperClassName} {
    grid-template-columns: minmax(0, 1fr);
  }

  @media (min-width: 768px) {
    .${wrapperClassName} {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1200px) {
    .${wrapperClassName} {
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
    }
  }
`;

// ============================================================
// WRAPPER
//
// Base layout is mobile-first.
//
// The responsive column count is supplied by
// responsiveGridCss above.
//
// ============================================================

export const wrapperStyle: CSSProperties = {
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
display: "grid",

  width: "100%",

  minWidth: 0,

  marginBottom: "10px",

  boxSizing: "border-box",

  padding: "8px 10px 4px 10px",

  columnGap: "9px",

  rowGap: "0px",

  border:
    `1px solid ${THEME.border}`,

  borderRadius: "9px",

  background:
    `linear-gradient(
      180deg,
      ${THEME.panel},
      ${THEME.panelSoft}
    )`,

  boxShadow: "none",

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
// ============================================================

export const inputStyle: CSSProperties = {
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
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

  fontWeight: 700,

  lineHeight: 1.2,

  outline: "none",

  boxSizing: "border-box",

  transition:
    "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",

  WebkitAppearance: "none",

  MozAppearance: "textfield",
  textTransform: "capitalize",
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
