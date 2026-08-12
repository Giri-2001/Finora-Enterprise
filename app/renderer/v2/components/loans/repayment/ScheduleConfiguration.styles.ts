// ============================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO
// SCHEDULE CONFIGURATION STYLES
//
// RESPONSIBILITY:
// - ScheduleConfiguration presentation only
// - Compact repayment schedule layout
// - FINORA Enterprise dark navy theme
//
// DESIGN:
// - Primary Blue: #2563EB
// - No brown
// - No gold
// - Minimum font-size: 12px
// - Font weights: 500–750
//
// IMPORTANT:
// - No business logic.
// - No calculations.
// - No schedule generation.
// - No persistence.
//
// ============================================================

import type {
  CSSProperties,
} from "react";

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {
  panel: "#111C2E",

  panelSoft: "#142238",

  input: "#0A1425",

  border:
    "rgba(148, 163, 184, 0.20)",

  inputBorder:
    "rgba(148, 163, 184, 0.22)",

  primary: "#2563EB",

  primarySoft:
    "rgba(37, 99, 235, 0.14)",

  text: "#FFFFFF",

  textSecondary:
    "#CBD5E1",

  textMuted:
    "#94A3B8",
};

// ============================================================
// WRAPPER
// ============================================================

export const wrapperStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding: "11px 14px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "10px",

  background:
    `linear-gradient(
      180deg,
      ${COLORS.panel},
      ${COLORS.panelSoft}
    )`,

  boxShadow:
    "0 6px 18px rgba(0, 0, 0, 0.14)",

  overflow: "visible",
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

  color:
    COLORS.text,

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

  background:
    COLORS.primary,

  boxShadow:
    `0 0 10px ${COLORS.primarySoft}`,
};

// ============================================================
// CONTENT
// ============================================================

export const contentStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns:
    "minmax(0, 1fr)",

  gridAutoRows: "auto",

  gap: "0px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  overflow: "visible",
};

// ============================================================
// FIELD
// ============================================================

export const fieldStyle: CSSProperties = {
  minWidth: 0,

  width: "100%",

  boxSizing: "border-box",

  overflow: "visible",
};

// ============================================================
// FIELD CONTENT
// ============================================================

export const fieldContentStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
};

// ============================================================
// FINORA INPUT STYLE
//
// IMPORTANT:
// - Applied only to Repayment Frequency.
// - Global SelectInput is NOT modified.
// ============================================================

export const inputStyle: CSSProperties = {
  width: "100%",

  minHeight: "42px",

  padding: "10px 12px",

  boxSizing: "border-box",

  borderRadius: "8px",

  border:
    `1px solid ${COLORS.inputBorder}`,

  background:
    COLORS.input,

  color:
    COLORS.text,

  fontSize: "12px",

  fontWeight: 600,

  outline: "none",

  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.02)",

  transition:
    "border-color 0.16s ease, box-shadow 0.16s ease",
};

// ============================================================
// END
// ============================================================
