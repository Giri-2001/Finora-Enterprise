/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTIONS ENGINE

   RECEIPT PREVIEW CARD
   STYLES

   RESPONSIBILITY
   - Receipt preview card geometry
   - Theme-token consumption
   - No business logic
   - No local responsive system
   - Compatible with FINORA Theme Engine

   VERSION : 2.0
   STATUS  : Production
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   THEME TOKENS

   FINORA Theme Engine
        ↓
   Global CSS Variables
        ↓
   Receipt Preview Card
=========================================================== */

const THEME = {
  surface:
    "var(--finora-theme-surface, var(--surface, #FFFFFF))",

  surfaceSoft:
    "var(--finora-theme-surface-muted, var(--surface-soft, #F5F7FA))",

  border:
    "var(--finora-theme-border-default, var(--border, #D5DCE5))",

  textPrimary:
    "var(--finora-theme-text-primary, var(--text, #111827))",

  textSecondary:
    "var(--finora-theme-text-secondary, #475569)",

  textMuted:
    "var(--finora-theme-text-muted, var(--text-muted, #6B7280))",

  brand:
    "var(--finora-theme-brand-primary, var(--accent, #C69214))",

  success:
    "var(--finora-theme-success, var(--success, #23865A))",

  successSoft:
    "var(--finora-theme-success-soft, rgba(35, 134, 90, 0.10))",
} as const;

/* ===========================================================
   EXPORT
=========================================================== */

export const receiptPreviewCardStyles: Record<
  string,
  CSSProperties
> = {
  /* =========================================================
     CARD
  ========================================================= */

  card: {
    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    gap: "14px",

    padding: "16px 18px",

    background: THEME.surface,

    border: `1px solid ${THEME.border}`,

    borderRadius: "14px",

    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.06)",
  },

  /* =========================================================
     HEADER
  ========================================================= */

  header: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "12px",

    paddingBottom: "10px",

    borderBottom:
      `1px solid ${THEME.border}`,
  },

  title: {
    margin: 0,

    color: THEME.textPrimary,

    fontFamily:
      "Georgia, 'Times New Roman', serif",

    fontSize: "18px",

    fontWeight: 700,

    lineHeight: 1.2,
  },

  badge: {
    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "5px 9px",

    boxSizing: "border-box",

    border:
      `1px solid ${THEME.success}`,

    borderRadius: "999px",

    background: THEME.successSoft,

    color: THEME.success,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "8px",

    fontWeight: 800,

    letterSpacing: "0.08em",

    textTransform: "uppercase",

    whiteSpace: "nowrap",
  },

  /* =========================================================
     CONTENT
  ========================================================= */

  content: {
    width: "100%",

    display: "flex",

    flexDirection: "column",

    gap: "9px",
  },

  /* =========================================================
     DETAIL ROW
  ========================================================= */

  row: {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns:
      "minmax(110px, 0.8fr) minmax(0, 1.2fr)",

    gap: "12px",

    alignItems: "center",

    padding: "8px 10px",

    boxSizing: "border-box",

    background: THEME.surfaceSoft,

    border:
      `1px solid ${THEME.border}`,

    borderRadius: "8px",
  },

  label: {
    minWidth: 0,

    color: THEME.textMuted,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "10px",

    fontWeight: 600,

    lineHeight: 1.3,
  },

  value: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.textPrimary,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "12px",

    fontWeight: 800,

    lineHeight: 1.3,

    textAlign: "right",
  },

  /* =========================================================
     AMOUNT VALUE
  ========================================================= */

  amountValue: {
    minWidth: 0,

    overflow: "hidden",

    textOverflow: "ellipsis",

    whiteSpace: "nowrap",

    color: THEME.brand,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "15px",

    fontWeight: 900,

    lineHeight: 1.3,

    textAlign: "right",
  },

  /* =========================================================
     FOOTER
  ========================================================= */

  footer: {
    display: "flex",

    alignItems: "center",

    justifyContent: "space-between",

    gap: "12px",

    paddingTop: "8px",

    borderTop:
      `1px solid ${THEME.border}`,
  },

  footerLabel: {
    color: THEME.textMuted,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "9px",

    fontWeight: 700,

    letterSpacing: "0.04em",
  },

  footerValue: {
    color: THEME.textSecondary,

    fontFamily:
      "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "10px",

    fontWeight: 700,
  },
};

/* ===========================================================
   END
=========================================================== */