// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// SELECTED LOAN PREVIEW STYLES
//
// RESPONSIBILITY
//
// - Selected loan preview geometry
// - Selected loan header
// - Loan status presentation
// - Financial metric cards
// - FINORA Theme Engine CSS-variable consumption
//
// IMPORTANT
//
// - No local theme system
// - No local breakpoint system
// - No responsive logic
// - No business logic
// - No second colour palette
// - Theme values come from FINORA Theme Engine variables
// - Responsive geometry belongs to Responsive Engine
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME VARIABLES
//
// ThemeProvider
//      ↓
// FINORA Theme Engine
//      ↓
// Global FINORA CSS Variables
//      ↓
// Selected Loan Styles
//
// This file consumes the central theme contract.
// It does NOT create another theme system.
// ============================================================

const THEME = {
  // ==========================================================
  // SURFACES
  // ==========================================================

  surface: "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  surfaceStrong: "var(--finora-theme-surface-strong, #E7EAF0)",

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

  brandAccent:
    "var(--finora-theme-brand-accent, var(--finora-accent, #C69214))",

  brandSoft: "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  // ==========================================================
  // BORDER
  // ==========================================================

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  borderStrong: "var(--finora-theme-border-strong, #B8C0CC)",

  // ==========================================================
  // STATUS
  // ==========================================================

  success: "var(--finora-theme-success, var(--success, #23865A))",

  successSoft: "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",
} as const;

// ============================================================
// PRIMARY STYLE CONTRACT
// ============================================================

export const collectionSelectedLoanStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // SELECTED LOAN CARD
  // ==========================================================

  selectedLoanCard: {
    width: "100%",

    marginTop: "12px",

    padding: "15px 18px",

    boxSizing: "border-box",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "16px",

    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.06)",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  selectedLoanHeader: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    paddingBottom: "12px",

    borderBottom: `1px solid ${THEME.border}`,
  },

  // ==========================================================
  // EYEBROW
  // ==========================================================

  selectedLoanEyebrow: {
    display: "block",

    color: THEME.brandAccent,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.12em",

    textTransform: "uppercase",
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  selectedLoanTitle: {
    margin: "4px 0 0",

    color: THEME.textPrimary,

    fontFamily: "Georgia, 'Times New Roman', serif",

    fontSize: "21px",

    fontWeight: 700,

    lineHeight: 1.2,
  },

  // ==========================================================
  // STATUS
  // ==========================================================

  selectedLoanStatus: {
    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "6px 11px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.success}`,

    borderRadius: "999px",

    background: THEME.successSoft,

    color: THEME.success,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.06em",

    textTransform: "uppercase",

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // METRIC GRID
  // ==========================================================

  selectedLoanGrid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    gap: "10px",

    marginTop: "12px",
  },

  // ==========================================================
  // METRIC CARD
  // ==========================================================

  selectedLoanMetric: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "5px",

    padding: "10px 12px",

    boxSizing: "border-box",

    background: THEME.surfaceSoft,

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",
  },

  // ==========================================================
  // METRIC LABEL
  // ==========================================================

  metricLabel: {
    minWidth: 0,

    color: THEME.textMuted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "10px",

    fontWeight: 600,

    lineHeight: 1.25,
  },

  // ==========================================================
  // METRIC VALUE
  // ==========================================================

  metricValue: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "14px",

    fontWeight: 800,

    lineHeight: 1.25,
  },

  // ==========================================================
  // COMPATIBILITY ALIASES
  //
  // These aliases are presentation-only contracts.
  // They do not introduce another styling system.
  // ==========================================================

  card: {
    width: "100%",

    boxSizing: "border-box",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "16px",
  },

  header: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    paddingBottom: "12px",

    borderBottom: `1px solid ${THEME.border}`,
  },

  eyebrow: {
    display: "block",

    color: THEME.brandAccent,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.12em",

    textTransform: "uppercase",
  },

  title: {
    margin: "4px 0 0",

    color: THEME.textPrimary,

    fontFamily: "Georgia, 'Times New Roman', serif",

    fontSize: "21px",

    fontWeight: 700,
  },

  status: {
    flexShrink: 0,

    padding: "6px 11px",

    border: `1px solid ${THEME.success}`,

    borderRadius: "999px",

    background: THEME.successSoft,

    color: THEME.success,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.06em",

    textTransform: "uppercase",
  },

  grid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",

    gap: "10px",

    marginTop: "12px",
  },

  metric: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "5px",

    padding: "10px 12px",

    boxSizing: "border-box",

    background: THEME.surfaceSoft,

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",
  },

  label: {
    color: THEME.textMuted,

    fontSize: "10px",

    fontWeight: 600,
  },

  value: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontSize: "14px",

    fontWeight: 800,
  },
};

// ============================================================
// END
// ============================================================
