// ============================================================
// FINORA ENTERPRISE V2
//
// FINANCE STUDIO
// FINANCE PREVIEW CARD STYLES
//
// RESPONSIBILITY:
// - FinancePreviewCard presentation only
// - Compact financial configuration summary
// - FINORA Login-inspired dark navy theme
//
// DESIGN:
// - Primary Blue: #2563EB
// - No brown
// - No gold
// - Minimum font-size: 12px
// - Font weights: 500–750
//
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {
  panel: "#111C2E",
  panelSoft: "#142238",
  border: "rgba(148, 163, 184, 0.20)",
  primary: "#2563EB",
  primarySoft: "rgba(37, 99, 235, 0.14)",
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
};

// ============================================================
// PREVIEW GRID
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
  minHeight: "32px",
  padding: "6px 8px",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "6px",
  background: COLORS.panel,
  color: COLORS.textSecondary,
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.25,
};

// ============================================================
// LABEL
// ============================================================

export const labelStyle: CSSProperties = {
  minWidth: 0,
  color: COLORS.textMuted,
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.25,
};

// ============================================================
// VALUE
// ============================================================

export const valueStyle: CSSProperties = {
  minWidth: 0,
  color: COLORS.text,
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
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 700,
};

// ============================================================
// HIGHLIGHT ROW
// ============================================================

export const highlightRowStyle: CSSProperties = {
  ...rowStyle,
  borderColor: "rgba(37, 99, 235, 0.38)",
  background: `linear-gradient(
    90deg,
    ${COLORS.primarySoft},
    ${COLORS.panel}
  )`,
};

// ============================================================
// FULL WIDTH ROW
// ============================================================

export const fullWidthRowStyle: CSSProperties = {
  ...rowStyle,
  gridColumn: "1 / -1",
};

// ============================================================
// END
// ============================================================
