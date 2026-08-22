/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OCCUPATION PROFILE™

   Version     : 3.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Match Step 1 / BasicForm field presentation
   - Match Family Details field presentation
   - Two-column occupation layout
   - Same label sizing
   - Same input sizing
   - Same placeholder/value sizing
   - Same field spacing
   - Same font family
   - Responsive values consumed only from Responsive Engine
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  ResponsiveTokens,
} from "../../../utils/responsive";


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

export function createOccupationCardRootStyle():
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    margin:
      0,

    padding:
  "0 0 25px",

    boxSizing:
      "border-box",

    display:
      "block",

  };

}


/* ===========================================================
   GRID

   OCCUPATION:

       Occupation        | Workplace / Business
       Monthly Income    | Work Experience

   IMPORTANT:

   - Full available width
   - Exactly two equal columns
   - No shrink-to-content
   - Responsive spacing comes only from
     the central Responsive Engine
   - Grid geometry remains independent
     from typography sizing
=========================================================== */

export function createOccupationCardGridStyle(
  tokens:
    ResponsiveTokens,
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
      `${tokens.identityForm.columnGap}px`,

    rowGap:
      `${tokens.identityForm.rowGap}px`,

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

   MATCH FAMILY DETAILS FIELD GEOMETRY
=========================================================== */

export function createOccupationCardFieldStyle(
  tokens:
    ResponsiveTokens,
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
      `${tokens.identityForm.fieldGap}px`,

    boxSizing:
      "border-box",

    alignSelf:
      "stretch",

  };

}


/* ===========================================================
   LABEL

   MATCH FAMILY DETAILS

   IMPORTANT:

   Family Details uses the identityForm typography profile.

   Therefore Occupation uses:

     tokens.identityForm.labelSize

   This keeps:

   - Same font size
   - Same font weight
   - Same line height
   - Same uppercase treatment
   - Same visual density
=========================================================== */

export function createOccupationCardLabelStyle(
  tokens:
    ResponsiveTokens,
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
      `${tokens.identityForm.labelHeight}px`,

    margin:
      0,

    padding:
      0,

    color:
      THEME.textSecondary,

    fontFamily:
      "var(--finora-theme-font-family, Inter, system-ui, sans-serif)",

    fontSize:
      `${tokens.identityForm.labelSize}px`,

    fontWeight:
      600,

    letterSpacing:
      ".45px",

    lineHeight:
      tokens.lineHeight.compact,

    textTransform:
      "uppercase",

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   INPUT WRAPPER
=========================================================== */

export function createOccupationCardInputWrapperStyle():
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

    display:
      "block",

  };

}


/* ===========================================================
   INPUT

   MATCH FAMILY DETAILS

   IMPORTANT:

   Occupation uses the exact Family Details
   Responsive Engine input profile.

   SOURCE:

     tokens.identityForm.inputHeight
     tokens.identityForm.inputRadius
     tokens.identityForm.inputPaddingX
     tokens.identityForm.inputFontSize

   This keeps the input value and placeholder
   at the same font size as Family Details.
=========================================================== */

export function createOccupationCardInputStyle(
  tokens:
    ResponsiveTokens,
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
      `${tokens.identityForm.inputHeight}px`,

    minHeight:
      `${tokens.identityForm.inputHeight}px`,

    margin:
      0,

    padding:
      `0 ${tokens.identityForm.inputPaddingX}px`,

    boxSizing:
      "border-box",

    borderRadius:
      `${tokens.identityForm.inputRadius}px`,

    border:
      `${tokens.border.width}px solid ${THEME.border}`,

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
      ${THEME.textPrimary} 4%,
      transparent
    )
  `,

    color:
      THEME.textPrimary,

    fontFamily:
      "var(--finora-theme-font-family, Inter, system-ui, sans-serif)",

    fontSize:
      `${tokens.identityForm.inputFontSize}px`,

    fontWeight:
      500,

    lineHeight:
      1.35,

    appearance:
      "none",

    transition:
      "border-color .2s ease, background .2s ease, box-shadow .2s ease",

  };

}


/* ===========================================================
   ICON

   MATCH FAMILY DETAILS ICON POSITION
=========================================================== */

export function createOccupationCardIconStyle(
  tokens:
    ResponsiveTokens,
):
  CSSProperties {

  return {

    position:
      "absolute",

    left:
      `${tokens.identityForm.iconLeft}px`,

    top:
      "50%",

    width:
      `${tokens.identityForm.iconSize}px`,

    height:
      `${tokens.identityForm.iconSize}px`,

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

   MATCH FAMILY DETAILS LEFT PADDING

   The padding is taken directly from the
   Responsive Engine identityForm profile.
=========================================================== */

export function createOccupationCardIconInputStyle(
  tokens:
    ResponsiveTokens,
):
  CSSProperties {

  return {

    ...createOccupationCardInputStyle(
      tokens,
    ),

    paddingLeft:
      `${tokens.identityForm.iconInputPaddingLeft}px`,

  };

}


/* ===========================================================
   END
=========================================================== */