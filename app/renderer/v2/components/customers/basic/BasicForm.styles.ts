/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER BASIC FORM
   PRESENTATION STYLES

   Version : 3.0
   Status  : Production

   RESPONSIBILITY:

   - Match Step 1 / Customer Identity form visual sizing
   - Two-column field layout
   - No unnecessary outer spacing
   - Responsive values consumed only from Responsive Engine
   - FINORA Theme Engine controls all visual colours
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  BasicFormResponsiveTokens,
} from "../../../utils/responsive/customers/basicform";


/* ===========================================================
   THEME CONTRACT

   ThemeProvider
        ↓
   FINORA Theme CSS Variables
        ↓
   BasicForm presentation

   IMPORTANT:

   - No local theme palette
   - No hard-coded theme colours in presentation
   - Responsive geometry remains untouched
   - Visual colours follow the active FINORA theme
=========================================================== */

const THEME = {

  /* ---------------------------------------------------------
     SURFACES
  --------------------------------------------------------- */

  surface:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #151820))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #1D212B))",

  surfaceStrong:
    "var(--finora-theme-surface-strong, var(--finora-theme-surface-muted, #20242D))",


  /* ---------------------------------------------------------
     BRAND
  --------------------------------------------------------- */

  brandPrimary:
    "var(--finora-theme-brand-primary, #D7B56A)",

  brandSecondary:
    "var(--finora-theme-brand-secondary, var(--finora-theme-brand-primary, #B8860B))",

  brandAccent:
    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D7B56A))",

  brandAccentSoft:
    "var(--finora-theme-brand-accent-soft, var(--finora-theme-brand-primary, #D7B56A))",


  /* ---------------------------------------------------------
     TEXT
  --------------------------------------------------------- */

  textPrimary:
    "var(--finora-theme-text-primary, #F5F2EA)",

  textSecondary:
    "var(--finora-theme-text-secondary, #B9B5AC)",

  textMuted:
    "var(--finora-theme-text-muted, #77756F)",

  textInverse:
    "var(--finora-theme-text-inverse, #FFFFFF)",


  /* ---------------------------------------------------------
     BORDERS
  --------------------------------------------------------- */

  border:
    "var(--finora-theme-border-default, #30343E)",

  borderStrong:
    "var(--finora-theme-border-strong, #474C58)",

  borderSubtle:
    "var(--finora-theme-border-subtle, #252932)",


  /* ---------------------------------------------------------
     EFFECTS
  --------------------------------------------------------- */

  overlay:
    "var(--finora-theme-overlay-shadow, rgba(0,0,0,.48))",

} as const;


/* ===========================================================
   ROOT
=========================================================== */

export function createBasicFormRootStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    margin:
      0,

    padding:
      `0 0 ${tokens.basicFieldGap * 2.5}px`,

    boxSizing:
      "border-box",

    display:
      "block",

  };

}


/* ===========================================================
   FIELD GRID

   PERSONAL INFORMATION

   Father / Spouse Name | Education
   Marital Status       | Spouse Name

   IMPORTANT:
   - Full available width
   - Exactly 2 equal columns
   - Every field stretches to its complete grid track
   - No shrink-to-content
   - No fixed field width
=========================================================== */

export function createBasicFormFieldGridStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    maxWidth:
      "100%",

    margin:
      0,

    padding:
      0,

    display:
      "grid",

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    columnGap:
      `${tokens.columnGap}px`,

    rowGap:
      `${tokens.basicFieldGap}px`,

    boxSizing:
      "border-box",

    alignItems:
      "start",

    justifyContent:
      "stretch",

    justifyItems:
      "stretch",

  };

}


/* ===========================================================
   FIELD
=========================================================== */

export function createBasicFormFieldStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    maxWidth:
      "100%",

    margin:
      0,

    padding:
      0,

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${tokens.basicFieldGap}px`,

    boxSizing:
      "border-box",

    alignSelf:
      "stretch",

  };

}


/* ===========================================================
   LABEL

   Matches the Customer Identity / Step 1 labels.
=========================================================== */

export function createBasicFormLabelStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    display:
      "flex",

    alignItems:
      "center",

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      `${tokens.labelMinHeight}px`,

    margin:
      0,

    padding:
      0,

    color:
      THEME.textSecondary,

    fontFamily:
      "var(--finora-theme-font-family, Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif)",

    fontSize:
      `${tokens.labelFontSize}px`,

    fontWeight:
      tokens.labelFontWeight,

    letterSpacing:
      `${tokens.labelLetterSpacing}px`,

    lineHeight:
      1.2,

    textTransform:
      "uppercase",

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   REQUIRED
=========================================================== */

export function createBasicFormRequiredStyle():
  CSSProperties {

  return {

    marginLeft:
      "2px",

    padding:
      0,

    color:
      THEME.brandAccent,

    fontWeight:
      800,

  };

}


/* ===========================================================
   INPUT

   IMPORTANT:

   The input now follows the same semantic theme contract
   used by Customer Identity:

   - background  → surfaceMuted
   - text        → textPrimary
   - border      → borderStrong
   - theme focus → brandAccent
=========================================================== */

export function createBasicFormInputStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    display:
      "block",

    width:
      "100%",

    minWidth:
      0,

    height:
      `${tokens.inputHeight}px`,

    margin:
      0,

    padding:
      `0 ${tokens.inputPaddingX}px`,

    boxSizing:
      "border-box",

    border:
      `1px solid ${THEME.borderStrong}`,

        borderRadius:
      `${tokens.inputRadius}px`,

    outline:
      "none",

    background:
  `
    linear-gradient(
      180deg,
      color-mix(
        in srgb,
        ${THEME.surfaceMuted} 82%,
        transparent
      ),
      color-mix(
        in srgb,
        ${THEME.surface} 94%,
        transparent
      )
    )
  `,

  boxShadow:
  `
    inset 0 1px 0
    color-mix(
      in srgb,
      ${THEME.textInverse} 4%,
      transparent
    )
  `,

    color:
      THEME.textPrimary,

    fontFamily:
      "var(--finora-theme-font-family, Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif)",

    fontSize:
      `${tokens.inputFontSize}px`,

    fontWeight:
      tokens.inputFontWeight,

    appearance:
      "none",

    transition:
      "border-color .2s ease, background .2s ease, box-shadow .2s ease",

  };

}


/* ===========================================================
   SELECT
=========================================================== */

export function createBasicFormSelectStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    ...createBasicFormInputStyle(
      tokens,
    ),

    cursor:
      "pointer",

    paddingRight:
      `${tokens.inputPaddingX + tokens.iconSize}px`,

  };

}


/* ===========================================================
   OPTION

   Native browser dropdown receives the same FINORA semantic
   surface/text colours.

   Note:
   Native option rendering is ultimately controlled by the
   operating system/browser, but the supplied colours are now
   theme-aware instead of using a fixed brown fallback.
=========================================================== */

export function createBasicFormOptionStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    background:
      THEME.surfaceMuted,

    color:
      THEME.textPrimary,

    fontFamily:
      "var(--finora-theme-font-family, Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif)",

    fontSize:
      `${tokens.inputFontSize}px`,

    fontWeight:
      tokens.optionFontWeight,

  };

}


/* ===========================================================
   ICON

   All Basic Information icons now follow the same FINORA
   theme accent as Customer Identity.
=========================================================== */

export function createBasicFormIconStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      `${tokens.iconSize}px`,

    height:
      `${tokens.iconSize}px`,

    flexShrink:
      0,

    color:
      THEME.brandAccent,

  };

}


/* ===========================================================
   INPUT WRAPPER
=========================================================== */

export function createBasicFormInputWrapperStyle():
  CSSProperties {

  return {

    position:
      "relative",

    width:
      "100%",

    minWidth:
      0,

    margin:
      0,

    padding:
      0,

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   ICON POSITION
=========================================================== */

export function createBasicFormIconPositionStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    position:
      "absolute",

    left:
      `${tokens.inputPaddingX}px`,

    top:
      "50%",

    transform:
      "translateY(-50%)",

    margin:
      0,

    padding:
      0,

    pointerEvents:
      "none",

  };

}


/* ===========================================================
   ICON INPUT
=========================================================== */

export function createBasicFormIconInputStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    ...createBasicFormInputStyle(
      tokens,
    ),

    paddingLeft:
      `${
        tokens.inputPaddingX +
        tokens.iconSize +
        tokens.iconOffset
      }px`,

  };

}


/* ===========================================================
   ICON SELECT
=========================================================== */

export function createBasicFormIconSelectStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    paddingLeft:
      `${
        tokens.inputPaddingX +
        tokens.iconSize +
        tokens.iconOffset
      }px`,

  };

}


/* ===========================================================
   END
=========================================================== */  