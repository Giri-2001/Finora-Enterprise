// ============================================================
// FINORA ENTERPRISE V2
//
// FINANCE STUDIO
// FINANCE HEADER STYLES
//
// RESPONSIBILITY:
// - FinanceHeader presentation only
// - Finance-specific header presentation
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
  background: "#0F172A",
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
// HEADER WRAPPER
// ============================================================

export const headerStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "13px 16px",
  marginBottom: "10px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "10px",
  background: `linear-gradient(
    135deg,
    ${COLORS.panel},
    ${COLORS.panelSoft}
  )`,
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.16)",
};

// ============================================================
// HEADER CONTENT
// ============================================================

export const contentStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

// ============================================================
// ACCENT
// ============================================================

export const accentStyle: CSSProperties = {
  width: "4px",
  minHeight: "38px",
  flexShrink: 0,
  borderRadius: "4px",
  background: COLORS.primary,
  boxShadow: `0 0 12px ${COLORS.primarySoft}`,
};

// ============================================================
// TEXT WRAPPER
// ============================================================

export const textWrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "3px",
  minWidth: 0,
};

// ============================================================
// TITLE
// ============================================================

export const titleStyle: CSSProperties = {
  margin: 0,
  color: COLORS.text,
  fontSize: "21px",
  fontWeight: 750,
  lineHeight: 1.2,
  letterSpacing: "0.01em",
};

// ============================================================
// SUBTITLE
// ============================================================

export const subtitleStyle: CSSProperties = {
  margin: 0,
  color: COLORS.textSecondary,
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1.35,
};

// ============================================================
// END
// ============================================================
