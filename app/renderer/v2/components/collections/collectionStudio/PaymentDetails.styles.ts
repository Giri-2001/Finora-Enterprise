/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTION STUDIO™

   PAYMENT DETAILS STYLES

   RESPONSIBILITY

   - Payment details geometry
   - Section header
   - Payment form grid
   - FINORA Theme Engine token consumption

   IMPORTANT

   - No local theme system
   - No local breakpoint system
   - No responsive logic
   - No business logic
   - No second colour palette
   - Responsive geometry remains controlled by the
     FINORA Responsive Engine
=========================================================== */

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {
  // ==========================================================
  // SURFACES
  // ==========================================================

  surface: "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  // ==========================================================
  // TEXT
  // ==========================================================

  textPrimary: "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary: "var(--finora-theme-text-secondary, #475569)",

  textMuted: "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  // ==========================================================
  // BRAND
  // ==========================================================

  brand: "var(--finora-theme-brand-primary, var(--accent, #C69214))",

  brandSoft: "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  // ==========================================================
  // BORDER
  // ==========================================================

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  borderStrong: "var(--finora-theme-border-strong, #B8C0CC)",
} as const;

// ============================================================
// PUBLIC STYLES
// ============================================================

export const paymentDetailsStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // SECTION
  // ==========================================================

  section: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    gap: "16px",

    padding: "16px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "14px",

    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    width: "100%",

    boxSizing: "border-box",

    paddingBottom: "12px",

    borderBottom: `1px solid ${THEME.border}`,
  },

  // ==========================================================
  // HEADER CONTENT
  // ==========================================================

  headerContent: {
    display: "flex",

    alignItems: "center",

    gap: "10px",

    minWidth: 0,
  },

  // ==========================================================
  // STEP NUMBER
  // ==========================================================

  step: {
    flexShrink: 0,

    width: "24px",

    height: "24px",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    boxSizing: "border-box",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "7px",

    background: THEME.brandSoft,

    color: THEME.brand,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "11px",

    fontWeight: 800,
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  title: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "12px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    lineHeight: 1.3,
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  subtitle: {
    margin: "3px 0 0",

    color: THEME.textMuted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "10px",

    fontWeight: 500,

    lineHeight: 1.35,
  },

  // ==========================================================
  // FORM
  // ==========================================================

  form: {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

    gap: "12px",

    alignItems: "start",

    boxSizing: "border-box",
  },

  // ==========================================================
  // FIELD
  // ==========================================================

  field: {
    minWidth: 0,

    width: "100%",

    boxSizing: "border-box",
  },

  // ==========================================================
  // FULL-WIDTH FIELD CONTRACT
  //
  // Kept available for responsive/layout integration.
  // ==========================================================

  fieldFull: {
    minWidth: 0,

    width: "100%",

    gridColumn: "1 / -1",

    boxSizing: "border-box",
  },

  // ==========================================================
  // OPTIONAL COMPACT FIELD CONTRACT
  // ==========================================================

  fieldCompact: {
    minWidth: 0,

    width: "100%",

    maxWidth: "100%",

    boxSizing: "border-box",
  },

  // ==========================================================
  // FORM DIVIDER
  // ==========================================================

  divider: {
    width: "100%",

    height: "1px",

    margin: "2px 0",

    background: THEME.borderStrong,

    opacity: 0.55,
  },

  // ==========================================================
  // FOOTNOTE
  // ==========================================================

  helperText: {
    margin: "5px 0 0",

    color: THEME.textMuted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "9px",

    lineHeight: 1.35,
  },
};

// ============================================================
// END
// ============================================================
