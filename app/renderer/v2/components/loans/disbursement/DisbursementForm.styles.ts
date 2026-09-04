/* ===========================================================
   FINORA ENTERPRISE OS™
   LOAN STUDIO™
   DISBURSEMENT STUDIO
   DISBURSEMENT FORM STYLES

   RESPONSIBILITY:
   - Disbursement form presentation only.
   - Consume FINORA Theme Engine CSS variables.
   - Preserve existing form geometry.
   - Preserve date / amount input behaviour.
   - No local theme palette.
   - No hardcoded theme colours.
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
     INPUT SURFACES
  --------------------------------------------------------- */

  inputBackground:
    "var(--finora-theme-input-background, var(--finora-theme-surface, transparent))",

  inputBackgroundMuted:
    "var(--finora-theme-input-background-muted, var(--finora-theme-surface-muted, transparent))",

  /* ---------------------------------------------------------
     TEXT
  --------------------------------------------------------- */

  textPrimary: "var(--finora-theme-text-primary, #FFFFFF)",

  /* ---------------------------------------------------------
     BORDERS
  --------------------------------------------------------- */

  border: "var(--finora-theme-border-default, rgba(148,163,184,.16))",

  borderStrong: "var(--finora-theme-border-strong, rgba(37,99,235,.42))",

  /* ---------------------------------------------------------
     BRAND
  --------------------------------------------------------- */

  primary: "var(--finora-theme-brand-primary, #2563EB)",
} as const;

/* ===========================================================
   FORM WRAPPER
=========================================================== */

export const disbursementFormStyle: CSSProperties = {
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
};

/* ===========================================================
   FIELDS GRID
=========================================================== */

export const fieldsGridStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  display: "grid",

  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",

  gap: "10px",

  alignItems: "start",

  boxSizing: "border-box",
};

/* ===========================================================
   FIELD
=========================================================== */

export const fieldStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
};

/* ===========================================================
   FORM LABEL TEXT
=========================================================== */

export const formLabelTextStyle: CSSProperties = {
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontSize: "15px",
  fontWeight: 600,
};

/* ===========================================================
   INPUT WRAPPER
=========================================================== */

export const inputWrapperStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",
};

/* ===========================================================
   DATE INPUT
=========================================================== */

export const dateInputStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  /*
    Allow the active FINORA theme to control
    the native date input appearance.
  */
  colorScheme: "inherit",

  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",

  fontSize: "15px",

  fontWeight: 650,

  lineHeight: 1.4,

  color: THEME.textPrimary,

  background: THEME.inputBackground,

  border: `1px solid ${THEME.border}`,

  borderRadius: "7px",

  outline: "none",

  minHeight: "36px",

  padding: "8px 36px 8px 12px",

  accentColor: THEME.primary,

  transition: "border-color 140ms ease, box-shadow 140ms ease",
};

/* ===========================================================
   AMOUNT INPUT
=========================================================== */

export const amountInputStyle: CSSProperties = {
  ...dateInputStyle,

  color: THEME.textPrimary,

  background: THEME.inputBackgroundMuted,

  border: `1px solid ${THEME.borderStrong}`,

  fontWeight: 650,

  cursor: "default",

  /*
    Keep the calculated readonly amount visually stable
    while allowing the active theme to control its colors.
  */
  opacity: 1,
};

/* ===========================================================
   END
=========================================================== */
