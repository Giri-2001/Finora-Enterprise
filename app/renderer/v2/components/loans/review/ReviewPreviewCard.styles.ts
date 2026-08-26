// ============================================================
// FINORA ENTERPRISE V2
//
// REVIEW STUDIO
// REVIEW PREVIEW CARD STYLES
//
// RESPONSIBILITY:
// - ReviewPreviewCard presentation only
// - Final loan review summary presentation
// - Consume FINORA Theme Engine CSS variables
// - Responsive preview geometry
// - Mobile: one item per row
// - Tablet / Laptop / Desktop: two items per row
// - No local theme palette
// - No media queries
//
// ============================================================

import type { CSSProperties } from "react";

import type { ResponsiveTokens } from "../../../utils/responsive";

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {
  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  border: "var(--finora-theme-border-default, rgba(148, 163, 184, 0.16))",

  borderStrong:
    "var(--finora-theme-border-strong, rgba(37, 99, 235, 0.42))",

  text: "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",
};

// ============================================================
// CARD WRAPPER
// ============================================================

export const cardStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
};

// ============================================================
// PREVIEW GRID
//
// Responsive contract:
//
// Mobile:
//   1 item per row
//
// Tablet:
//   2 items per row
//
// Laptop:
//   2 items per row
//
// Desktop:
//   2 items per row
// ============================================================

export function createPreviewGridStyle(
  tokens: ResponsiveTokens,
): CSSProperties {
  const mobile = tokens.meta.viewport === "mobile";

  return {
    display: "grid",

    gridTemplateColumns: mobile
      ? "minmax(0, 1fr)"
      : "repeat(2, minmax(0, 1fr))",

    gap: "6px 8px",

    width: "100%",

    minWidth: 0,

    boxSizing: "border-box",
  };
}

// ============================================================
// LEGACY PREVIEW GRID
//
// Kept for compatibility with existing imports.
// The responsive component uses createPreviewGridStyle().
// ============================================================

export const previewGridStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

  gap: "6px 8px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
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

  minHeight: "31px",

  padding: "6px 8px",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "6px",

  background: THEME.panelSoft,

  color: THEME.textSecondary,

  fontSize: "12px",

  fontWeight: 500,

  lineHeight: 1.25,
};

// ============================================================
// LABEL
// ============================================================

export const labelStyle: CSSProperties = {
  minWidth: 0,

  color: THEME.textMuted,

  fontSize: "12px",

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

  color: THEME.text,

  fontSize: "12px",

  fontWeight: 650,

  lineHeight: 1.25,

  textAlign: "right",

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",
};

// ============================================================
// PRIMARY VALUE
// ============================================================

export const primaryValueStyle: CSSProperties = {
  ...valueStyle,

  color: THEME.text,

  fontSize: "13px",

  fontWeight: 700,
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
// FULL WIDTH ROW
// ============================================================

export const fullWidthRowStyle: CSSProperties = {
  ...rowStyle,

  minHeight: "34px",

  padding: "7px 9px",

  background: THEME.panel,

  borderColor: THEME.borderStrong,
};

// ============================================================
// END
// ============================================================