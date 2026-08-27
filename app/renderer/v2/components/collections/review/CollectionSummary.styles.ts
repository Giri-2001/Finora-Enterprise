// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION SUMMARY STYLES
//
// RESPONSIBILITY
//
// - Collection summary geometry
// - Summary metric cards
// - Gross amount presentation
// - Discount presentation
// - Final collection emphasis
// - FINORA Theme Engine token consumption
//
// IMPORTANT
//
// - No local theme system
// - No local breakpoint system
// - No responsive logic
// - No business logic
// - No inline responsive dimensions
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
// FINORA THEME TOKENS
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

  brandSoft: "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  // ==========================================================
  // BORDER
  // ==========================================================

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  borderStrong: "var(--finora-theme-border-strong, #B8C0CC)",

  // ==========================================================
  // SUCCESS
  // ==========================================================

  success: "var(--finora-theme-success, var(--success, #23865A))",

  successSoft: "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",

  // ==========================================================
  // DANGER
  // ==========================================================

  danger: "var(--finora-theme-danger, #C24141)",

  dangerSoft: "var(--finora-theme-danger-soft, rgba(194, 65, 65, 0.10))",
} as const;

// ============================================================
// COMMON FONTS
// ============================================================

const INTER_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

const GEORGIA_FONT = "Georgia, 'Times New Roman', serif";

// ============================================================
// EXPORT
// ============================================================

export const collectionSummaryStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // CONTAINER
  // ==========================================================

  container: {
    width: "100%",

    boxSizing: "border-box",

    marginTop: "14px",

    padding: "15px 16px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "16px",

    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.05)",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    width: "100%",

    boxSizing: "border-box",

    paddingBottom: "11px",

    borderBottom: `1px solid ${THEME.border}`,
  },

  // ==========================================================
  // HEADER CONTENT
  // ==========================================================

  headerContent: {
    display: "flex",

    flexDirection: "column",

    gap: "3px",

    minWidth: 0,
  },

  // ==========================================================
  // EYEBROW
  // ==========================================================

  eyebrow: {
    display: "block",

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.12em",

    lineHeight: 1.2,

    textTransform: "uppercase",
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  title: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily: GEORGIA_FONT,

    fontSize: "19px",

    fontWeight: 700,

    lineHeight: 1.2,
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  subtitle: {
    display: "block",

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 500,

    lineHeight: 1.4,
  },

  // ==========================================================
  // METRIC GRID
  // ==========================================================

  metricGrid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

    gap: "10px",

    marginTop: "12px",
  },

  // ==========================================================
  // METRIC CARD
  // ==========================================================

  metric: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    gap: "5px",

    minHeight: "62px",

    padding: "10px 11px",

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

    fontFamily: INTER_FONT,

    fontSize: "9px",

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

    fontFamily: INTER_FONT,

    fontSize: "14px",

    fontWeight: 800,

    lineHeight: 1.2,
  },

  // ==========================================================
  // CALCULATION SECTION
  // ==========================================================

  calculation: {
    width: "100%",

    display: "flex",

    flexDirection: "column",

    gap: 0,

    marginTop: "12px",

    borderTop: `1px solid ${THEME.border}`,

    borderBottom: `1px solid ${THEME.border}`,
  },

  // ==========================================================
  // CALCULATION ROW
  // ==========================================================

  calculationRow: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    minHeight: "38px",

    padding: "7px 4px",

    boxSizing: "border-box",
  },

  // ==========================================================
  // CALCULATION LABEL
  // ==========================================================

  calculationLabel: {
    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 700,
  },

  // ==========================================================
  // CALCULATION VALUE
  // ==========================================================

  calculationValue: {
    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "13px",

    fontWeight: 800,

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // DISCOUNT LABEL
  // ==========================================================

  discountLabel: {
    color: THEME.danger,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 700,
  },

  // ==========================================================
  // DISCOUNT VALUE
  // ==========================================================

  discountValue: {
    color: THEME.danger,

    fontFamily: INTER_FONT,

    fontSize: "13px",

    fontWeight: 800,

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // FINAL CARD
  // ==========================================================

  finalCard: {
    width: "100%",

    display: "flex",

    alignItems: "center",

    justifyContent: "flex-end",

    marginTop: "12px",

    padding: "11px 14px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.success}`,

    borderRadius: "10px",

    background: THEME.successSoft,
  },

  // ==========================================================
  // FINAL CONTENT
  // ==========================================================

  finalContent: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "24px",

    width: "100%",
  },

  // ==========================================================
  // FINAL LABEL
  // ==========================================================

  finalLabel: {
    color: THEME.success,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 800,

    letterSpacing: "0.06em",

    textTransform: "uppercase",
  },

  // ==========================================================
  // FINAL VALUE
  // ==========================================================

  finalValue: {
    color: THEME.success,

    fontFamily: INTER_FONT,

    fontSize: "20px",

    fontWeight: 900,

    lineHeight: 1.15,

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // EMPTY NOTE
  // ==========================================================

  emptyNote: {
    marginTop: "10px",

    padding: "8px 10px",

    boxSizing: "border-box",

    border: `1px dashed ${THEME.borderStrong}`,

    borderRadius: "8px",

    background: THEME.surfaceSoft,

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 500,

    lineHeight: 1.4,
  },

  // ==========================================================
  // ALIAS CONTRACTS
  // ==========================================================

  card: {
    width: "100%",

    boxSizing: "border-box",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "16px",
  },

  grid: {
    width: "100%",

    display: "grid",

    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",

    gap: "10px",
  },

  item: {
    minWidth: 0,

    padding: "10px 11px",

    boxSizing: "border-box",

    background: THEME.surfaceSoft,

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",
  },

  label: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 600,
  },

  value: {
    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "14px",

    fontWeight: 800,
  },

  total: {
    width: "100%",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "20px",

    padding: "11px 14px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.success}`,

    borderRadius: "10px",

    background: THEME.successSoft,
  },

  totalLabel: {
    color: THEME.success,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 800,

    textTransform: "uppercase",
  },

  totalValue: {
    color: THEME.success,

    fontFamily: INTER_FONT,

    fontSize: "20px",

    fontWeight: 900,

    whiteSpace: "nowrap",
  },
};

// ============================================================
// END
// ============================================================
