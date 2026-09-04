// ============================================================
// FINORA ENTERPRISE OS™
//
// REJECTED LOAN APPLICATIONS PAGE STYLES
//
// RESPONSIBILITY:
// - Rejected application list presentation.
// - Rejected application detail presentation.
// - Document archive presentation.
// - Consume FINORA Theme Engine CSS variables.
//
// IMPORTANT:
// - No business logic.
// - No persistence logic.
// - No local application colour palette.
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// THEME VARIABLES
// ============================================================

const THEME = {
  page:
    "var(--finora-theme-page, var(--finora-theme-background-page, var(--finora-theme-surface)))",

  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted))",

  brand:
    "var(--finora-theme-brand-primary)",

  brandSoft:
    "var(--finora-theme-brand-accent-soft, var(--finora-theme-surface-muted))",

  textPrimary:
    "var(--finora-theme-text-primary)",

  textSecondary:
    "var(--finora-theme-text-secondary)",

  textMuted:
    "var(--finora-theme-text-muted)",

  textInverse:
    "var(--finora-theme-text-inverse)",

  border:
    "var(--finora-theme-border-default)",

  borderStrong:
    "var(--finora-theme-border-strong)",

  danger:
    "var(--finora-theme-status-danger)",

  dangerSoft:
    "var(--finora-theme-status-danger-soft, var(--finora-theme-surface-muted))",

  success:
    "var(--finora-theme-status-success)",

  successSoft:
    "var(--finora-theme-status-success-soft, var(--finora-theme-surface-muted))",
} as const;

// ============================================================
// PAGE
// ============================================================

export const pageStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  minHeight: "100%",

  padding: "20px",

  display: "flex",

  flexDirection: "column",

  gap: "14px",

  boxSizing: "border-box",

  background: THEME.page,

  color: THEME.textPrimary,

  fontFamily:
    "Inter, ui-sans-serif, system-ui, sans-serif",
};

// ============================================================
// HEADER
// ============================================================

export const headerStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  padding: "18px 20px",

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "14px",

  flexWrap: "wrap",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "14px",

  background: THEME.surface,
};

export const headingGroupStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  gap: "4px",
};

export const titleStyle: CSSProperties = {
  margin: 0,

  color: THEME.textPrimary,

  fontSize: "22px",

  lineHeight: 1.25,

  fontWeight: 750,
};

export const subtitleStyle: CSSProperties = {
  margin: 0,

  color: THEME.textMuted,

  fontSize: "13px",

  lineHeight: 1.4,

  fontWeight: 550,
};

// ============================================================
// BUTTONS
// ============================================================

const buttonBaseStyle: CSSProperties = {
  minHeight: "38px",

  padding: "0 14px",

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  gap: "7px",

  borderRadius: "8px",

  fontFamily:
    "Inter, ui-sans-serif, system-ui, sans-serif",

  fontSize: "13px",

  lineHeight: 1.35,

  fontWeight: 700,

  cursor: "pointer",

  whiteSpace: "nowrap",
};

export const backButtonStyle: CSSProperties = {
  ...buttonBaseStyle,

  border: `1px solid ${THEME.borderStrong}`,

  background: THEME.surfaceMuted,

  color: THEME.textSecondary,
};

export const refreshButtonStyle: CSSProperties = {
  ...buttonBaseStyle,

  border: `1px solid ${THEME.border}`,

  background: THEME.surfaceMuted,

  color: THEME.textSecondary,
};

export const viewButtonStyle: CSSProperties = {
  ...buttonBaseStyle,

  minHeight: "34px",

  padding: "0 12px",

  border: `1px solid ${THEME.borderStrong}`,

  background: THEME.brandSoft,

  color: THEME.brand,
};

export const reopenButtonStyle: CSSProperties = {
  ...buttonBaseStyle,

  minHeight: "34px",

  padding: "0 12px",

  border: `1px solid ${THEME.brand}`,

  background: THEME.brand,

  color: THEME.textInverse,
};

export const closeButtonStyle: CSSProperties = {
  ...buttonBaseStyle,

  minWidth: "38px",

  padding: 0,

  border: `1px solid ${THEME.border}`,

  background: THEME.surfaceMuted,

  color: THEME.textPrimary,

  fontSize: "20px",
};

// ============================================================
// SUMMARY
// ============================================================

export const summaryGridStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",

  gap: "10px",
};

export const summaryCardStyle: CSSProperties = {
  minWidth: 0,

  padding: "14px 16px",

  display: "flex",

  flexDirection: "column",

  gap: "5px",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "12px",

  background: THEME.surface,
};

export const summaryLabelStyle: CSSProperties = {
  color: THEME.textMuted,

  fontSize: "12px",

  fontWeight: 600,
};

export const summaryValueStyle: CSSProperties = {
  color: THEME.textPrimary,

  fontSize: "20px",

  lineHeight: 1.25,

  fontWeight: 750,
};

// ============================================================
// FILTER BAR
// ============================================================

export const filterBarStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  padding: "12px",

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "10px",

  flexWrap: "wrap",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "12px",

  background: THEME.surface,
};

export const searchInputStyle: CSSProperties = {
  width: "min(100%, 420px)",

  minHeight: "40px",

  padding: "0 13px",

  boxSizing: "border-box",

  border: `1px solid ${THEME.borderStrong}`,

  borderRadius: "8px",

  outline: "none",

  background: THEME.surfaceMuted,

  color: THEME.textPrimary,

  fontFamily:
    "Inter, ui-sans-serif, system-ui, sans-serif",

  fontSize: "14px",

  lineHeight: 1.4,

  fontWeight: 600,
};

export const countStyle: CSSProperties = {
  color: THEME.textMuted,

  fontSize: "12px",

  fontWeight: 650,
};

// ============================================================
// APPLICATION CARDS
// ============================================================

export const applicationGridStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",

  gap: "12px",
};

export const applicationCardStyle: CSSProperties = {
  minWidth: 0,

  padding: "16px",

  display: "flex",

  flexDirection: "column",

  gap: "13px",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "14px",

  background: THEME.surface,
};

export const cardHeaderStyle: CSSProperties = {
  minWidth: 0,

  display: "flex",

  alignItems: "flex-start",

  justifyContent: "space-between",

  gap: "10px",
};

export const referenceStyle: CSSProperties = {
  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  color: THEME.textPrimary,

  fontSize: "15px",

  lineHeight: 1.35,

  fontWeight: 750,
};

export function statusBadgeStyle(
  status: "REJECTED" | "REOPENED",
): CSSProperties {
  const reopened =
    status === "REOPENED";

  return {
    flexShrink: 0,

    padding: "5px 9px",

    border:
      `1px solid ${reopened ? THEME.success : THEME.danger}`,

    borderRadius: "999px",

    background:
      reopened ? THEME.successSoft : THEME.dangerSoft,

    color:
      reopened ? THEME.success : THEME.danger,

    fontSize: "10px",

    fontWeight: 750,

    letterSpacing: "0.04em",
  };
}

export const customerStyle: CSSProperties = {
  color: THEME.textPrimary,

  fontSize: "14px",

  lineHeight: 1.4,

  fontWeight: 700,
};

export const phoneStyle: CSSProperties = {
  color: THEME.textMuted,

  fontSize: "12px",

  lineHeight: 1.4,

  fontWeight: 550,
};

export const metaGridStyle: CSSProperties = {
  minWidth: 0,

  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(135px, 1fr))",

  gap: "8px",
};

export const metaItemStyle: CSSProperties = {
  minWidth: 0,

  padding: "9px 10px",

  display: "flex",

  flexDirection: "column",

  gap: "3px",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "8px",

  background: THEME.surfaceMuted,
};

export const metaLabelStyle: CSSProperties = {
  color: THEME.textMuted,

  fontSize: "10px",

  fontWeight: 600,

  textTransform: "uppercase",

  letterSpacing: "0.04em",
};

export const metaValueStyle: CSSProperties = {
  minWidth: 0,

  overflowWrap: "anywhere",

  color: THEME.textPrimary,

  fontSize: "13px",

  lineHeight: 1.4,

  fontWeight: 650,
};

export const reasonStyle: CSSProperties = {
  padding: "10px 11px",

  borderLeft: `3px solid ${THEME.danger}`,

  borderRadius: "0 8px 8px 0",

  background: THEME.surfaceMuted,

  color: THEME.textSecondary,

  fontSize: "12px",

  lineHeight: 1.5,

  fontWeight: 550,

  overflowWrap: "anywhere",
};

export const cardActionsStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "flex-end",

  gap: "8px",

  flexWrap: "wrap",
};

// ============================================================
// EMPTY / LOADING / ERROR
// ============================================================

export const stateStyle: CSSProperties = {
  width: "100%",

  minHeight: "190px",

  padding: "24px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "14px",

  background: THEME.surface,

  color: THEME.textMuted,

  fontSize: "14px",

  lineHeight: 1.5,

  fontWeight: 600,

  textAlign: "center",
};

export const errorStyle: CSSProperties = {
  ...stateStyle,

  minHeight: "80px",

  border: `1px solid ${THEME.danger}`,

  color: THEME.danger,
};

// ============================================================
// DETAIL DIALOG
// ============================================================

export const detailBackdropStyle: CSSProperties = {
  position: "fixed",

  inset: 0,

  zIndex: 1300,

  padding: "20px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  boxSizing: "border-box",

  background:
    "var(--finora-theme-overlay, rgba(0, 0, 0, 0.68))",
};

export const detailPanelStyle: CSSProperties = {
  width: "min(100%, 960px)",

  maxHeight: "calc(100vh - 40px)",

  overflowY: "auto",

  padding: "18px",

  display: "flex",

  flexDirection: "column",

  gap: "14px",

  boxSizing: "border-box",

  border: `1px solid ${THEME.borderStrong}`,

  borderRadius: "16px",

  background: THEME.surface,

  color: THEME.textPrimary,

  fontFamily:
    "Inter, ui-sans-serif, system-ui, sans-serif",
};

export const detailHeaderStyle: CSSProperties = {
  display: "flex",

  alignItems: "flex-start",

  justifyContent: "space-between",

  gap: "12px",
};

export const detailTitleStyle: CSSProperties = {
  margin: 0,

  color: THEME.textPrimary,

  fontSize: "19px",

  lineHeight: 1.3,

  fontWeight: 750,
};

export const detailSectionStyle: CSSProperties = {
  minWidth: 0,

  padding: "13px",

  display: "flex",

  flexDirection: "column",

  gap: "10px",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "10px",

  background: THEME.surfaceMuted,
};

export const detailSectionTitleStyle: CSSProperties = {
  margin: 0,

  color: THEME.textPrimary,

  fontSize: "14px",

  lineHeight: 1.35,

  fontWeight: 750,
};

// ============================================================
// DOCUMENTS
// ============================================================

export const documentGridStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",

  gap: "8px",
};

export const documentButtonStyle: CSSProperties = {
  minWidth: 0,

  minHeight: "42px",

  padding: "9px 11px",

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "8px",

  border: `1px solid ${THEME.borderStrong}`,

  borderRadius: "8px",

  background: THEME.surface,

  color: THEME.textPrimary,

  fontFamily:
    "Inter, ui-sans-serif, system-ui, sans-serif",

  fontSize: "12px",

  lineHeight: 1.4,

  fontWeight: 650,

  textAlign: "left",

  cursor: "pointer",
};

export const documentNameStyle: CSSProperties = {
  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",
};

// ============================================================
// END
// ============================================================
