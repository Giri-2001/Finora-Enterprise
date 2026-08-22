/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER BASIC FORM
   RESPONSIVE LAYOUT

   RESPONSIBILITY:
   - Combined Step 1 + Step 2 page geometry
   - Responsive form columns
   - Responsive field geometry
   - Header-to-form vertical separation
   - Responsive field spacing

   IMPORTANT:
   - Geometry comes only from BasicFormResponsiveTokens
   - No viewport detection
   - No media queries
   - No hard-coded responsive dimensions
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  BasicFormResponsiveTokens,
} from "./basicform.tokens";


/* ===========================================================
   COMBINED PAGE
=========================================================== */

export function createBasicFormPageStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  const columns =
    tokens.formColumns;

  return {

    display:
      "grid",

    gridTemplateColumns:
      columns === 1
        ? "minmax(0, 1fr)"
        : `repeat(${columns}, minmax(0, 1fr))`,

    gap:
      `${tokens.columnGap}px`,

    width:
      "100%",

    minWidth:
      tokens.minWidth,

    minHeight:
      0,

    boxSizing:
      "border-box",

    alignItems:
      "start",

  };

}


/* ===========================================================
   FORM COLUMN
=========================================================== */

export function createBasicFormColumnStyle(
  tokens:
    BasicFormResponsiveTokens,
):
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      tokens.minWidth,

    minHeight:
      0,

    boxSizing:
      "border-box",

    overflow:
      "hidden",

  };

}


/* ===========================================================
   MOBILE FORM COLUMN
=========================================================== */

export function createMobileFormColumnStyle(
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
   FIELD GRID
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
      tokens.minWidth,

    boxSizing:
      "border-box",

    display:
      "grid",

    gridTemplateColumns:
      tokens.fieldColumns === 1
        ? "minmax(0, 1fr)"
        : `repeat(${tokens.fieldColumns}, minmax(0, 1fr))`,

    gap:
      `${tokens.fieldGap}px`,

    alignItems:
      "start",

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
   END
=========================================================== */