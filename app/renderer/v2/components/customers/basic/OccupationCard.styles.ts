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
   - Responsive two-column / single-column occupation layout
   - Same label sizing
   - Same input sizing
   - Same placeholder/value sizing
   - Same field spacing
   - Same icon sizing
   - Responsive values consumed only from BasicForm Responsive Engine

   IMPORTANT:

   - Uses BasicFormResponsiveTokens only
   - No ResponsiveTokens
   - No identityForm.* references
   - No local viewport detection
   - No media queries
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  BasicFormResponsiveTokens,
} from "../../../utils/responsive/customers/basicform/basicform.tokens";


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

       Desktop / Laptop:

       Occupation        | Workplace / Business
       Monthly Income    | Work Experience


       Tablet:

       Occupation        | Workplace / Business
       Monthly Income    | Work Experience


       Mobile:

       Occupation
       Workplace / Business
       Monthly Income
       Work Experience


   IMPORTANT:

   - Geometry comes only from BasicFormResponsiveTokens
   - fieldColumns controls responsive column count
   - No viewport detection here
=========================================================== */

export function createOccupationCardGridStyle(
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
      tokens.fieldColumns === 1
        ? "minmax(0, 1fr)"
        : `repeat(${tokens.fieldColumns}, minmax(0, 1fr))`,

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

   MATCH FAMILY DETAILS FIELD GEOMETRY
=========================================================== */

export function createOccupationCardFieldStyle(
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

   MATCH FAMILY DETAILS / BASIC FORM

   Uses:

   - labelMinHeight
   - labelFontSize
   - labelFontWeight
   - labelLetterSpacing

   All values come directly from
   BasicFormResponsiveTokens.
=========================================================== */

export function createOccupationCardLabelStyle(
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

   MATCH FAMILY DETAILS / BASIC FORM

   Uses:

   - inputHeight
   - inputPaddingX
   - inputRadius
   - inputFontSize
   - inputFontWeight
   - iconSize
   - iconOffset

   Icon-aware left padding is applied directly here so
   placeholder and value text never overlap the icon.
=========================================================== */

export function createOccupationCardInputStyle(
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

    minHeight:
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

   Icon position is derived from:

   tokens.inputPaddingX

   Icon size is derived from:

   tokens.iconSize
=========================================================== */

export function createOccupationCardIconStyle(
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

   COMPATIBILITY HELPER

   The main input style already contains the complete
   icon-aware left padding.

   This helper remains exported so OccupationCard.tsx
   does not need to change.
=========================================================== */

export function createOccupationCardIconInputStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    ...createOccupationCardInputStyle(
      tokens,
    ),

  };

}


/* ===========================================================
   END
=========================================================== */