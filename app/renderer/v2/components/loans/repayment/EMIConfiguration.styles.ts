// ============================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO
// EMI CONFIGURATION STYLES
//
// RESPONSIBILITY:
// - EMIConfiguration presentation only
// - Compact EMI configuration layout
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
};

// ============================================================
// WRAPPER
// ============================================================

export const wrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "11px 14px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "10px",
  background: `linear-gradient(
    180deg,
    ${COLORS.panel},
    ${COLORS.panelSoft}
  )`,
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.14)",
};

// ============================================================
// CONTENT
// ============================================================

export const contentStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "8px 10px",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

// ============================================================
// HEADER
// ============================================================

export const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minHeight: "18px",
  marginBottom: "8px",
  color: COLORS.text,
  fontSize: "14px",
  fontWeight: 750,
  lineHeight: 1.2,
};

// ============================================================
// HEADER ACCENT
// ============================================================

export const accentStyle: CSSProperties = {
  width: "3px",
  height: "16px",
  flexShrink: 0,
  borderRadius: "3px",
  background: COLORS.primary,
  boxShadow: `0 0 10px ${COLORS.primarySoft}`,
};

// ============================================================
// FIELD
// ============================================================

export const fieldStyle: CSSProperties = {
  minWidth: 0,
  width: "100%",
  boxSizing: "border-box",
};

// ============================================================
// FIELD CONTENT
// ============================================================

export const fieldContentStyle: CSSProperties = {
  width: "82%",
  minWidth: "150px",
  boxSizing: "border-box",
};

// ============================================================
// END
// ============================================================
