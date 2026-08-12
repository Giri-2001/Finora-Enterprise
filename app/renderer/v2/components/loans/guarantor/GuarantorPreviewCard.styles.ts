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
// - FINORA Enterprise dark navy theme
//
// DESIGN:
// - Primary Blue: #2563EB
// - No brown
// - No gold
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
// COLOR TOKENS
// ============================================================

const COLORS = {
  panel: "#111C2E",
  panelSoft: "#142238",

  input: "#0A1425",

  border: "rgba(148, 163, 184, 0.18)",
  borderStrong: "rgba(37, 99, 235, 0.38)",

  primary: "#2563EB",
  primarySoft: "rgba(37, 99, 235, 0.14)",
  primaryGlow: "rgba(37, 99, 235, 0.18)",

  text: "#FFFFFF",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
};

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

  border: `1px solid ${COLORS.border}`,
  borderRadius: "6px",

  background: COLORS.panel,

  color: COLORS.textSecondary,

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

  color: COLORS.textMuted,

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

// ============================================================
// VALUE
// ============================================================

export const valueStyle: CSSProperties = {
  minWidth: 0,

  flex: "1 1 auto",

  color: COLORS.text,

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

  borderColor: COLORS.borderStrong,

  background: `linear-gradient(
    90deg,
    ${COLORS.primarySoft},
    ${COLORS.panel}
  )`,

  boxShadow: `0 0 10px ${COLORS.primaryGlow}`,
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
