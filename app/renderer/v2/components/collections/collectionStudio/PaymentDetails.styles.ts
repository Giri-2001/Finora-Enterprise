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

const THEME = {
  surface: "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  textPrimary: "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary: "var(--finora-theme-text-secondary, #475569)",

  textMuted: "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  brand: "var(--finora-theme-brand-primary, var(--accent, #C69214))",

  brandSoft: "var(--finora-theme-brand-accent-soft, rgba(198, 146, 20, 0.10))",

  border: "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  success: "var(--finora-theme-success, var(--success, #23865A))",

  successSoft: "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",
} as const;

const INTER_FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

const GEORGIA_FONT = "Georgia, 'Times New Roman', serif";

export const collectionPaymentDetailsStyles: Record<string, CSSProperties> = {
  section: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "10px 18px 12px",
    background: THEME.surface,
    border: `1px solid ${THEME.border}`,
    borderRadius: "12px",
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    paddingBottom: "9px",
    borderBottom: `1px solid ${THEME.border}`,
  },

  step: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "25px",
    height: "25px",
    flexShrink: 0,
    boxSizing: "border-box",
    border: `1px solid ${THEME.brand}`,
    borderRadius: "50%",
    color: THEME.brand,
    fontFamily: INTER_FONT,
    fontSize: "11px",
    fontWeight: 800,
  },

  title: {
    margin: 0,
    color: THEME.textPrimary,
    fontFamily: GEORGIA_FONT,
    fontSize: "18px",
    fontWeight: 700,
    lineHeight: 1.15,
  },

  subtitle: {
    margin: "2px 0 0",
    color: THEME.textSecondary,
    fontFamily: GEORGIA_FONT,
    fontSize: "11px",
    lineHeight: 1.25,
  },

  body: {
    display: "grid",
    gridTemplateColumns:
      "minmax(180px, 1fr) minmax(160px, .9fr) minmax(180px, 1fr) minmax(220px, 1.2fr)",
    gap: "10px",
    alignItems: "start",
    paddingTop: "10px",
  },

  field: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  label: {
    color: THEME.textPrimary,
    fontFamily: GEORGIA_FONT,
    fontSize: "11px",
    fontWeight: 700,
    lineHeight: 1.2,
  },

  input: {
    width: "100%",
    minHeight: "38px",
    padding: "8px 10px",
    boxSizing: "border-box",
    border: `1px solid ${THEME.border}`,
    borderRadius: "7px",
    outline: "none",
    background: THEME.surfaceSoft,
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "11px",
    fontWeight: 600,
  },

  textarea: {
    width: "100%",
    minHeight: "72px",
    padding: "9px 10px",
    boxSizing: "border-box",
    resize: "vertical",
    border: `1px solid ${THEME.border}`,
    borderRadius: "10px",
    outline: "none",
    background: THEME.surface,
    color: THEME.textPrimary,
    fontFamily: GEORGIA_FONT,
    fontSize: "12px",
    lineHeight: 1.35,
  },

  totalBar: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    minWidth: 0,
    padding: "9px 12px",
    boxSizing: "border-box",
    border: `1px solid ${THEME.success}`,
    borderRadius: "8px",
    background: THEME.successSoft,
  },

  totalLabel: {
    display: "block",
    color: THEME.success,
    fontFamily: INTER_FONT,
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.06em",
  },

  totalHint: {
    display: "block",
    marginTop: "2px",
    color: THEME.textMuted,
    fontFamily: INTER_FONT,
    fontSize: "8px",
  },

  totalValue: {
    flexShrink: 0,
    color: THEME.success,
    fontFamily: GEORGIA_FONT,
    fontSize: "20px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  actions: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    paddingTop: "2px",
  },

  saveButton: {
    minHeight: "38px",
    padding: "8px 16px",
    boxSizing: "border-box",
    border: `1px solid ${THEME.brand}`,
    borderRadius: "7px",
    background: THEME.surface,
    color: THEME.textPrimary,
    fontFamily: INTER_FONT,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.03em",
    cursor: "pointer",
  },

  receiptButton: {
    minHeight: "38px",
    padding: "8px 18px",
    boxSizing: "border-box",
    border: `1px solid ${THEME.brand}`,
    borderRadius: "7px",
    background: THEME.brand,
    color: "#FFFFFF",
    fontFamily: INTER_FONT,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.03em",
    cursor: "pointer",
  },
};

// ============================================================
// END
// ============================================================
