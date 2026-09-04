// ============================================================
// FINORA ENTERPRISE OS™
//
// REVIEW STUDIO
// APPROVAL ACTIONS STYLES
//
// RESPONSIBILITY:
// - ApprovalActions presentation only
// - Enterprise approval action layout
// - Consume FINORA Theme Engine CSS variables
// - Preserve existing geometry
// - No local theme palette
// - No hardcoded theme colours
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// FINORA THEME TOKENS
// ============================================================

const THEME = {
  // ----------------------------------------------------------
  // SURFACES
  // ----------------------------------------------------------

  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  // ----------------------------------------------------------
  // TEXT
  // ----------------------------------------------------------

  textPrimary: "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  textInverse:
    "var(--finora-theme-text-inverse, #FFFFFF)",

  // ----------------------------------------------------------
  // BORDER
  // ----------------------------------------------------------

  border: "var(--finora-theme-border-default, rgba(148,163,184,.20))",

  // ----------------------------------------------------------
  // BRAND
  // ----------------------------------------------------------

  primary: "var(--finora-theme-brand-primary, #2563EB)",

  primarySoft: "var(--finora-theme-brand-accent-soft, rgba(37,99,235,.14))",

  danger:
    "var(--finora-theme-status-danger, #DC2626)",

  overlay:
    "var(--finora-theme-overlay, rgba(0,0,0,.68))",
} as const;

// ============================================================
// WRAPPER
// ============================================================

export const wrapperStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  padding: "11px 14px",

  border: `1px solid ${THEME.border}`,

  borderRadius: "10px",

  background: `
    linear-gradient(
      180deg,
      ${THEME.surface},
      ${THEME.surfaceMuted}
    )
  `,

  boxShadow: "var(--finora-theme-overlay-shadow, 0 6px 18px rgba(0,0,0,.14))",
};

// ============================================================
// HEADER
// ============================================================

export const headerStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "8px",

  minHeight: "18px",

  marginBottom: "15px",

  color: THEME.textPrimary,

  fontSize: "17px",

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

  background: THEME.primary,

  boxShadow: `0 0 10px ${THEME.primarySoft}`,
};

// ============================================================
// ACTION ROW
// ============================================================

export const actionRowStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "8px",

  flexWrap: "wrap",

  width: "100%",

  minWidth: 0,
};

// ============================================================
// ACTION BUTTON WRAPPER
// ============================================================

export const actionButtonStyle: CSSProperties = {
  minWidth: "110px",
};

// ============================================================
// REJECTION DIALOG
// ============================================================

export const dialogBackdropStyle: CSSProperties = {
  position: "fixed",

  inset: 0,

  zIndex: 1600,

  padding: "20px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  boxSizing: "border-box",

  background: THEME.overlay,
};

export const dialogPanelStyle: CSSProperties = {
  width: "min(100%, 520px)",

  padding: "20px",

  display: "flex",

  flexDirection: "column",

  gap: "13px",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "14px",

  background: THEME.surface,

  color: THEME.textPrimary,

  boxShadow:
    "var(--finora-theme-overlay-shadow, 0 18px 48px rgba(0,0,0,.28))",

  fontFamily:
    "Inter, ui-sans-serif, system-ui, sans-serif",
};

export const dialogHeaderStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "10px",
};

export const dialogTitleStyle: CSSProperties = {
  margin: 0,

  color: THEME.textPrimary,

  fontSize: "19px",

  lineHeight: 1.3,

  fontWeight: 750,
};

export const dialogDescriptionStyle: CSSProperties = {
  margin: 0,

  color: THEME.textSecondary,

  fontSize: "13px",

  lineHeight: 1.5,

  fontWeight: 550,
};

export const dialogTextareaStyle: CSSProperties = {
  width: "100%",

  minHeight: "104px",

  padding: "11px 12px",

  boxSizing: "border-box",

  resize: "vertical",

  border: `1px solid ${THEME.border}`,

  borderRadius: "8px",

  outline: "none",

  background: THEME.surfaceMuted,

  color: THEME.textPrimary,

  fontFamily:
    "Inter, ui-sans-serif, system-ui, sans-serif",

  fontSize: "14px",

  lineHeight: 1.5,

  fontWeight: 600,
};

export const dialogErrorStyle: CSSProperties = {
  color: THEME.danger,

  fontSize: "12px",

  lineHeight: 1.4,

  fontWeight: 650,
};

export const dialogActionsStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "flex-end",

  gap: "9px",

  flexWrap: "wrap",
};

const dialogButtonBaseStyle: CSSProperties = {
  minHeight: "40px",

  padding: "0 15px",

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  borderRadius: "8px",

  fontFamily:
    "Inter, ui-sans-serif, system-ui, sans-serif",

  fontSize: "13px",

  lineHeight: 1.35,

  fontWeight: 700,

  whiteSpace: "nowrap",
};

export const cancelButtonStyle: CSSProperties = {
  ...dialogButtonBaseStyle,

  border: `1px solid ${THEME.border}`,

  background: THEME.surfaceMuted,

  color: THEME.textSecondary,

  cursor: "pointer",
};

export const rejectConfirmButtonStyle: CSSProperties = {
  ...dialogButtonBaseStyle,

  border: `1px solid ${THEME.danger}`,

  background: THEME.danger,

  color: THEME.textInverse,

  cursor: "pointer",
};

// ============================================================// END
// ============================================================
