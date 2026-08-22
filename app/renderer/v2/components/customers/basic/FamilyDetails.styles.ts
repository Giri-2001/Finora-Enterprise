/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER FAMILY & EMERGENCY™

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Match Step 1 / BasicForm field presentation
   - Two-column family layout
   - Exact Step 1 label sizing
   - Exact Step 1 input sizing
   - Exact Step 1 placeholder/value sizing
   - Exact Step 1 field spacing
   - Icon-aware input padding
   - Responsive values consumed only from Responsive Engine
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
   THEME
=========================================================== */

const THEME = {

  textSecondary:
    "var(--finora-theme-text-secondary, rgba(255,255,255,.68))",

  textPrimary:
    "var(--finora-theme-text-primary, #F8FAFC)",

  border:
    "var(--finora-theme-border-default, rgba(214,176,106,.28))",

  surface:
    "var(--finora-theme-surface, rgba(255,255,255,.055))",

  surfaceMuted:
  "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #1D212B))",

  brand:
    "var(--finora-theme-brand-accent, #D4AF37)",

} as const;


/* ===========================================================
   ROOT
=========================================================== */

export function createFamilyDetailsRootStyle():
  CSSProperties {

  return {

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

    display:
      "block",

  };

}


/* ===========================================================
   GRID

   FAMILY:

       Number of Family Members | Emergency Contact Name
       Emergency Contact Mobile |
=========================================================== */

export function createFamilyDetailsGridStyle(
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

export function createFamilyDetailsFieldStyle(
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
      `${tokens.labelGap}px`,

    boxSizing:
      "border-box",

    alignSelf:
      "stretch",

  };

}

/* ===========================================================
   LABEL

   IMPORTANT:

   Uses the SAME BasicFormResponsiveTokens as Step 1.
   No separate ResponsiveTokens are used here.
=========================================================== */

export function createFamilyDetailsLabelStyle(
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
  "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

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
   INPUT WRAPPER
=========================================================== */

export function createFamilyDetailsInputWrapperStyle():
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
   INPUT

   SAME BASICFORM INPUT PRESENTATION AS STEP 1.

   Left padding includes:

   input padding
   + icon width
   + icon offset

   This prevents placeholder/value text from sitting
   underneath the icon.
=========================================================== */

export function createFamilyDetailsInputStyle(
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
      `0 ${
        tokens.inputPaddingX
      }px 0 ${
        tokens.inputPaddingX +
        tokens.iconSize +
        tokens.iconOffset
      }px`,

    boxSizing:
      "border-box",

    borderRadius:
      `${tokens.inputRadius}px`,

    border:
      `1px solid ${THEME.border}`,

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
  "inset 0 1px 3px rgba(0,0,0,.10)",

    color:
      THEME.textPrimary,

    fontFamily:
  "Segoe UI, Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",

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
   ICON
=========================================================== */

export function createFamilyDetailsIconStyle(
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

    width:
      `${tokens.iconSize}px`,

    height:
      `${tokens.iconSize}px`,

    transform:
      "translateY(-50%)",

    flexShrink:
      0,

    color:
      THEME.brand,

    pointerEvents:
      "none",

  };

}


/* ===========================================================
   ICON INPUT

   Kept as a public helper for compatibility.

   The main input style already contains the icon-aware
   padding, so existing components do not need to change.
=========================================================== */

export function createFamilyDetailsIconInputStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    ...createFamilyDetailsInputStyle(
      tokens,
    ),

  };

}


/* ===========================================================
   END
=========================================================== */