// ============================================================
// FINORA ENTERPRISE V2
//
// GUARANTOR STUDIO
// RELATIONSHIP CARD STYLES
//
// RESPONSIBILITY:
// - RelationshipCard presentation only
// - Premium compact customer relationship configuration
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
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {
  panel: "#111C2E",
  panelSoft: "#142238",
  border: "rgba(148, 163, 184, 0.18)",
  primary: "#2563EB",
  primarySoft: "rgba(37, 99, 235, 0.14)",
  primaryGlow: "rgba(37, 99, 235, 0.18)",
  text: "#FFFFFF",
};

// ============================================================
// WRAPPER
//
// Compact relationship section.
// No unnecessary internal spacing.
// ============================================================

export const wrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",

  padding: "7px 10px",

  marginBottom: "10px",

  border: `1px solid ${COLORS.border}`,
  borderRadius: "9px",

  background: `linear-gradient(
    180deg,
    ${COLORS.panel},
    ${COLORS.panelSoft}
  )`,

  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",

  overflow: "hidden",
};

// ============================================================
// HEADER
// ============================================================

export const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",

  gap: "6px",

  minHeight: "17px",

  margin: 0,
  marginBottom: "10px",

  padding: 0,

  color: COLORS.text,

  fontSize: "13px",
  fontWeight: 750,

  lineHeight: 1.15,

  boxSizing: "border-box",
};

// ============================================================
// HEADER ACCENT
// ============================================================

export const accentStyle: CSSProperties = {
  width: "3px",
  height: "15px",

  flexShrink: 0,

  borderRadius: "3px",

  background: COLORS.primary,

  boxShadow: `0 0 8px ${COLORS.primaryGlow}`,
};

// ============================================================
// FIELD
// ============================================================

export const fieldStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",

  margin: 0,
  padding: 0,

  overflow: "hidden",
};

// ============================================================
// FIELD CONTENT
// ============================================================

export const fieldContentStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",

  margin: 0,
  padding: 0,
};

// ============================================================
// END
// ============================================================
