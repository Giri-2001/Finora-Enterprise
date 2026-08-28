// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// COLLECTION HISTORY STYLES
//
// RESPONSIBILITY
//
// - Collection history geometry
// - Premium Lucide header presentation
// - History table presentation
// - Empty state
// - FINORA Theme Engine token consumption
//
// IMPORTANT
//
// - No local theme system
// - No local breakpoint system
// - No responsive logic
// - No business logic
// - No second colour palette
// - Responsive geometry belongs to Responsive Engine
//
// VERSION : 2.1
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

  brandSoft:
    "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  // ==========================================================
  // BORDER
  // ==========================================================

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  // ==========================================================
  // STATUS
  // ==========================================================

  success: "var(--finora-theme-success, var(--success, #23865A))",
} as const;

// ============================================================
// FONT
// ============================================================

const INTER_FONT =
  "Inter, ui-sans-serif, system-ui, sans-serif";

// ============================================================
// EXPORT
// ============================================================

export const collectionHistoryStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // SECTION
  // ==========================================================

  section: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    gap: "14px",

    padding: "16px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "14px",

    boxShadow: "0 4px 18px rgba(15, 23, 42, 0.04)",

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

    gap: "16px",

    paddingBottom: "13px",

    boxSizing: "border-box",

    borderBottom: `1px solid ${THEME.border}`,

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // HEADER TITLE
  // ==========================================================

  headerTitle: {
    minWidth: 0,

    flex: "1 1 auto",

    display: "flex",

    alignItems: "flex-start",

    gap: "11px",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // HEADER ICON
  // ==========================================================

  headerIcon: {
    width: "23px",

    height: "23px",

    minWidth: "23px",

    flexShrink: 0,

    marginTop: "8px",

    color: THEME.brand,

    strokeWidth: 2,
  },

  // ==========================================================
  // HEADER CONTENT
  // ==========================================================

  headerContent: {
    minWidth: 0,

    flex: "1 1 auto",

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    gap: "2px",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // LEGACY STEP
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

    fontFamily: INTER_FONT,

    fontSize: "11px",

    fontWeight: 800,
  },

  // ==========================================================
  // TITLE
  // ==========================================================

  title: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "16px",

    fontWeight: 800,

    letterSpacing: "0.015em",

    lineHeight: 1.25,
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  subtitle: {
    margin: "3px 0 0",

    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 500,

    lineHeight: 1.4,
  },

  // ==========================================================
  // TABLE WRAPPER
  // ==========================================================

  tableWrapper: {
    width: "100%",

    minWidth: 0,

    overflowX: "auto",

    boxSizing: "border-box",

    border: `1px solid ${THEME.border}`,

    borderRadius: "10px",
  },

  // ==========================================================
  // TABLE
  // ==========================================================

  table: {
    width: "100%",

    minWidth: "640px",

    borderCollapse: "collapse",

    background: THEME.surface,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // TABLE HEADER
  // ==========================================================

  tableHeader: {
    padding: "10px 12px",

    boxSizing: "border-box",

    background: THEME.surfaceSoft,

    borderBottom: `1px solid ${THEME.border}`,

    color: THEME.textMuted,

    fontSize: "10px",

    fontWeight: 750,

    letterSpacing: "0.06em",

    textAlign: "left",

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // AMOUNT HEADER
  // ==========================================================

  amountHeader: {
    textAlign: "right",
  },

  // ==========================================================
  // TABLE CELL
  // ==========================================================

 tableCell: {
  padding: "11px 12px",

  boxSizing: "border-box",

  borderBottom: `1px solid ${THEME.border}`,

  color: THEME.textSecondary,

  fontSize: "12px",
  fontWeight: 650,

  lineHeight: 1.35,

  whiteSpace: "nowrap",
},

  // ==========================================================
  // AMOUNT CELL
  // ==========================================================

  amountCell: {
    color: THEME.textPrimary,

    fontSize: "14px",

    fontWeight: 700,

    textAlign: "center",
  },

  // ==========================================================
  // BALANCE CELL
  // ==========================================================

  balanceCell: {
    color: THEME.success,

    fontSize: "14px",

    fontWeight: 750,

    textAlign: "right",
  },

  // ==========================================================
  // RECEIPT NUMBER
  // ==========================================================

  receiptNumber: {
    display: "inline-flex",

    alignItems: "center",

    minHeight: "24px",

    padding: "3px 7px",

    boxSizing: "border-box",

    borderRadius: "6px",

    background: THEME.brandSoft,

    color: THEME.brand,

    fontSize: "11px",

    fontWeight: 700,

    letterSpacing: "0.03em",
  },

  // ==========================================================
  // PAYMENT MODE
  // ==========================================================

paymentMode: {
  color: THEME.textPrimary,

  fontSize: "12px",

  fontWeight: 750,

  textAlign: "center",

  textTransform: "uppercase",
},

centerHeader: {
  textAlign: "center",
},

centerCell: {
  textAlign: "center",
},

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  emptyState: {
    width: "100%",

    minHeight: "90px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "5px",

    boxSizing: "border-box",

    padding: "18px",

    border: `1px dashed ${THEME.border}`,

    borderRadius: "10px",

    background: THEME.surfaceSoft,

    textAlign: "center",

    fontFamily: INTER_FONT,
  },

  // ==========================================================
  // EMPTY TITLE
  // ==========================================================

  emptyTitle: {
    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "11px",

    fontWeight: 800,
  },

  // ==========================================================
  // EMPTY MESSAGE
  // ==========================================================

  emptyMessage: {
    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 500,
  },
};

// ============================================================
// END
// ============================================================