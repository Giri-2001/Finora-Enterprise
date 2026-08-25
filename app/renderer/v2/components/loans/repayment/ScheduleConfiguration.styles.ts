// ============================================================
// FINORA ENTERPRISE V2
//
// REPAYMENT STUDIO
// SCHEDULE CONFIGURATION STYLES
//
// RESPONSIBILITY:
// - ScheduleConfiguration presentation only
// - Compact repayment schedule layout
// - FINORA Theme Engine connected
//
// IMPORTANT:
// - No business logic.
// - No calculations.
// - No schedule generation.
// - No persistence.
// - Layout / dimensions unchanged.
// ============================================================

import type {
  CSSProperties,
} from "react";

// ============================================================
// THEME TOKENS
// ============================================================

const THEME = {
  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  input:
    "var(--finora-theme-surface-strong, #0A1425)",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.20))",

  inputBorder:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.22))",

  primary:
    "var(--finora-theme-brand-primary, #2563EB)",

  primarySoft:
    "var(--finora-theme-brand-accent-soft, rgba(37, 99, 235, 0.14))",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted:
    "var(--finora-theme-text-muted, #94A3B8)",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.14))",
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
    `1px solid ${THEME.border}`,

  borderRadius: "10px",

  background:
    `linear-gradient(
      180deg,
      ${THEME.panel},
      ${THEME.panelSoft}
    )`,

  boxShadow:
    `0 6px 18px ${THEME.shadow}`,

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
    THEME.text,

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
    THEME.primary,

  boxShadow:
    `0 0 10px ${THEME.primarySoft}`,
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
    `1px solid ${THEME.inputBorder}`,

  background:
    THEME.input,

  color:
    THEME.text,

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