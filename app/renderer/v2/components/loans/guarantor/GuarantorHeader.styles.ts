// ============================================================
// FINORA ENTERPRISE V2
//
// GUARANTOR STUDIO
// GUARANTOR HEADER STYLES
//
// RESPONSIBILITY:
// - GuarantorHeader presentation only
// - Guarantor-specific header presentation
// - FINORA Enterprise Theme Engine compatibility
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

  border:
    "var(--finora-theme-border-default)",

  primary:
    "var(--finora-theme-brand-primary)",

  primarySoft:
    "var(--finora-theme-brand-accent-soft)",

  text:
    "var(--finora-theme-text-primary)",

  textSecondary:
    "var(--finora-theme-text-secondary)",

  shadow:
    "var(--finora-theme-overlay-shadow)",
} as const;

// ============================================================
// HEADER WRAPPER
//
// Compact Guarantor Studio header.
// Reduced vertical padding and bottom margin so the
// Step 4 content starts closer to the header.
// ============================================================

export const headerStyle: CSSProperties = {
  width: "100%",
  height: "74px",
  minHeight: "74px",
  boxSizing: "border-box",

  padding: "13px 16px",
  marginBottom: "3px",

  border: `1px solid ${THEME.border}`,
  borderRadius: "10px",

  background: `linear-gradient(
    135deg,
    ${THEME.panel},
    ${THEME.panelSoft}
  )`,

  boxShadow: `0 6px 18px ${THEME.shadow}`,
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
  minHeight: "30px",
  flexShrink: 0,
  borderRadius: "4px",
  background: THEME.primary,
  boxShadow: `0 0 12px ${THEME.primarySoft}`,
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
  margin: 0,

  color: THEME.text,
  fontSize: "21px",
  fontWeight: 750,
  lineHeight: 1.2,
  letterSpacing: "0.01em",
};

// ============================================================
// SUBTITLE
// ============================================================

export const subtitleStyle: CSSProperties = {
  margin: 0,

  color: THEME.textSecondary,
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.35,
};

// ============================================================
// END
// ============================================================