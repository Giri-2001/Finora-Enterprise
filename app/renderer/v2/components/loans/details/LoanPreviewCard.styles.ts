// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN PREVIEW CARD STYLES
//
// THEME:
// - Visual colours come from FINORA Theme Engine CSS variables.
// - No local theme palette.
// - Responsive preview geometry is CSS-driven.
// - No breakpoint detection.
// - No window.innerWidth.
//
// RESPONSIVE PREVIEW GRID:
// - Mobile       → 1 field / row
// - Tablet       → 2 fields / row
// - Laptop       → 2 fields / row
// - Desktop      → 2 fields / row
//
// ============================================================

import type { CSSProperties } from "react";

const PREVIEW_FONT_FAMILY =
  "Inter, ui-sans-serif, system-ui, sans-serif";

// ============================================================
// THEME TOKENS
// ============================================================

const THEME = {
  background:
    "var(--finora-theme-background-page, var(--finora-theme-surface, #0F172A))",

  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  border: "var(--finora-theme-border-default, rgba(148, 163, 184, 0.16))",

  borderStrong: "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.42))",

  primarySoft: "var(--finora-theme-brand-accent-soft, rgba(37, 99, 235, 0.14))",

  text: "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary: "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted: "var(--finora-theme-text-muted, #94A3B8)",

  shadow: "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.18))",

  primary: "var(--finora-theme-brand-primary, #2563EB)",
};

// ============================================================
// CARD WRAPPER
// ============================================================

export const cardStyle: CSSProperties = {
  fontFamily: PREVIEW_FONT_FAMILY,
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding: "10px 12px 18px",

  border: `1px solid ${THEME.border}`,

  borderRadius: "13px",

  background: THEME.panel,

  color: THEME.text,

  boxShadow: "none",

  overflow: "hidden",
};

// ============================================================
// CONTENT
// ============================================================

export const contentStyle: CSSProperties = {
  display: "flex",

  flexDirection: "column",

  gap: "10px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  overflow: "hidden",
};

// ============================================================
// GROUP
// ============================================================

export const groupStyle: CSSProperties = {
  display: "flex",

  flexDirection: "column",

  gap: "5px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  overflow: "hidden",
};

// ============================================================
// GROUP TITLE
// ============================================================

export const groupTitleStyle: CSSProperties = {
  padding: "1px 2px",

  color: THEME.textSecondary,

  fontSize: "12px",

  fontWeight: 750,

  lineHeight: 1.2,

  textTransform: "uppercase",

  letterSpacing: "0.06em",

  minWidth: 0,
};

// ============================================================
// PREVIEW GRID
//
// IMPORTANT
// ------------------------------------------------------------
// The preview component must consume this shared style.
//
// The grid intentionally uses a fluid minimum size:
//
//   repeat(auto-fit, minmax(200px, 1fr))
//
// This allows:
// - narrow mobile preview → 1 column
// - wider preview area    → 2 columns
//
// The Step 1 responsive layout determines the available
// preview width. No viewport JavaScript is used here.
//
// ============================================================

export const previewGridStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",

  gap: "6px 8px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  alignItems: "stretch",

  overflow: "hidden",
};

// ============================================================
// PREVIEW ROW
// ============================================================

export const rowStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "8px",

  minWidth: 0,

  width: "100%",

  minHeight: "39px",

  padding: "6px 8px",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "6px",

  background: THEME.panelSoft,

  color: THEME.textSecondary,

  fontSize: "13px",

  fontWeight: 500,

  lineHeight: 1.25,

  overflow: "hidden",
};

// ============================================================
// LABEL
// ============================================================

export const labelStyle: CSSProperties = {
  minWidth: 0,

  flex: "1 1 auto",

  color: THEME.textMuted,

  fontSize: "13px",

  fontWeight: 550,

  lineHeight: 1.25,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",
};

// ============================================================
// VALUE
// ============================================================

export const valueStyle: CSSProperties = {
  minWidth: 0,

  maxWidth: "74%",

  flex: "0 1 auto",

  color: THEME.text,

  fontSize: "14px",

  fontWeight: 650,

  lineHeight: 1.25,

  textAlign: "right",

  paddingRight: "2px",
  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",
};

// ============================================================
// CUSTOMER VALUE
// ============================================================

export const customerValueStyle: CSSProperties = {
  ...valueStyle,

  color: THEME.text,

  fontWeight: 700,
};

// ============================================================
// FINANCIAL VALUE
// ============================================================

export const financialValueStyle: CSSProperties = {
  ...valueStyle,

  color: THEME.text,

  fontSize: "14px",

  fontWeight: 750,
};

// ============================================================
// HIGHLIGHT ROW
// ============================================================

export const highlightRowStyle: CSSProperties = {
  ...rowStyle,

  borderColor: THEME.borderStrong,

  background: THEME.panel,

  boxShadow: "none",
};

// ============================================================
// FULL WIDTH CUSTOMER ROW
// ============================================================

export const fullWidthRowStyle: CSSProperties = {
  ...rowStyle,

  minHeight: "39px",

  padding: "7px 9px",

  background: THEME.panel,

  borderColor: THEME.borderStrong,

  gridColumn: "1 / -1",
};

// ============================================================
// PREVIEW BADGE
// ============================================================

export const previewBadgeStyle: CSSProperties = {
  padding: "5px 9px",

  borderRadius: "6px",

  border: `1px solid ${THEME.borderStrong}`,

  background: THEME.panelSoft,

  color: THEME.textSecondary,

  fontSize: "13px",

  fontWeight: 650,

  whiteSpace: "nowrap",

  flexShrink: 0,
};

// ============================================================
// END
// ============================================================
