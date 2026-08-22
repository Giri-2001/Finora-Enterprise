/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 2 — BASIC DETAILS

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Unified Basic Information presentation
   - Left Identity form visual-density matching
   - Personal / Occupation / Family field orchestration
   - No local breakpoints
   - No viewport detection
   - No business logic
   - Fill the complete available Step 2 height
   - Keep the final field aligned with the bottom of the form
   - Match Step 1 Identity header typography and spacing
   - Consume typography and spacing from Responsive Engine
   - Consume ALL visual colours from FINORA Theme Engine

   THEME CONTRACT:

   ThemeProvider
        ↓
   FinoraTheme
        ↓
   Step2Basic theme CSS variables
        ↓
   Step2Basic styles
        ↓
   BasicForm / OccupationCard / FamilyDetails
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  ResponsiveTokens,
} from "../../../../utils/responsive";


import type {
  FinoraTheme,
} from "../../../../themes/core/types";


/* ===========================================================
   THEME VARIABLES
=========================================================== */

/*
 * IMPORTANT:
 *
 * Step2Basic does NOT own a local colour palette.
 *
 * These are semantic CSS-variable references only.
 *
 * The actual values are injected by Step2Basic.tsx from the
 * central FINORA ThemeProvider.
 */

const THEME = {

  /* ---------------------------------------------------------
     SURFACES
  --------------------------------------------------------- */

  surface:
    "var(--finora-theme-surface, #FFFFFF)",

  surfaceMuted:
    "var(--finora-theme-surface-muted, #F1F3F6)",

  surfaceStrong:
    "var(--finora-theme-surface-strong, #E7EAF0)",


  /* ---------------------------------------------------------
     BRAND
  --------------------------------------------------------- */

  brandPrimary:
    "var(--finora-theme-brand-primary, #B8860B)",

  brandSecondary:
    "var(--finora-theme-brand-secondary, #8C6A00)",

  brandAccent:
    "var(--finora-theme-brand-accent, #D4AF37)",

  brandAccentSoft:
    "var(--finora-theme-brand-accent-soft, #D4AF37)",


  /* ---------------------------------------------------------
     TEXT
  --------------------------------------------------------- */

  textPrimary:
    "var(--finora-theme-text-primary, #171A21)",

  textSecondary:
    "var(--finora-theme-text-secondary, #4B5563)",

  textMuted:
    "var(--finora-theme-text-muted, #7A8494)",

  textInverse:
    "var(--finora-theme-text-inverse, #FFFFFF)",


  /* ---------------------------------------------------------
     BORDERS
  --------------------------------------------------------- */

  border:
    "var(--finora-theme-border-default, #D9DEE7)",

  borderStrong:
    "var(--finora-theme-border-strong, #B8C0CC)",

  borderSubtle:
    "var(--finora-theme-border-subtle, #E8EBF0)",


  /* ---------------------------------------------------------
     EFFECTS
  --------------------------------------------------------- */

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(15,23,42,.14))",

} as const;


/* ===========================================================
   THEME VARIABLE TYPE
=========================================================== */

export type Step2ThemeStyle =
  CSSProperties &
  Record<
    `--${string}`,
    string
  >;


/* ===========================================================
   THEME VARIABLE FACTORY
=========================================================== */

/*
 * IMPORTANT:
 *
 * This function contains NO theme palette.
 *
 * It only maps the selected FinoraTheme semantic values into
 * the CSS-variable contract consumed by Step2Basic and its
 * child forms.
 *
 * Visual appearance remains owned by ThemeProvider.
 */

export function createStep2ThemeVariables(
  theme:
    FinoraTheme,
):
  Step2ThemeStyle {

  return {

    "--finora-theme-brand-primary":
      theme.colors.brand.primary,

    "--finora-theme-brand-secondary":
      theme.colors.brand.secondary,

    "--finora-theme-brand-accent":
      theme.colors.brand.accent,

    "--finora-theme-brand-accent-soft":
      theme.colors.brand.accentSoft,


    "--finora-theme-surface":
      theme.colors.background.surface,

    "--finora-theme-background-surface":
      theme.colors.background.surface,

    "--finora-theme-surface-muted":
      theme.colors.background.surfaceMuted,

    "--finora-theme-background-surface-muted":
      theme.colors.background.surfaceMuted,


    "--finora-theme-text-primary":
      theme.colors.text.primary,

    "--finora-theme-text-secondary":
      theme.colors.text.secondary,

    "--finora-theme-text-body":
      theme.colors.text.secondary,

    "--finora-theme-text-muted":
      theme.colors.text.muted,

    "--finora-theme-text-inverse":
      theme.colors.text.inverse,


    "--finora-theme-border-default":
      theme.colors.border.default,

    "--finora-theme-border-strong":
      theme.colors.border.strong,

    "--finora-theme-border-subtle":
      theme.colors.border.subtle,


    "--finora-theme-overlay-shadow":
      theme.colors.overlay.shadow,

  };

}


/* ===========================================================
   PAGE
=========================================================== */

export const pageStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  boxSizing:
    "border-box",

  padding:
    "0",

};


/* ===========================================================
   UNIFIED FORM
=========================================================== */

export const formStyle:
  CSSProperties = {

  width:
    "100%",

  height:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  boxSizing:
    "border-box",

  padding:
    "18px 20px",

  margin:
    0,

  borderRadius:
    "16px",

  border:
    "var(--finora-theme-border-width, 1.5px) solid var(--finora-theme-border-default)",

  background:
  `linear-gradient(
    145deg,
    ${THEME.surfaceMuted},
    ${THEME.surface}
  )`,

  boxShadow:
  "0 10px 28px rgba(0,0,0,.12)",

  overflow:
  "hidden",

clipPath:
  "inset(0 round var(--finora-theme-radius-card, 17px))",
};


/* ===========================================================
   FORM HEADER
===========================================================

   IMPORTANT:

   Step 1 Identity header uses:

     marginBottom = spacing.medium
     paddingBottom = spacing.medium
     borderBottom = border.width

   Step 2 uses the same geometry.

=========================================================== */

export function createStep2BasicHeaderStyles(
  tokens:
    ResponsiveTokens,
): {

  formHeaderStyle:
    CSSProperties;

  formTitleStyle:
    CSSProperties;

  formSubtitleStyle:
    CSSProperties;

  formDividerStyle:
    CSSProperties;

} {

  const spacing =
    tokens.spacing;

  const border =
    tokens.border;


  /* =========================================================
     FORM HEADER
  ========================================================= */

  const formHeaderStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    flexShrink:
      0,

    margin:
      0,

    marginBottom:
      spacing.medium,

    paddingBottom:
      spacing.medium,

    borderBottom:
      `${border.width}px solid ${THEME.borderSubtle}`,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     FORM TITLE
  ========================================================= */

  const formTitleStyle:
    CSSProperties = {

    margin:
      0,

    padding:
      0,

    color:
      THEME.textPrimary,

    fontSize:
      `${tokens.typography.heading - 3}px`,

    fontWeight:
      600,

    lineHeight:
      tokens.lineHeight.heading,

    letterSpacing:
      ".1px",

    fontFamily:
      "Georgia, 'Times New Roman', serif",

  };


  /* =========================================================
     FORM SUBTITLE
  ========================================================= */

  const formSubtitleStyle:
    CSSProperties = {

    margin:
      `${spacing.small}px 0 0`,

    padding:
      0,

    color:
      THEME.textSecondary,

    fontSize:
      `${tokens.typography.body - 1}px`,

    lineHeight:
      tokens.lineHeight.body,

    fontWeight:
      500,

    fontFamily:
      "Georgia, 'Times New Roman', serif",

  };


  /* =========================================================
     FORM DIVIDER
  ========================================================= */

  const formDividerStyle:
    CSSProperties = {

    flexShrink:
      0,

    width:
      "100%",

    height:
      "0",

    boxSizing:
      "border-box",

    margin:
      0,

    padding:
      0,

    background:
      "transparent",

    border:
      "none",

  };


  return {

    formHeaderStyle,

    formTitleStyle,

    formSubtitleStyle,

    formDividerStyle,

  };

}


/* ===========================================================
   DEFAULT HEADER STYLES
=========================================================== */

export const formHeaderStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  flexShrink:
    0,

  margin:
    0,

  boxSizing:
    "border-box",

};


export const formTitleStyle:
  CSSProperties = {

  margin:
    0,

  padding:
    0,

};


export const formSubtitleStyle:
  CSSProperties = {

  margin:
    0,

  padding:
    0,

};


export const formDividerStyle:
  CSSProperties = {

  width:
    "100%",

  height:
    "0",

  margin:
    0,

  padding:
    0,

  border:
    "none",

  background:
    "transparent",

};


/* ===========================================================
   FORM HEADER ICON
=========================================================== */

export const formHeaderIconStyle:
  CSSProperties = {

  width:
    "38px",

  height:
    "38px",

  minWidth:
    "38px",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  flexShrink:
    0,

  boxSizing:
    "border-box",

  borderRadius:
    "50%",

  border:
    `1px solid ${THEME.brandAccent}`,

  background:
    THEME.surfaceMuted,

  color:
    THEME.brandAccent,

  fontSize:
    "14px",

  fontWeight:
    600,

  lineHeight:
    1,

};


/* ===========================================================
   FORM HEADER CONTENT
=========================================================== */

export const formHeaderContentStyle:
  CSSProperties = {

  flex:
    "none",

  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  justifyContent:
    "center",

  boxSizing:
    "border-box",

  padding:
    0,

  margin:
    0,

};


/* ===========================================================
   CONTENT
=========================================================== */

export const contentStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  flex:
    1,

  display:
    "flex",

  flexDirection:
    "column",

  boxSizing:
    "border-box",

  padding:
    0,

  margin:
    0,

  gap:
    "8px",

  overflow:
    "visible",

};


/* ===========================================================
   GROUP
=========================================================== */

export const groupStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  flexShrink:
    0,

  display:
    "block",

  boxSizing:
    "border-box",

  padding:
    0,

  margin:
    0,

  border:
    "none",

  background:
    "transparent",

  boxShadow:
    "none",

};


/* ===========================================================
   GROUP HEADER
=========================================================== */

export const groupHeaderStyle:
  CSSProperties = {

  display:
    "none",

};


/* ===========================================================
   GROUP TITLE
=========================================================== */

export const groupTitleStyle:
  CSSProperties = {

  display:
    "none",

};


/* ===========================================================
   GROUP SUBTITLE
=========================================================== */

export const groupSubtitleStyle:
  CSSProperties = {

  display:
    "none",

};


/* ===========================================================
   GROUP CONTENT
=========================================================== */

export const groupContentStyle:
  CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  display:
    "block",

  boxSizing:
    "border-box",

  padding:
    0,

  margin:
    0,

  overflow:
    "visible",

};


/* ===========================================================
   END
=========================================================== */