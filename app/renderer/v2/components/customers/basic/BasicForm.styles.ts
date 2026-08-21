/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER BASIC FORM
   PRESENTATION STYLES

   RESPONSIBILITY:
   - FINORA themed visual presentation
   - Inputs
   - Selects
   - Labels
   - Icons

   IMPORTANT:
   - Responsive geometry comes from BasicForm tokens
   - Theme colours come from FINORA Theme CSS variables
   - No viewport logic
   - No business logic
   - No form state
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  BasicFormResponsiveTokens,
} from "../../../utils/responsive/customers/basicform";


/* ===========================================================
   THEME CONTRACT
=========================================================== */

const THEME = {

  textPrimary:
    "var(--finora-theme-text-primary, #F8FAFC)",

  textSecondary:
    "var(--finora-theme-text-secondary, rgba(255,255,255,.68))",

  textMuted:
    "var(--finora-theme-text-muted, rgba(255,255,255,.42))",

  surface:
    "var(--finora-theme-surface, rgba(255,255,255,.055))",

  surfaceMuted:
    "var(--finora-theme-surface-muted, rgba(255,255,255,.08))",

  border:
  "var(--finora-theme-border-default)",

borderStrong:
  "var(--finora-theme-border-strong)",

brand:
  "var(--finora-theme-brand-accent)",

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
      tokens.minWidth,

    boxSizing:
      "border-box",

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
      tokens.minWidth,

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${tokens.labelGap}px`,

  };

}


/* ===========================================================
   LABEL
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

    minHeight:
      `${tokens.labelMinHeight}px`,

    color:
      THEME.textSecondary,

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

  };

}


/* ===========================================================
   REQUIRED MARK
=========================================================== */

export function createBasicFormRequiredStyle():
  CSSProperties {

  return {

    marginLeft:
      "2px",

    color:
      THEME.brand,

    fontWeight:
      800,

  };

}


/* ===========================================================
   INPUT
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
      tokens.minWidth,

    height:
      `${tokens.inputHeight}px`,

    padding:
      `0 ${tokens.inputPaddingX}px`,

    boxSizing:
      "border-box",

    borderRadius:
      `${tokens.inputRadius}px`,

    border:
      `1px solid ${THEME.border}`,

    outline:
      "none",

    background:
      THEME.surface,

    color:
      THEME.textPrimary,

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
=========================================================== */

export function createBasicFormOptionStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    background:
      "var(--finora-theme-surface, #43291D)",

    color:
      THEME.textPrimary,

    fontSize:
      `${tokens.optionFontSize}px`,

    fontWeight:
      tokens.optionFontWeight,

  };

}


/* ===========================================================
   ICON WRAPPER
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
      THEME.brand,

  };

}


/* ===========================================================
   INPUT ICON WRAPPER
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

  };

}


/* ===========================================================
   INPUT WITH ICON
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
      `${tokens.inputPaddingX + tokens.iconSize + tokens.iconOffset}px`,

  };

}


/* ===========================================================
   END
=========================================================== */