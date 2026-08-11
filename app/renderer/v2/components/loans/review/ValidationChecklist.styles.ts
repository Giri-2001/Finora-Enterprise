// ============================================================
// FINORA ENTERPRISE V2
//
// REVIEW STUDIO
// VALIDATION CHECKLIST STYLES
//
// RESPONSIBILITY:
// - ValidationChecklist presentation only
// - Compact validation summary layout
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
// CHECKLIST WRAPPER
// ============================================================

export const checklistStyle: CSSProperties = {
  margin: 0,
  padding: "0",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  listStyle: "none",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

// ============================================================
// CHECKLIST ITEM
// ============================================================

export const itemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minHeight: "31px",
  padding: "6px 8px",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "6px",
  background: COLORS.panel,
  color: COLORS.textMuted,
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.25,
};

// ============================================================
// STATUS MARK
// ============================================================

export const statusMarkStyle: CSSProperties = {
  width: "7px",
  height: "7px",
  flexShrink: 0,
  borderRadius: "50%",
  background: COLORS.primary,
  boxShadow: `0 0 8px ${COLORS.primarySoft}`,
};

// ============================================================
// ITEM TEXT
// ============================================================

export const itemTextStyle: CSSProperties = {
  minWidth: 0,
  color: COLORS.text,
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: 1.25,
};

// ============================================================
// EMPTY STATE
// ============================================================

export const emptyStateStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  minHeight: "31px",
  padding: "6px 8px",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "6px",
  background: COLORS.panel,
  color: COLORS.textMuted,
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.25,
};

// ============================================================
// END
// ============================================================
