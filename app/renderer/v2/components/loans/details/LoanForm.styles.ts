// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN DETAILS STUDIO
// LOAN FORM STYLES
//
// RESPONSIBILITY:
// - LoanForm presentation only
// - Compact enterprise layout
// - Maximum horizontal utilization
// - Reduced vertical footprint
// - Theme-driven visual appearance
//
// RULE:
// - Layout / sizing remains unchanged
// - Responsive behavior remains unchanged
// - Only theme colors are centralized through FINORA theme variables
//
// ============================================================

import type {
  CSSProperties,
} from "react";

// ============================================================
// COLOR TOKENS
//
// FINORA THEME ENGINE
// ============================================================

const COLORS = {
  background:
    "var(--finora-theme-surface)",

  panel:
    "var(--finora-theme-surface)",

  panelSoft:
    "var(--finora-theme-surface-muted)",

  input:
    "var(--finora-theme-surface-muted)",

  border:
    "var(--finora-theme-border-default)",

  primary:
    "var(--finora-theme-brand-primary)",

  text:
    "var(--finora-theme-text-primary)",

  textSecondary:
    "var(--finora-theme-text-secondary)",

  textMuted:
    "var(--finora-theme-text-muted)",

  required:
    "var(--finora-theme-brand-accent)",
};

// ============================================================
// SECTION
// ============================================================

export const sectionStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding: "10px 10px",

  marginBottom: "5px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "9px",

  background:
    `linear-gradient(
      180deg,
      ${COLORS.panel},
      ${COLORS.panelSoft}
    )`,

  boxShadow:
    "0 4px 12px rgba(0, 0, 0, 0.12)",
};

// ============================================================
// SECTION TITLE
// ============================================================

export const sectionTitleStyle:
CSSProperties = {
  marginBottom: "6px",

  color: COLORS.text,

  fontSize: "12px",

  fontWeight: 650,

  lineHeight: 1.3,

  letterSpacing: "0.01em",

  minHeight: "16px",
};

// ============================================================
// FORM GRID
//
// Four columns are intentional.
//
// This keeps the Loan Studio horizontally dense
// and removes unnecessary vertical rows.
// ============================================================

export const formGridStyle:
CSSProperties = {
  display: "grid",

  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",

  gap: "7px 8px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  alignItems: "start",
};

// ============================================================
// FIELD GROUP
// ============================================================

export const fieldGroupStyle:
CSSProperties = {
  display: "flex",

  flexDirection: "column",

  gap: "6px",

  minWidth: 0,

  width: "100%",

  boxSizing: "border-box",
};

// ============================================================
// FIELD LABEL
// ============================================================

export const fieldLabelStyle:
CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "3px",

  minHeight: "14px",

  color:
    COLORS.textSecondary,

  fontSize: "12px",

  fontWeight: 600,

  lineHeight: 1.15,

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};

// ============================================================
// REQUIRED MARK
// ============================================================

export const requiredMarkStyle:
CSSProperties = {
  color: COLORS.required,

  fontSize: "12px",

  fontWeight: 700,
};

// ============================================================
// INPUT
// ============================================================

export const inputStyle:
CSSProperties = {
  width: "100%",

  minWidth: 0,

  height: "32px",

  padding: "0 9px",

  boxSizing: "border-box",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "6px",

  outline: "none",

  background:
    COLORS.input,

  color:
    COLORS.text,

  fontSize: "12px",

  fontWeight: 500,

  lineHeight: "32px",

  transition:
    "border-color 0.16s ease, box-shadow 0.16s ease",
};

// ============================================================
// SELECT
// ============================================================

export const selectStyle:
CSSProperties = {
  ...inputStyle,

  cursor: "pointer",

  appearance: "auto",
};

// ============================================================
// TEXTAREA
// ============================================================

export const textareaStyle:
CSSProperties = {
  width: "100%",

  minWidth: 0,

  height: "40px",

  minHeight: "40px",

  padding: "6px 9px",

  boxSizing: "border-box",

  resize: "none",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "6px",

  outline: "none",

  background:
    COLORS.input,

  color:
    COLORS.text,

  fontSize: "12px",

  fontWeight: 500,

  lineHeight: 1.25,
};

// ============================================================
// DURATION GROUP
// ============================================================

export const durationGroupStyle:
CSSProperties = {
  display: "grid",

  gridTemplateColumns:
    "minmax(0, 1fr) minmax(0, 1fr)",

  alignItems: "center",

  gap: "5px",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
};

// ============================================================
// END
// ============================================================