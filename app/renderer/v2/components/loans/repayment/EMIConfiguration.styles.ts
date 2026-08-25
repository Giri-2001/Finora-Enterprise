// ===========================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO — EMI CONFIGURATION STYLES
//
// RESPONSIBILITY:
// - EMIConfiguration presentation only
// - Existing layout geometry preserved
// - FINORA Theme Engine CSS variables only
//
// IMPORTANT:
// - No local purple / green / brown / gold palette
// - No responsive logic
// - No business logic
// - Form controls inherit FINORA theme
// ===========================================================

import type { CSSProperties } from "react";

// ===========================================================
// FINORA THEME TOKENS
// ===========================================================

const THEME = {
  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  surfaceStrong:
    "var(--finora-theme-surface-strong, #0D192D)",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.16))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.42))",

  primary:
    "var(--finora-theme-brand-primary, #2563EB)",

  primarySoft:
    "var(--finora-theme-brand-accent-soft, rgba(37, 99, 235, 0.14))",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.14))",
};

// ===========================================================
// WRAPPER
// ===========================================================

export const wrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",

  padding: "10px",

  border: `1px solid ${THEME.border}`,
  borderRadius: "9px",

  background: `linear-gradient(
    180deg,
    ${THEME.surface},
    ${THEME.surfaceMuted}
  )`,

  boxShadow: `0 4px 12px ${THEME.shadow}`,

  color: THEME.text,
};

// ===========================================================
// HEADER
// ===========================================================

export const headerStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  display: "flex",
  alignItems: "center",

  gap: "7px",

  marginBottom: "7px",

  boxSizing: "border-box",

  color: THEME.text,

  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.25,
};

// ===========================================================
// PRIMARY ACCENT
// ===========================================================

export const accentStyle: CSSProperties = {
  width: "3px",
  minWidth: "3px",
  height: "17px",

  flexShrink: 0,

  borderRadius: "999px",

  background: THEME.primary,

  boxShadow: `0 0 8px ${THEME.primarySoft}`,
};

// ===========================================================
// CONTENT
// ===========================================================

export const contentStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  display: "grid",

  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",

  gap: "8px",

  boxSizing: "border-box",

  alignItems: "start",
};

// ===========================================================
// FIELD
// ===========================================================

export const fieldStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",

  padding: "7px 8px",

  border: `1px solid ${THEME.border}`,
  borderRadius: "7px",

  background: THEME.surfaceMuted,

  color: THEME.text,
};

// ===========================================================
// FIELD CONTENT
// ===========================================================

export const fieldContentStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",

  gap: "4px",

  color: THEME.text,
};

// ===========================================================
// END
// ===========================================================