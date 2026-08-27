// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// PAYMENT DETAILS STYLES
//
// VERSION : 2.0
// STATUS  : Production
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// THEME
// ============================================================

const THEME = {
  surface: "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  textPrimary: "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary: "var(--finora-theme-text-secondary, #475569)",

  textMuted: "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  brand: "var(--finora-theme-brand-primary, var(--accent, #C69214))",

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  success: "var(--finora-theme-success, var(--success, #23865A))",

  successSoft:
    "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",
} as const;

// ============================================================
// FONTS
// ============================================================

const INTER_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

const GEORGIA_FONT = "Georgia, 'Times New Roman', serif";

// ============================================================
// STYLES
// ============================================================

export const collectionPaymentDetailsStyles: Record<
  string,
  CSSProperties
> = {
  // ==========================================================
  // SECTION
  // ==========================================================

  section: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    padding: "9px 18px 10px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "12px",

    overflow: "hidden",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    display: "flex",

    alignItems: "flex-start",

    gap: "9px",

    paddingBottom: "7px",

    borderBottom: `1px solid ${THEME.border}`,
  },

  step: {
    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    width: "24px",

    height: "24px",

    flexShrink: 0,

    boxSizing: "border-box",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "50%",

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 800,
  },

  title: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily: GEORGIA_FONT,

    fontSize: "17px",

    fontWeight: 700,

    lineHeight: 1.1,

    letterSpacing: "0.01em",
  },

  subtitle: {
    margin: "2px 0 0",

    color: THEME.textSecondary,

    fontFamily: GEORGIA_FONT,

    fontSize: "10px",

    lineHeight: 1.2,
  },

  // ==========================================================
  // FORM BODY
  //
  // 3-COLUMN COMPACT GRID
  //
  // ROW 1:
  //   Date | Payment Mode | Reference
  //
  // ROW 2:
  //   Remarks | Final Collection | Actions
  // ==========================================================

  body: {
    display: "grid",

    gridTemplateColumns:
      "minmax(150px, 0.95fr) minmax(150px, 0.95fr) minmax(170px, 1fr)",

    gridTemplateRows: "auto auto",

    columnGap: "9px",

    rowGap: "8px",

    alignItems: "start",

    paddingTop: "8px",

    minWidth: 0,
  },

  // ==========================================================
  // FIELD
  // ==========================================================

  field: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "3px",
  },

  // ==========================================================
  // LABEL
  // ==========================================================

  label: {
    color: THEME.textPrimary,

    fontFamily: GEORGIA_FONT,

    fontSize: "10px",

    fontWeight: 700,

    lineHeight: 1.15,
  },

  // ==========================================================
  // INPUT / SELECT
  // ==========================================================

  input: {
    width: "100%",

    height: "36px",

    minHeight: "36px",

    padding: "7px 9px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.border}`,

    borderRadius: "7px",

    outline: "none",

    background: THEME.surfaceSoft,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 600,
  },

  // ==========================================================
  // REMARKS
  //
  // Second-row field.
  // Occupies first two grid columns.
  // ==========================================================

  remarksField: {
    gridColumn: "1 / span 2",

    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "3px",
  },

  textarea: {
    width: "100%",

    height: "58px",

    minHeight: "58px",

    maxHeight: "58px",

    padding: "7px 9px",

    boxSizing: "border-box",

    resize: "none",

    border: `1px solid ${THEME.border}`,

    borderRadius: "7px",

    outline: "none",

    background: THEME.surfaceSoft,

    color: THEME.textPrimary,

    fontFamily: GEORGIA_FONT,

    fontSize: "10px",

    lineHeight: 1.3,
  },

  // ==========================================================
  // FINAL COLLECTION
  //
  // Compact amount card placed in row 2.
  // ==========================================================

  totalBar: {
    minWidth: 0,

    minHeight: "58px",

    boxSizing: "border-box",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "8px",

    padding: "7px 10px",

    border: `1px solid ${THEME.success}`,

    borderRadius: "8px",

    background: THEME.successSoft,

    overflow: "hidden",
  },

  totalContent: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",
  },

  totalLabel: {
    display: "block",

    color: THEME.success,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 800,

    letterSpacing: "0.06em",

    lineHeight: 1.1,
  },

  totalHint: {
    display: "block",

    marginTop: "2px",

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "7px",

    lineHeight: 1.15,

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",
  },

  totalValue: {
    flexShrink: 0,

    color: THEME.success,

    fontFamily: GEORGIA_FONT,

    fontSize: "18px",

    fontWeight: 700,

    lineHeight: 1,

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // ACTIONS
  //
  // Second-row third-column.
  // ==========================================================

  actions: {
    minWidth: 0,

    minHeight: "58px",

    display: "flex",

    alignItems: "center",

    justifyContent: "flex-end",

    gap: "6px",

    flexWrap: "nowrap",
  },

  // ==========================================================
  // SAVE BUTTON
  // ==========================================================

  saveButton: {
    minWidth: 0,

    minHeight: "36px",

    padding: "7px 11px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "7px",

    background: THEME.surface,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.02em",

    cursor: "pointer",

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // SAVE & RECEIPT
  // ==========================================================

  receiptButton: {
    minWidth: 0,

    minHeight: "36px",

    padding: "7px 12px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "7px",

    background: THEME.brand,

    color: "#FFFFFF",

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.02em",

    cursor: "pointer",

    whiteSpace: "nowrap",
  },
};

// ============================================================
// END
// ============================================================