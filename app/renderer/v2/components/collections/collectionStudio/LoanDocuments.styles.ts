/* ===========================================================
   FINORA ENTERPRISE OS™

   COLLECTION STUDIO™

   LOAN DOCUMENTS / IMAGES STYLES

   RESPONSIBILITY

   - Loan document section geometry
   - Document preview tiles
   - Section heading
   - View-all action
   - FINORA Theme Engine token consumption

   IMPORTANT

   - No local theme system
   - No local breakpoint system
   - No responsive logic
   - No business logic
   - No second colour palette
   - Responsive geometry belongs to Responsive Engine
=========================================================== */

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
} as const;

// ============================================================
// PUBLIC STYLES
// ============================================================

export const loanDocumentsStyles: Record<string, CSSProperties> = {
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

    paddingBottom: "12px",

    boxSizing: "border-box",

    borderBottom: `1px solid ${THEME.border}`,
  },

  // ==========================================================
  // HEADER TITLE
  // ==========================================================

  headerTitle: {
    minWidth: 0,

    display: "flex",

    alignItems: "center",

    gap: "10px",
  },

  // ==========================================================
  // STEP
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

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "11px",

    fontWeight: 800,
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

    letterSpacing: "0.04em",

    lineHeight: 1.3,
  },

  // ==========================================================
  // SUBTITLE
  // ==========================================================

  subtitle: {
    margin: "3px 0 0",

    color: THEME.textMuted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "10px",

    fontWeight: 500,

    lineHeight: 1.35,
  },

  // ==========================================================
  // VIEW ALL BUTTON
  // ==========================================================

  viewAllButton: {
    flexShrink: 0,

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "7px",

    minHeight: "30px",

    padding: "6px 11px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.border}`,

    borderRadius: "8px",

    background: THEME.surfaceSoft,

    color: THEME.textSecondary,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "9px",

    fontWeight: 800,

    letterSpacing: "0.03em",

    cursor: "pointer",
  },

  // ==========================================================
  // ARROW
  // ==========================================================

  arrow: {
    color: THEME.brand,

    fontSize: "13px",

    lineHeight: 1,
  },

  // ==========================================================
  // GRID
  // ==========================================================

  grid: {
    width: "100%",

    minWidth: 0,

    display: "grid",

    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",

    gap: "10px",

    boxSizing: "border-box",
  },

  // ==========================================================
  // DOCUMENT BUTTON
  // ==========================================================

  documentButton: {
    minWidth: 0,

    width: "100%",

    aspectRatio: "1 / 0.72",

    padding: 0,

    overflow: "hidden",

    boxSizing: "border-box",

    border: `1px solid ${THEME.border}`,

    borderRadius: "9px",

    background: THEME.surfaceSoft,

    cursor: "pointer",
  },

  // ==========================================================
  // IMAGE
  // ==========================================================

  image: {
    display: "block",

    width: "100%",

    height: "100%",

    objectFit: "cover",
  },

  // ==========================================================
  // PLACEHOLDER
  // ==========================================================

  placeholder: {
    width: "100%",

    height: "100%",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    gap: "5px",

    background: THEME.surfaceSoft,
  },

  // ==========================================================
  // PLACEHOLDER ICON
  // ==========================================================

  placeholderIcon: {
    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    minWidth: "34px",

    minHeight: "24px",

    padding: "3px 7px",

    boxSizing: "border-box",

    border: `1px solid ${THEME.borderStrong}`,

    borderRadius: "5px",

    color: THEME.brand,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "8px",

    fontWeight: 800,

    letterSpacing: "0.05em",
  },

  // ==========================================================
  // PLACEHOLDER TEXT
  // ==========================================================

  placeholderText: {
    color: THEME.textMuted,

    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

    fontSize: "8px",

    fontWeight: 700,

    letterSpacing: "0.05em",
  },
};

// ============================================================
// END
// ============================================================
