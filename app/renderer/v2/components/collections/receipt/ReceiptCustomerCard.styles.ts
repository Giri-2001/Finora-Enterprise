// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS ENGINE
//
// RECEIPT CUSTOMER CARD STYLES
//
// RESPONSIBILITY
//
// - Customer information layout
// - Receipt customer detail spacing
// - Label / value presentation
// - FINORA Theme Engine token consumption
// - Keep visual styling outside JSX
//
// IMPORTANT
//
// - No local theme system
// - No local breakpoint system
// - No responsive logic
// - No inline responsive dimensions
// - No business logic
// - No second colour palette
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// THEME TOKENS
// ============================================================

const THEME = {
  textPrimary:
    "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary:
    "var(--finora-theme-text-secondary, #475569)",

  textMuted:
    "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  border:
    "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  brand:
    "var(--finora-theme-brand-primary, var(--accent, #C69214))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",
} as const;

// ============================================================
// EXPORT
// ============================================================

export const receiptCustomerCardStyles: Record<
  string,
  CSSProperties
> = {
  // ==========================================================
  // CONTENT
  // ==========================================================

  content: {
    width: "100%",

    display: "flex",

    flexDirection: "column",

    gap: "12px",

    boxSizing: "border-box",

    color: THEME.textPrimary,
  },

  // ==========================================================
  // DETAIL ROW
  // ==========================================================

  detail: {
    width: "100%",

    minWidth: 0,

    display: "flex",

    alignItems: "baseline",

    gap: "6px",

    boxSizing: "border-box",

    color: THEME.textSecondary,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    fontSize: "13px",

    lineHeight: 1.45,
  },

  // ==========================================================
  // LABEL
  // ==========================================================

  label: {
    flexShrink: 0,

    color: THEME.textMuted,

    fontWeight: 600,
  },

  // ==========================================================
  // VALUE
  // ==========================================================

  value: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontWeight: 700,
  },

  // ==========================================================
  // EMPHASIZED VALUE
  // ==========================================================

  highlightedValue: {
    color: THEME.brand,

    fontWeight: 800,
  },

  // ==========================================================
  // SOFT VALUE CONTAINER
  // ==========================================================

  valueSurface: {
    minWidth: 0,

    padding: "3px 7px",

    boxSizing: "border-box",

    background: THEME.surfaceSoft,

    border: `1px solid ${THEME.border}`,

    borderRadius: "6px",

    color: THEME.textPrimary,

    fontWeight: 700,
  },
};

// ============================================================
// END
// ============================================================