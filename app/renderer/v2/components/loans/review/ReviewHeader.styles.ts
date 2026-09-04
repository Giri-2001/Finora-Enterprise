// ============================================================
// FINORA ENTERPRISE OS™
//
// REVIEW STUDIO™
// REVIEW HEADER STYLES
//
// RESPONSIBILITY:
// - ReviewHeader presentation only
// - FINORA Theme Engine integration
// - Preserve existing header geometry
// - Preserve existing typography
// - No local theme palette
// - No hardcoded theme colours
//
// THEME FLOW:
//
// ThemeProvider
//      ↓
// FINORA Theme Engine
//      ↓
// Theme CSS Variables
//      ↓
// ReviewHeader styles
//      ↓
// Active FINORA Theme
//
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {
  /* ---------------------------------------------------------
     SURFACES
  --------------------------------------------------------- */

  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  /* ---------------------------------------------------------
     BRAND
  --------------------------------------------------------- */

  brandPrimary: "var(--finora-theme-brand-primary, #2563EB)",

  brandAccent:
    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #2563EB))",

  brandAccentSoft: "var(--finora-theme-brand-accent-soft, rgba(37,99,235,.14))",

  /* ---------------------------------------------------------
     TEXT
  --------------------------------------------------------- */

  textPrimary: "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary: "var(--finora-theme-text-secondary, #CBD5E1)",

  /* ---------------------------------------------------------
     BORDERS
  --------------------------------------------------------- */

  border: "var(--finora-theme-border-default, rgba(148,163,184,.20))",

  /* ---------------------------------------------------------
     SHADOW
  --------------------------------------------------------- */

  shadow: "var(--finora-theme-overlay-shadow, rgba(0,0,0,.16))",
} as const;

// ============================================================
// HEADER WRAPPER
// ============================================================

export const headerStyle: CSSProperties = {
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding: "13px 16px",

  marginBottom: "0px",

  border: `1px solid ${THEME.border}`,

  borderRadius: "10px",

  background: `linear-gradient(
      135deg,
      ${THEME.surface},
      ${THEME.surfaceMuted}
    )`,

  boxShadow: "none",
};

// ============================================================
// HEADER CONTENT
// ============================================================

export const contentStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "10px",

  minWidth: 0,
};

// ============================================================
// ACCENT
// ============================================================

export const accentStyle: CSSProperties = {
  width: "4px",

  minHeight: "38px",

  flexShrink: 0,

  borderRadius: "4px",

  background: THEME.brandAccent,

  boxShadow: "none",
};

// ============================================================
// TEXT WRAPPER
// ============================================================

export const textWrapperStyle: CSSProperties = {
  display: "flex",

  flexDirection: "column",

  gap: "3px",

  minWidth: 0,
};

// ============================================================
// TITLE
// ============================================================

export const titleStyle: CSSProperties = {
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  margin: 0,

  color: THEME.textPrimary,

  fontSize: "22px",

  fontWeight: 750,

  lineHeight: 1.3,

  letterSpacing: "0.01em",
};

// ============================================================
// SUBTITLE
// ============================================================

export const subtitleStyle: CSSProperties = {
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  margin: 0,

  color: THEME.textSecondary,

  fontSize: "14px",

  fontWeight: 500,

  lineHeight: 1.45,
};

// ============================================================
// END
// ============================================================
