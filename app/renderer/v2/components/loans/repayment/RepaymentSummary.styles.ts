// ============================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO
// REPAYMENT SUMMARY STYLES
//
// RESPONSIBILITY:
// - RepaymentSummary presentation only
// - Compact repayment totals presentation
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
// SUMMARY GRID
// ============================================================

export const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px 8px",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

// ============================================================
// SUMMARY ROW
// ============================================================

export const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  minHeight: "50px",
  padding: "7px 9px",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "7px",
  background: COLORS.panel,
};

// ============================================================
// LABEL
// ============================================================

export const labelStyle: CSSProperties = {
  color: COLORS.textMuted,
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.2,
};

// ============================================================
// VALUE
// ============================================================

export const valueStyle: CSSProperties = {
  minWidth: 0,
  color: COLORS.text,
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

// ============================================================
// HIGHLIGHT ROW
// ============================================================

export const highlightRowStyle: CSSProperties = {
  ...rowStyle,
  borderColor: "rgba(37, 99, 235, 0.38)",
  background: `linear-gradient(
    135deg,
    ${COLORS.primarySoft},
    ${COLORS.panel}
  )`,
};

// ============================================================
// END
// ============================================================
