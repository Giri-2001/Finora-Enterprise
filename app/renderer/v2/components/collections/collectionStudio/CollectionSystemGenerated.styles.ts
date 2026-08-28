// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// SYSTEM GENERATED PANEL STYLES
//
// RESPONSIBILITY
//
// - Premium middle System Generated card
// - Compact auto-calculated financial presentation
// - Generated Total emphasis
// - Locked information presentation
// - FINORA Theme Engine token consumption
//
// IMPORTANT
//
// - Presentation only
// - No business logic
// - No persistence logic
// - No local theme engine
// - No local breakpoint engine
// - No hardcoded application palette
// - All text / numbers use FINORA Inter contract
//
// VERSION : 2.1
// STATUS  : Production
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {
  surface: "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  surfaceStrong:
    "var(--finora-theme-surface-strong, var(--finora-theme-surface-muted, #EEF2F7))",

  textPrimary: "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary: "var(--finora-theme-text-secondary, #475569)",

  textMuted: "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  brand: "var(--finora-theme-brand-primary, var(--accent, #C69214))",

  brandSoft: "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  borderStrong: "var(--finora-theme-border-strong, #B8C0CC)",

  shadow: "var(--finora-theme-overlay-shadow, rgba(15, 23, 42, 0.08))",
} as const;

// ============================================================
// FONT CONTRACT
// ============================================================

const INTER_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

// ============================================================
// EXPORT
// ============================================================

export const collectionSystemGeneratedStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // PANEL
  //
  // Designed specifically for the middle 20% workspace card.
  // Parent layout controls final equal-height behaviour.
  // ==========================================================

  panel: {
    width: "100%",

    minWidth: 0,

    height: "100%",

    minHeight: "100%",

    display: "flex",

    flexDirection: "column",

    boxSizing: "border-box",

    padding: "15px 14px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "14px",

    boxShadow: `0 4px 18px ${THEME.shadow}`,

    overflow: "hidden",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    width: "100%",

    minWidth: 0,

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "8px",

    boxSizing: "border-box",

    paddingBottom: "11px",

    borderBottom: `1px solid ${THEME.border}`,
  },

  // ==========================================================
  // TITLE GROUP
  // ==========================================================

  titleGroup: {
    minWidth: 0,

    width: "100%",

    display: "flex",

    alignItems: "flex-start",

    gap: "8px",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // LOCK ICON
  // ==========================================================

  lock: {
    flexShrink: 0,

    width: "22px",

    height: "22px",

    marginTop: "1px",

    color: THEME.brand,
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  title: {
    marginTop: "5px",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "12px",

    fontWeight: 800,

    letterSpacing: "0.035em",

    lineHeight: 1.3,

    textTransform: "uppercase",
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  subtitle: {
    marginTop: "3px",

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 500,

    lineHeight: 1.4,
  },

  // ==========================================================
  // FINANCIAL LIST
  // ==========================================================

financialList: {
  width: "100%",

  minWidth: 0,

  display: "grid",

  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

  gap: "7px",

  marginTop: "9px",

  boxSizing: "border-box",

  fontFamily: INTER_FONT,
},

  // ==========================================================
  // FINANCIAL ROW
  // ==========================================================

 financialRow: {
  minWidth: 0,

  minHeight: "54px",

  display: "flex",

  flexDirection: "column",

  alignItems: "flex-start",

  justifyContent: "center",

  gap: "4px",

  boxSizing: "border-box",

  padding: "8px 9px",

  background: THEME.surfaceSoft,

  border: `1px solid ${THEME.border}`,

  borderRadius: "8px",

  fontFamily: INTER_FONT,
},

  // ==========================================================
  // FINANCIAL LABEL
  // ==========================================================

 financialLabel: {
  width: "100%",

  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color: THEME.textMuted,

  fontFamily: INTER_FONT,

  fontSize: "11px",

  fontWeight: 750,

  lineHeight: 1.2,
},

  // ==========================================================
  // FINANCIAL VALUE
  // ==========================================================

financialValue: {
  width: "100%",

  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color: THEME.textPrimary,

  fontFamily: INTER_FONT,

  fontSize: "13px",

  fontWeight: 750,

  lineHeight: 1.15,

  letterSpacing: "-0.01em",
},

  // ==========================================================
  // TOTAL DIVIDER
  // ==========================================================

 totalDivider: {
  display: "none",
},

  // ==========================================================
  // GENERATED TOTAL
  // ==========================================================

  generatedTotal: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "4px",

    marginTop: "8px",

    padding: "10px",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "9px",

    background: THEME.brandSoft,

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // GENERATED TOTAL LABEL
  // ==========================================================

  generatedTotalLabel: {
    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 750,

    lineHeight: 1.2,

    letterSpacing: "0.055em",

    textTransform: "uppercase",

    textAlign: "center",
  },

  // ==========================================================
  // GENERATED TOTAL VALUE
  // ==========================================================

  generatedTotalValue: {
    width: "100%",

    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "16px",

    fontWeight: 750,

    lineHeight: 1.1,

    letterSpacing: "-0.025em",

    textAlign: "center",
  },

  // ==========================================================
  // LOCKED NOTICE
  // ==========================================================

  notice: {
    width: "100%",

    minWidth: 0,

    display: "flex",

    alignItems: "flex-start",

    gap: "7px",

    boxSizing: "border-box",

    marginTop: "auto",

    padding: "9px",

    border: `1px solid ${THEME.borderStrong}`,

    borderRadius: "9px",

    background: THEME.surfaceSoft,

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // NOTICE ICON
  // ==========================================================

  noticeIcon: {
    width: "13px",

    height: "13px",

    flexShrink: 0,

    marginTop: "1px",

    color: THEME.brand,
  },

  // ==========================================================
  // NOTICE CONTENT
  // ==========================================================

  noticeContent: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "2px",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // NOTICE TITLE
  // ==========================================================

  noticeTitle: {
    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 800,

    lineHeight: 1.3,
  },

  // ==========================================================
  // NOTICE MESSAGE
  // ==========================================================

  noticeMessage: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "7px",

    fontWeight: 500,

    lineHeight: 1.4,
  },

  // ==========================================================
  // ALIAS CONTRACTS
  // ==========================================================

  card: {
    width: "100%",

    minWidth: 0,

    height: "100%",

    boxSizing: "border-box",

    padding: "15px 14px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "14px",

    boxShadow: `0 4px 18px ${THEME.shadow}`,

    fontFamily: INTER_FONT,
  },

  row: {
    width: "100%",

    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    alignItems: "flex-start",

    gap: "3px",

    boxSizing: "border-box",

    padding: "8px 0",

    borderBottom: `1px solid ${THEME.border}`,

    fontFamily: INTER_FONT,
  },

  label: {
    minWidth: 0,

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 700,

    lineHeight: 1.2,
  },

  value: {
    minWidth: 0,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "12px",

    fontWeight: 800,

    whiteSpace: "nowrap",
  },

  total: {
    width: "100%",

    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    alignItems: "flex-start",

    gap: "4px",

    boxSizing: "border-box",

    marginTop: "10px",

    padding: "10px",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "9px",

    background: THEME.brandSoft,

    fontFamily: INTER_FONT,
  },

  totalLabel: {
    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 850,

    letterSpacing: "0.055em",

    textTransform: "uppercase",
  },

  totalValue: {
    minWidth: 0,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "18px",

    fontWeight: 900,

    whiteSpace: "nowrap",
  },
};

// ============================================================
// END
// ============================================================
