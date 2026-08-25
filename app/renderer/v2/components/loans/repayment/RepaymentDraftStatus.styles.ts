// ============================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO
// REPAYMENT DRAFT STATUS STYLES
//
// RESPONSIBILITY:
// - RepaymentDraftStatus presentation wrapper only
// - Repayment-specific spacing and layout
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
  background:
    "var(--finora-theme-background, var(--finora-theme-background-base, #0F172A))",

  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.20))",

  primarySoft:
    "var(--finora-theme-brand-accent-soft, rgba(37, 99, 235, 0.12))",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.12))",
};

// ============================================================
// CARD WRAPPER
// ============================================================

export const cardStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

// ============================================================
// STATUS WRAPPER
// ============================================================

export const statusStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "1px",
  border: `1px solid ${THEME.border}`,
  borderRadius: "8px",
  background:
    THEME.panel,
};

// ============================================================
// END
// ============================================================