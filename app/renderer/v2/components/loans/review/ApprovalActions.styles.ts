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

  // ----------------------------------------------------------
  // BORDER
  // ----------------------------------------------------------

  border: "var(--finora-theme-border-default, rgba(148,163,184,.20))",

  // ----------------------------------------------------------
  // BRAND
  // ----------------------------------------------------------

  primary: "var(--finora-theme-brand-primary, #2563EB)",

  primarySoft: "var(--finora-theme-brand-accent-soft, rgba(37,99,235,.14))",
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

  marginBottom: "9px",

  color: THEME.textPrimary,

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
// END
// ============================================================
