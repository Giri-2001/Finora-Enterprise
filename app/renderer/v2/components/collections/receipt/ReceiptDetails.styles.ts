// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTIONS ENGINE
//
// RECEIPT DETAILS STYLES
//
// RESPONSIBILITY
//
// - Receipt details layout geometry
// - Field-group spacing
// - Consume FINORA Theme Engine variables
// - Keep component styling outside JSX
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
//
// ThemeProvider
//      ↓
// FINORA Theme Engine
//      ↓
// Global Theme CSS Variables
//      ↓
// Receipt Details Styles
// ============================================================

const THEME = {
  surface: "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  textPrimary:
    "var(--finora-theme-text-primary, var(--text, #111827))",

  textMuted:
    "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  border:
    "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  brand:
    "var(--finora-theme-brand-primary, var(--accent, #C69214))",
} as const;

// ============================================================
// EXPORT
// ============================================================

export const receiptDetailsStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // WRAPPER
  // ==========================================================

  wrapper: {
    width: "100%",

    display: "flex",

    flexDirection: "column",

    gap: "20px",

    boxSizing: "border-box",

    color: THEME.textPrimary,
  },

  // ==========================================================
  // FIELD GROUP
  //
  // Reserved for future field-level presentation without
  // introducing styling directly inside the component.
  // ==========================================================

  fieldGroup: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",
  },

  // ==========================================================
  // SECTION
  //
  // Shared surface contract for Receipt Details containers.
  // ==========================================================

  section: {
    width: "100%",

    boxSizing: "border-box",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "12px",

    padding: "16px",

    color: THEME.textPrimary,
  },

  // ==========================================================
  // SECTION TITLE
  // ==========================================================

  sectionTitle: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily:
      "Georgia, 'Times New Roman', serif",

    fontSize: "17px",

    fontWeight: 700,

    lineHeight: 1.25,
  },

  // ==========================================================
  // SECTION SUBTITLE
  // ==========================================================

  sectionSubtitle: {
    margin: "5px 0 0",

    color: THEME.textMuted,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

    fontSize: "12px",

    fontWeight: 500,

    lineHeight: 1.45,
  },

  // ==========================================================
  // ACCENT CONTRACT
  // ==========================================================

  accent: {
    color: THEME.brand,

    fontWeight: 700,
  },
};

// ============================================================
// END
// ============================================================