/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN STUDIO™
   REVIEW STUDIO
   VALIDATION CHECKLIST STYLES

   RESPONSIBILITY:
   - Validation Checklist presentation only.
   - Consume FINORA Theme Engine CSS variables.
   - Preserve existing checklist geometry.
   - Preserve existing validation behaviour.
   - No local theme palette.
   - No hardcoded theme colours.
   - No inline-style dependency.

   THEME FLOW:

   ThemeProvider
        ↓
   FINORA Theme Engine
        ↓
   LoanStudio Theme Variable Bridge
        ↓
   ValidationChecklist styles
        ↓
   Active Theme Visuals
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   FINORA THEME TOKENS
=========================================================== */

const THEME = {
  /* ---------------------------------------------------------
     SURFACES
  --------------------------------------------------------- */

  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  /* ---------------------------------------------------------
     BRAND
     ---------------------------------------------------------
     IMPORTANT:
     Pending state intentionally follows the active
     FINORA theme brand accent, NOT semantic warning colour.
  --------------------------------------------------------- */

  brandPrimary: "var(--finora-theme-brand-primary, #2563EB)",

  brandAccent:
    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #2563EB))",

  brandAccentSoft: "var(--finora-theme-brand-accent-soft, rgba(37,99,235,.14))",

  /* ---------------------------------------------------------
     TEXT
  --------------------------------------------------------- */

  textPrimary: "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary: "var(--finora-theme-text-secondary, #CBD5E1)",

  textMuted: "var(--finora-theme-text-muted, #94A3B8)",

  /* ---------------------------------------------------------
     BORDERS
  --------------------------------------------------------- */

  border: "var(--finora-theme-border-default, rgba(148,163,184,.16))",

  borderSubtle: "var(--finora-theme-border-subtle, rgba(148,163,184,.10))",

  borderStrong: "var(--finora-theme-border-strong, rgba(37,99,235,.42))",

  /* ---------------------------------------------------------
     SUCCESS
  --------------------------------------------------------- */

  success: "var(--finora-theme-success, #34D399)",

  successSoft: "var(--finora-theme-success-soft, rgba(16,185,129,.10))",

  successBorder:
    "var(--finora-theme-success-border, var(--finora-theme-border-strong, rgba(16,185,129,.35)))",
} as const;

/* ===========================================================
   CARD WRAPPER
=========================================================== */

export const cardStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
};

/* ===========================================================
   CHECKLIST WRAPPER
=========================================================== */

export const checklistStyle: CSSProperties = {
  margin: 0,

  padding: 0,

  display: "flex",

  flexDirection: "column",

  gap: 0,

  listStyle: "none",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
};

/* ===========================================================
   CHECKLIST ITEM
=========================================================== */

export const itemStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "12px",

  minHeight: "32px",

  padding: "6px 8px",

  boxSizing: "border-box",

  borderBottom: `1px solid ${THEME.borderSubtle}`,

  background: "transparent",

  color: THEME.textPrimary,

  fontSize: "12px",

  fontWeight: 600,

  lineHeight: 1.25,
};

/* ===========================================================
   ITEM CONTENT
=========================================================== */

export const itemContentStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "8px",

  minWidth: 0,
};

/* ===========================================================
   STATUS MARK — COMPLETE
=========================================================== */

export const statusMarkCompleteStyle: CSSProperties = {
  width: "20px",

  height: "20px",

  flexShrink: 0,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  borderRadius: "50%",

  background: THEME.successSoft,

  border: `1px solid ${THEME.successBorder}`,

  color: THEME.success,

  fontSize: "12px",

  fontWeight: 750,

  lineHeight: 1,
};

/* ===========================================================
   STATUS MARK — PENDING
   -----------------------------------------------------------
   IMPORTANT:
   Pending follows ACTIVE THEME ACCENT.
   It does NOT use warning colour.
=========================================================== */

export const statusMarkPendingStyle: CSSProperties = {
  width: "20px",

  height: "20px",

  flexShrink: 0,

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  borderRadius: "50%",

  background: THEME.brandAccentSoft,

  border: `1px solid ${THEME.brandAccent}`,

  color: THEME.brandAccent,

  fontSize: "12px",

  fontWeight: 750,

  lineHeight: 1,
};

/* ===========================================================
   ITEM TEXT
=========================================================== */

export const itemTextStyle: CSSProperties = {
  minWidth: 0,

  color: THEME.textPrimary,

  fontSize: "12px",

  fontWeight: 600,

  lineHeight: 1.25,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",
};

/* ===========================================================
   STATUS TEXT — COMPLETE
=========================================================== */

export const statusTextCompleteStyle: CSSProperties = {
  flexShrink: 0,

  color: THEME.success,

  fontSize: "12px",

  fontWeight: 700,

  lineHeight: 1.25,
};

/* ===========================================================
   STATUS TEXT — PENDING
   -----------------------------------------------------------
   IMPORTANT:
   Pending follows ACTIVE THEME ACCENT.
=========================================================== */

export const statusTextPendingStyle: CSSProperties = {
  flexShrink: 0,

  color: THEME.brandAccent,

  fontSize: "12px",

  fontWeight: 700,

  lineHeight: 1.25,
};

/* ===========================================================
   EMPTY STATE
=========================================================== */

export const emptyStateStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  minHeight: "31px",

  padding: "6px 8px",

  boxSizing: "border-box",

  border: `1px solid ${THEME.border}`,

  borderRadius: "6px",

  background: THEME.surface,

  color: THEME.textMuted,

  fontSize: "12px",

  fontWeight: 500,

  lineHeight: 1.25,
};

/* ===========================================================
   END
=========================================================== */
