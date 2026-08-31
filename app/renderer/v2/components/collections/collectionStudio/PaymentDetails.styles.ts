// ============================================================
// FINORA ENTERPRISE OS™
//
// COLLECTION STUDIO™
//
// PAYMENT DETAILS STYLES
//
// RESPONSIBILITY
//
// - Premium Payment Details presentation
// - FINORA form-control presentation
// - Full-width payment workflow geometry
// - Final collection emphasis
// - Save action hierarchy
// - Active FINORA theme consumption
//
// IMPORTANT
//
// - Presentation only
// - No business logic
// - No persistence logic
// - No local theme engine
// - No local breakpoint engine
// - No hardcoded application palette
// - All text and numbers use FINORA Inter contract
//
// VERSION : 2.1
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

  surfaceStrong:
    "var(--finora-theme-surface-strong, var(--finora-theme-surface-muted, #EEF2F7))",

  textPrimary: "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary: "var(--finora-theme-text-secondary, #475569)",

  textMuted: "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  textInverse: "var(--finora-theme-text-inverse, #FFFFFF)",

  brand: "var(--finora-theme-brand-primary, var(--accent, #C69214))",

  brandSoft: "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  borderStrong: "var(--finora-theme-border-strong, #B8C0CC)",

  success: "var(--finora-theme-success, var(--success, #23865A))",

  successSoft: "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",

  shadow: "var(--finora-theme-overlay-shadow, rgba(15, 23, 42, 0.08))",
} as const;

// ============================================================
// FONT CONTRACT
// ============================================================

const INTER_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

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

    padding: "16px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "14px",

    boxShadow: `0 4px 18px ${THEME.shadow}`,

    overflow: "visible",

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

    gap: "10px",

    boxSizing: "border-box",

    paddingBottom: "12px",

    borderBottom: `1px solid ${THEME.border}`,
  },

  headerIcon: {
  width: "23px",
  height: "23px",
  minWidth: "23px",

  flexShrink: 0,

  marginTop: "2px",

  color: THEME.brand,

  strokeWidth: 2,
},

  step: {
    width: "27px",

    height: "27px",

    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    boxSizing: "border-box",

    border: `1px solid ${THEME.borderStrong}`,

    borderRadius: "8px",

    background: THEME.brandSoft,

    color: THEME.brand,

    fontFamily: INTER_FONT,

    fontSize: "11px",

    fontWeight: 800,

    lineHeight: 1,
  },

  title: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "14px",

    fontWeight: 800,

    lineHeight: 1.25,

    letterSpacing: "0.035em",

    textTransform: "uppercase",
  },

  subtitle: {
    margin: "3px 0 0",

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "10px",

    fontWeight: 500,

    lineHeight: 1.35,
  },

  // ==========================================================
  // BODY
  //
  // DESKTOP CONTRACT
  //
  // ROW 1
  // Date 4/12 | Mode 4/12 | Reference 4/12
  //
  // ROW 2
  // Remarks 6/12 | Final 3/12 | Actions 3/12
  // ==========================================================

  body: {
  width: "100%",
  minWidth: 0,

  display: "grid",

  gridTemplateColumns:
    "minmax(0, 1.35fr) minmax(0, 1.35fr) repeat(5, minmax(0, 1fr))",

  gap: "9px",

  alignItems: "end",

  boxSizing: "border-box",

  paddingTop: "13px",

  fontFamily: INTER_FONT,
},

  // ==========================================================
  // STANDARD FIELD
  // ==========================================================

  field: {
  gridColumn: "span 1",

  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  gap: "6px",

  boxSizing: "border-box",

  fontFamily: INTER_FONT,
},

  // ==========================================================
  // LABEL
  // ==========================================================

  label: {
    color: THEME.textSecondary,

    fontFamily: INTER_FONT,

    fontSize: "12px",

    fontWeight: 700,

    lineHeight: 1.2,

    letterSpacing: "0.015em",
  },

  // ==========================================================
  // INPUT / SELECT
  //
  // Native browser visual language is intentionally removed.
  // Controls visually follow FINORA Studio.
  // ==========================================================

  input: {
    width: "100%",

    minWidth: 0,

    height: "42px",

    minHeight: "42px",

    boxSizing: "border-box",

    padding: "0 12px",

    appearance: "none",

    WebkitAppearance: "none",

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",

    outline: "none",

    background: THEME.surfaceSoft,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "12px",

    fontWeight: 650,

    lineHeight: 1.2,

    transition:
      "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
  },

  // ==========================================================
  // REMARKS
  // ==========================================================

  remarksField: {
  gridColumn: "span 1",

  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  justifyContent: "flex-end",

  boxSizing: "border-box",

  fontFamily: INTER_FONT,
},

  textarea: {
    width: "100%",

    minWidth: 0,

    height: "42px",

    minHeight: "42px",

    maxHeight: "42px",

    boxSizing: "border-box",

    padding: "10px 12px",

    resize: "none",

    overflow: "hidden",

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",

    outline: "none",

    background: THEME.surfaceSoft,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "12px",

    fontWeight: 650,

    transition:
      "border-color 150ms ease, box-shadow 150ms ease, background 150ms ease",
  },

  // ==========================================================
  // FINAL COLLECTION
  // ==========================================================

  totalBar: {
    gridColumn: "span 1",

    minWidth: 0,

    width: "100%",

    height: "42px",

    minHeight: "42px",

    boxSizing: "border-box",

    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "10px",

    padding: "0 12px",

    border: `1px solid ${THEME.success}`,

    borderRadius: "9px",

    background: THEME.successSoft,

    overflow: "hidden",

    fontFamily: INTER_FONT,
  },

  totalContent: {
    minWidth: 0,

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    fontFamily: INTER_FONT,
  },

  totalLabel: {
    display: "block",

    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.success,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 850,

    letterSpacing: "0.055em",

    lineHeight: 1.15,
  },

  totalHint: {
    display: "block",

    marginTop: "2px",

    color: THEME.textMuted,

    fontFamily: INTER_FONT,

    fontSize: "8px",

    fontWeight: 500,

    lineHeight: 1.1,

    whiteSpace: "nowrap",

    overflow: "hidden",

    textOverflow: "ellipsis",
  },

  totalValue: {
    flexShrink: 0,

    color: THEME.success,

    fontFamily: INTER_FONT,

    fontSize: "16px",

    fontWeight: 850,

    lineHeight: 1,

    letterSpacing: "-0.015em",

    whiteSpace: "nowrap",
  },

  // ==========================================================
  // ACTIONS
  // ==========================================================

  actions: {
  gridColumn: "span 2",

  minWidth: 0,

  width: "100%",

  height: "42px",

  minHeight: "42px",

  display: "grid",

  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

  gap: "9px",

  alignItems: "stretch",

  boxSizing: "border-box",

  fontFamily: INTER_FONT,
},

  // ==========================================================
  // SAVE COLLECTION
  // ==========================================================

  saveButton: {
    minWidth: 0,

    width: "100%",

    minHeight: "42px",

    boxSizing: "border-box",

    padding: "0 10px",

    border: `1px solid ${THEME.borderStrong}`,

    borderRadius: "9px",

    background: THEME.surfaceSoft,

    color: THEME.textPrimary,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 800,

    lineHeight: 1.15,

    letterSpacing: "0.02em",

    cursor: "pointer",

    whiteSpace: "nowrap",

    transition:
      "border-color 150ms ease, background 150ms ease, transform 150ms ease",
  },

  // ==========================================================
  // SAVE + RECEIPT
  // ==========================================================

  receiptButton: {
    minWidth: 0,

    width: "100%",

    minHeight: "42px",

    boxSizing: "border-box",

    padding: "0 10px",

    border: `1px solid ${THEME.brand}`,

    borderRadius: "9px",

    background: THEME.brand,

    color: THEME.textInverse,

    fontFamily: INTER_FONT,

    fontSize: "9px",

    fontWeight: 850,

    lineHeight: 1.15,

    letterSpacing: "0.02em",

    cursor: "pointer",

    whiteSpace: "nowrap",

    boxShadow: `0 4px 12px ${THEME.shadow}`,

    transition:
      "border-color 150ms ease, background 150ms ease, transform 150ms ease",
  },
};

// ============================================================
// END
// ============================================================
