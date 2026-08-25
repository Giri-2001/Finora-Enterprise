// ============================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO
// REPAYMENT SUMMARY STYLES
//
// RESPONSIBILITY:
// - RepaymentSummary presentation only
// - Compact repayment totals presentation
// - FINORA Theme Engine connected
//
// IMPORTANT:
// - No business logic.
// - No calculations.
// - No persistence.
// - Layout / dimensions unchanged.
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// THEME TOKENS
// ============================================================

const THEME = {
  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.20))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.38))",

  primarySoft:
    "var(--finora-theme-brand-accent-soft, rgba(37, 99, 235, 0.14))",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",
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
// SUMMARY GRID
// ============================================================

export const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px 8px",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

// ============================================================
// SUMMARY ROW
// ============================================================

export const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  minHeight: "50px",
  padding: "7px 9px",
  boxSizing: "border-box",
  border: `1px solid ${THEME.border}`,
  borderRadius: "7px",
  background: THEME.panel,
};

// ============================================================
// LABEL
// ============================================================

export const labelStyle: CSSProperties = {
  color: THEME.textMuted,
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.2,
};

// ============================================================
// VALUE
// ============================================================

export const valueStyle: CSSProperties = {
  minWidth: 0,
  color: THEME.text,
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

// ============================================================
// HIGHLIGHT ROW
// ============================================================

export const highlightRowStyle: CSSProperties = {
  ...rowStyle,
  borderColor: THEME.borderStrong,
  background:
    THEME.panel,
};

// ============================================================
// END
// ============================================================