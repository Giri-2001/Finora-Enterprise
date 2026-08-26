/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN STUDIO™
   REVIEW STUDIO
   VALIDATION CHECKLIST STYLES

   RESPONSIBILITY:
   - Validation Checklist presentation only.
   - Consume FINORA Theme Engine CSS variables.
   - Preserve existing checklist geometry.
   - Responsive mobile-safe checklist rows.
   - Preserve existing validation behaviour.
   - No local theme palette.
   - No hardcoded application colours.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   RESPONSIVE STYLE TYPE
=========================================================== */

type ResponsiveCSSProperties = CSSProperties & {
  [key: `@media ${string}`]: CSSProperties;
};

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
   -----------------------------------------------------------
   DEFAULT:
   - One checklist item per row.
   - Existing desktop/tablet geometry preserved.

   MOBILE:
   - Each checklist item remains a single full-width row.
   - Content is allowed to shrink safely.
   - Status remains visible without horizontal overflow.
=========================================================== */

export const itemStyle: ResponsiveCSSProperties = {
  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "12px",

  width: "100%",

  minWidth: 0,

  minHeight: "32px",

  padding: "6px 8px",

  boxSizing: "border-box",

  borderBottom: `1px solid ${THEME.borderSubtle}`,

  background: "transparent",

  color: THEME.textPrimary,

  fontSize: "12px",

  fontWeight: 600,

  lineHeight: 1.25,

  /* ---------------------------------------------------------
     MOBILE
     ---------------------------------------------------------
     Keep exactly one checklist item per row.
  --------------------------------------------------------- */

  "@media (max-width: 767px)": {
    width: "100%",

    minWidth: 0,

    minHeight: "34px",

    padding: "7px 6px",

    gap: "8px",

    alignItems: "center",
  },
};

/* ===========================================================
   ITEM CONTENT
=========================================================== */

export const itemContentStyle: ResponsiveCSSProperties = {
  display: "flex",

  alignItems: "center",

  gap: "8px",

  minWidth: 0,

  flex: "1 1 auto",

  overflow: "hidden",

  /* ---------------------------------------------------------
     MOBILE
  --------------------------------------------------------- */

  "@media (max-width: 767px)": {
    minWidth: 0,

    flex: "1 1 auto",

    gap: "7px",
  },
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

export const itemTextStyle: ResponsiveCSSProperties = {
  minWidth: 0,

  flex: "1 1 auto",

  color: THEME.textPrimary,

  fontSize: "12px",

  fontWeight: 600,

  lineHeight: 1.25,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  /* ---------------------------------------------------------
     MOBILE
  --------------------------------------------------------- */

  "@media (max-width: 767px)": {
    minWidth: 0,

    fontSize: "11.5px",
  },
};

/* ===========================================================
   STATUS TEXT — COMPLETE
=========================================================== */

export const statusTextCompleteStyle: ResponsiveCSSProperties = {
  flexShrink: 0,

  whiteSpace: "nowrap",

  color: THEME.success,

  fontSize: "12px",

  fontWeight: 700,

  lineHeight: 1.25,

  /* ---------------------------------------------------------
     MOBILE
  --------------------------------------------------------- */

  "@media (max-width: 767px)": {
    flexShrink: 0,

    fontSize: "11px",
  },
};

/* ===========================================================
   STATUS TEXT — PENDING
=========================================================== */

export const statusTextPendingStyle: ResponsiveCSSProperties = {
  flexShrink: 0,

  whiteSpace: "nowrap",

  color: THEME.brandAccent,

  fontSize: "12px",

  fontWeight: 700,

  lineHeight: 1.25,

  /* ---------------------------------------------------------
     MOBILE
  --------------------------------------------------------- */

  "@media (max-width: 767px)": {
    flexShrink: 0,

    fontSize: "11px",
  },
};

/* ===========================================================
   EMPTY STATE
=========================================================== */

export const emptyStateStyle: ResponsiveCSSProperties = {
  display: "flex",

  alignItems: "center",

  minHeight: "31px",

  width: "100%",

  boxSizing: "border-box",

  padding: "6px 8px",

  border: `1px solid ${THEME.border}`,

  borderRadius: "6px",

  background: THEME.surface,

  color: THEME.textMuted,

  fontSize: "12px",

  fontWeight: 500,

  lineHeight: 1.25,

  /* ---------------------------------------------------------
     MOBILE
  --------------------------------------------------------- */

  "@media (max-width: 767px)": {
    minWidth: 0,

    minHeight: "32px",

    padding: "6px",
  },
};

/* ===========================================================
   END
=========================================================== */
