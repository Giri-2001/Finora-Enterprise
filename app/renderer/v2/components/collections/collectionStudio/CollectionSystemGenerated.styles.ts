// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// SYSTEM GENERATED PANEL STYLES
//
// RESPONSIBILITY
//
// - System generated collection panel geometry
// - Auto calculated financial values presentation
// - Locked financial information presentation
// - Generated total presentation
// - Information notice presentation
//
// IMPORTANT
//
// - No local theme system
// - No local breakpoint system
// - No responsive logic
// - No business logic
// - No inline colour palette
// - Theme values consume FINORA Theme CSS variables
// - Responsive geometry belongs to Responsive Engine
// - Warning / brand colours come from FINORA Theme Engine
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
//
// ThemeProvider is the single source of truth.
//
// IMPORTANT:
// There is intentionally NO local yellow / gold palette here.
//
// Brand / warning colours are consumed from the active FINORA
// theme through CSS variables exposed by Collection Studio.
//
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

  brand: "var(--finora-theme-brand-primary)",

brandSoft: "var(--finora-theme-brand-accent-soft)",

  // ==========================================================
  // BORDER
  // ==========================================================

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  borderStrong: "var(--finora-theme-border-strong, #B8C0CC)",

  // ==========================================================
  // WARNING
  //
  // IMPORTANT:
  //
  // These values are controlled by the active FINORA theme.
  // No local yellow / gold colour is defined here.
  // ==========================================================



} as const;

// ============================================================
// EXPORT
// ============================================================

export const collectionSystemGeneratedStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // PANEL
  // ==========================================================

  panel: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    padding: "18px",

    // IMPORTANT:
    // Do not use a local warm / yellow surface.
    // The panel follows the active FINORA theme surface.
    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "12px",

    boxShadow:
      "0 2px 12px var(--finora-theme-overlay-shadow, rgba(15, 23, 42, 0.04))",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "12px",

    paddingBottom: "14px",

    borderBottom: `1px solid ${THEME.border}`,
  },

  // ==========================================================
  // TITLE GROUP
  // ==========================================================

  titleGroup: {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    gap: "8px",
  },

  // ==========================================================
  // LOCK
  // ==========================================================

  lock: {
    flexShrink: 0,

    color: THEME.brand,

    fontSize: "14px",

    lineHeight: 1,
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

    letterSpacing: "0.03em",

    textTransform: "uppercase",

    lineHeight: 1.25,
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  subtitle: {
    marginTop: "3px",

    color: THEME.textMuted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "10px",

    fontWeight: 500,

    lineHeight: 1.4,
  },

  // ==========================================================
  // FINANCIAL LIST
  // ==========================================================

  financialList: {
    width: "100%",

    display: "flex",

    flexDirection: "column",

    gap: "0",

    marginTop: "14px",
  },

  // ==========================================================
  // FINANCIAL ROW
  // ==========================================================

  financialRow: {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    padding: "11px 0",

    borderBottom: `1px solid ${THEME.border}`,
  },

  // ==========================================================
  // LABEL
  // ==========================================================

  financialLabel: {
    minWidth: 0,

    color: THEME.textSecondary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "11px",

    fontWeight: 600,

    lineHeight: 1.3,
  },

  // ==========================================================
  // VALUE
  // ==========================================================

  financialValue: {
    flexShrink: 0,

    color: THEME.textPrimary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "12px",

    fontWeight: 800,

    lineHeight: 1.3,

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // TOTAL DIVIDER
  // ==========================================================

  totalDivider: {
    width: "100%",

    height: "1px",

    margin: "4px 0 0",

    background: THEME.borderStrong,
  },

  // ==========================================================
  // GENERATED TOTAL ROW
  // ==========================================================

  generatedTotal: {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    paddingTop: "14px",
  },

  // ==========================================================
  // GENERATED TOTAL LABEL
  // ==========================================================

  generatedTotalLabel: {
    color: THEME.textPrimary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "11px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    textTransform: "uppercase",

    lineHeight: 1.3,
  },

  // ==========================================================
  // GENERATED TOTAL VALUE
  // ==========================================================

  generatedTotalValue: {
    flexShrink: 0,

    color: THEME.textPrimary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "20px",

    fontWeight: 800,

    lineHeight: 1.15,

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // NOTICE
  //
  // WARNING COLOUR IS FULLY THEME CONNECTED.
  //
  // This notice is intentionally a semantic WARNING surface,
  // not a locally defined yellow/gold surface.
  // ==========================================================

  notice: {
    width: "100%",

    display: "flex",

    alignItems: "flex-start",

    gap: "9px",

    marginTop: "16px",

    padding: "11px 12px",

    boxSizing: "border-box",



border: `1px solid ${THEME.brand}`,

    borderRadius: "8px",
  },

  // ==========================================================
  // NOTICE ICON
  // ==========================================================

  noticeIcon: {
    flexShrink: 0,

    color: THEME.brand,

    fontSize: "13px",

    fontWeight: 800,

    lineHeight: 1.3,
  },

  // ==========================================================
  // NOTICE CONTENT
  // ==========================================================

  noticeContent: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "2px",
  },

  // ==========================================================
  // NOTICE TITLE
  // ==========================================================

  noticeTitle: {
    color: THEME.brand,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "12px",

    fontWeight: 600,

    lineHeight: 1.3,
  },

  // ==========================================================
  // NOTICE MESSAGE
  // ==========================================================

  noticeMessage: {
    color: THEME.textMuted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "10px",

    fontWeight: 500,

    lineHeight: 1.45,
  },

  // ==========================================================
  // ALIAS CONTRACTS
  //
  // Supports the compact naming contract used by the
  // presentation component without creating another style
  // system.
  // ==========================================================

  card: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    padding: "18px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "12px",
  },

  row: {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    padding: "11px 0",

    borderBottom: `1px solid ${THEME.border}`,
  },

  label: {
    minWidth: 0,

    color: THEME.textSecondary,

    fontSize: "11px",

    fontWeight: 600,
  },

  value: {
    flexShrink: 0,

    color: THEME.textPrimary,

    fontSize: "12px",

    fontWeight: 800,

    whiteSpace: "nowrap",
  },

  total: {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "16px",

    paddingTop: "14px",
  },

  totalLabel: {
    color: THEME.textPrimary,

    fontSize: "11px",

    fontWeight: 800,

    letterSpacing: "0.04em",

    textTransform: "uppercase",
  },

  totalValue: {
    flexShrink: 0,

    color: THEME.textPrimary,

    fontSize: "20px",

    fontWeight: 800,

    whiteSpace: "nowrap",
  },
};

// ============================================================
// END
// ============================================================
