// ============================================================
// FINORA ENTERPRISE V2
//
// GUARANTOR STUDIO
// GUARANTOR PREVIEW CARD STYLES
//
// RESPONSIBILITY:
// - GuarantorPreviewCard presentation only
// - Premium compact guarantor summary presentation
// - Five clean individual preview rows
// - Single-viewport Step 4 compatibility
// - FINORA Enterprise Theme Engine compatibility
//
// DESIGN:
// - Theme colours are supplied by the existing FINORA Theme Engine
// - No local hard-coded application colours
// - Minimum font-size: 12px
// - Font weights: 500–750
//
// LAYOUT:
// Guarantor
// Mobile
// Occupation
// Address
// Relationship
//
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME TOKENS
//
// Values are resolved from the existing FINORA Theme Engine
// CSS variable bridge.
//
// No new colours are introduced.
// ============================================================

const THEME = {
  panel:
    "var(--finora-theme-background-surface)",

  border:
    "var(--finora-theme-border-default)",

  borderStrong:
    "var(--finora-theme-brand-primary)",

  primary:
    "var(--finora-theme-brand-primary)",

  primarySoft:
    "var(--finora-theme-brand-accent-soft)",

  primaryGlow:
    "var(--finora-theme-brand-accent-soft)",

  text:
    "var(--finora-theme-text-primary)",

  textSecondary:
    "var(--finora-theme-text-secondary)",

  textMuted:
    "var(--finora-theme-text-muted)",
} as const;

// ============================================================
// CARD WRAPPER
// ============================================================

export const cardStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",

  marginBottom: "10px",

  overflow: "hidden",
};

// ============================================================
// PREVIEW GRID
//
// IMPORTANT:
// One item = one complete row.
//
// Guarantor
// Mobile
// Occupation
// Address
// Relationship
//
// ============================================================

export const previewGridStyle: CSSProperties = {
  display: "grid",

  // FIVE ITEMS = FIVE ROWS
  gridTemplateColumns: "minmax(0, 1fr)",

  gap: "6px",

  width: "100%",
  minWidth: 0,

  margin: 0,
  padding: 0,

  boxSizing: "border-box",

  overflow: "hidden",
};

// ============================================================
// PREVIEW ROW
// ============================================================

export const rowStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",
  justifyContent: "space-between",

  width: "100%",
  minWidth: 0,

  // Increased height for proper text visibility
  minHeight: "36px",

  padding: "8px 10px",
  margin: 0,

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,
  borderRadius: "6px",

  background: THEME.panel,

  color: THEME.textSecondary,

  fontSize: "12px",
  fontWeight: 500,

  lineHeight: "16px",

  gap: "10px",

  overflow: "hidden",
};

// ============================================================
// LABEL
// ============================================================

export const labelStyle: CSSProperties = {
  minWidth: 0,

  flex: "0 0 auto",

  color: THEME.textMuted,

  fontSize: "12px",
  fontWeight: 500,

  lineHeight: 1.2,

  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

// ============================================================
// VALUE
// ============================================================

export const valueStyle: CSSProperties = {
  minWidth: 0,

  flex: "1 1 auto",

  color: THEME.text,

  fontSize: "12px",
  fontWeight: 650,

  lineHeight: "16px",

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

  fontSize: "13px",
  fontWeight: 700,
};

// ============================================================
// HIGHLIGHT ROW
// ============================================================

export const highlightRowStyle: CSSProperties = {
  ...rowStyle,

  borderColor: THEME.borderStrong,

  background: `linear-gradient(
    90deg,
    ${THEME.primarySoft},
    ${THEME.panel}
  )`,

  boxShadow: `0 0 10px ${THEME.primaryGlow}`,
};

// ============================================================
// FULL WIDTH ROW
//
// Kept for component compatibility.
// Every preview row is already full width.
// ============================================================

export const fullWidthRowStyle: CSSProperties = {
  ...rowStyle,

  gridColumn: "1 / -1",

  width: "100%",
};

// ============================================================
// END
// ============================================================