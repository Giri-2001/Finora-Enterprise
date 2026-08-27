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

  successSoft: "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",
} as const;

// ============================================================
// FONTS
// ============================================================

const INTER_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

const GEORGIA_FONT = "Georgia, 'Times New Roman', serif";

// ============================================================
// STYLES
// ============================================================

export const collectionPaymentDetailsStyles: Record<string, CSSProperties> = {
  // ==========================================================
  // SECTION
  // ==========================================================

  section: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    background: THEME.surface,

    border: "none",

    borderRadius: 0,

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

    flexShrink: 0,

    boxSizing: "border-box",

    color: THEME.brand,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "10px",

    fontWeight: 800,
  },

  title: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "16px",

    fontWeight: 700,

    lineHeight: 1.6,

    letterSpacing: "0.03em",

    textTransform: "uppercase",
  },

  subtitle: {
    margin: "5px 0 0",

    color: THEME.textSecondary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

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

    rowGap: "10px",

    alignItems: "start",

    paddingTop: "15px",

    minWidth: 0,
  },

  // ==========================================================
  // FIELD
  // ==========================================================

  field: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "6px",
  },

  // ==========================================================
  // LABEL
  // ==========================================================

  label: {
    color: THEME.textPrimary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "13px",

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

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "13px",

    fontWeight: 600,
  },

  // ==========================================================
  // REMARKS
  //
  // Second-row field.
  // Occupies first two grid columns.
  // ==========================================================

  remarksField: {
    gridColumn: "1",

    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    gap: "3px",
  },

  textarea: {
    width: "100%",

    height: "36px",

    minHeight: "36px",

    maxHeight: "36px",

    padding: "7px 9px",

    boxSizing: "border-box",

    resize: "none",

    border: `1px solid ${THEME.border}`,

    borderRadius: "7px",

    outline: "none",

    background: THEME.surfaceSoft,

    color: THEME.textPrimary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "13px",

    lineHeight: 1.5,
  },

  // ==========================================================
  // FINAL COLLECTION
  //
  // Compact amount card placed in row 2.
  // ==========================================================

  totalBar: {
    minWidth: 0,

    height: "36px",

    minHeight: "36px",

    maxHeight: "36px",

    boxSizing: "border-box",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "8px",

    padding: "7px 10px",

    border: `1px solid ${THEME.success}`,

    borderRadius: "8px",

    background: "rgba(35, 134, 90, 0.05)",

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

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "12px",

    fontWeight: 750,

    letterSpacing: "0.06em",

    lineHeight: 1.1,
  },

  totalHint: {
    display: "block",

    marginTop: "2px",

    color: THEME.textMuted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "7px",

    lineHeight: 1.15,

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",
  },

  totalValue: {
    flexShrink: 0,

    color: THEME.success,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "16px",

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
    gridColumn: "3",

    minWidth: 0,

    width: "100%",

    height: "36px",

    minHeight: "36px",

    maxHeight: "36px",

    display: "flex",

    alignItems: "stretch",

    justifyContent: "stretch",

    gap: "6px",

    flexWrap: "nowrap",

    boxSizing: "border-box",
  },

  // ==========================================================
  // SAVE BUTTON
  // ==========================================================

  saveButton: {
    minWidth: 0,

    flex: "1 1 0",

    minHeight: "36px",

    padding: "7px 11px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "7px",

    background: THEME.surface,

    color: THEME.textPrimary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "11px",

    fontWeight: 700,

    letterSpacing: "0.02em",

    cursor: "pointer",

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // SAVE & RECEIPT
  // ==========================================================

  receiptButton: {
    minWidth: 0,

    flex: "1 1 0",

    minHeight: "36px",

    padding: "7px 12px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "7px",

    background: "rgba(198, 146, 20, 0.12)",

    color: THEME.brand,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "11px",

    fontWeight: 700,

    letterSpacing: "0.02em",

    cursor: "pointer",

    whiteSpace: "nowrap",
  },
};

// ============================================================
// END
// ============================================================
