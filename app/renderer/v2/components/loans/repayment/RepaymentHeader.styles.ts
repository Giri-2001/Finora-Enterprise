// ============================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO
// REPAYMENT HEADER STYLES
//
// RESPONSIBILITY:
// - RepaymentHeader presentation only
// - Repayment-specific header presentation
// - FINORA Theme Engine connected
//
// IMPORTANT:
// - No business logic.
// - No calculations.
// - No persistence.
// - Layout / dimensions unchanged.
//
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// THEME TOKENS
// ============================================================

const THEME = {
  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.20))",

  primary:
    "var(--finora-theme-brand-primary, #2563EB)",

  primarySoft:
    "var(--finora-theme-brand-accent-soft, rgba(37, 99, 235, 0.14))",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.16))",
};

// ============================================================
// HEADER WRAPPER
// ============================================================

export const headerStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "13px 16px",
  marginBottom: "10px",
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
  minHeight: "38px",
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