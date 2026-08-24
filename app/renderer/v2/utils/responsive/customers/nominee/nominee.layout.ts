/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 5 — NOMINEE RESPONSIVE LAYOUT™

   Version     : 2.0
   Phase       : Phase 2
   Architecture: Enterprise
   Status      : Production

   RESPONSIBILITY:

   - Convert NomineeResponsiveTokens into presentation styles.
   - Keep Step 5 workspace geometry responsive.
   - Keep left/right review areas separated.
   - Mobile / Tablet → single vertical workspace.
   - Laptop / Desktop → exact 50 / 50 workspace.

   IMPORTANT:

   - No business logic.
   - No viewport detection.
   - No local breakpoints.
   - No media queries.
   - No local responsive calculations.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  NomineeResponsiveTokens,
} from "./nominee.tokens";


/* ===========================================================
   STYLE CONTRACT
=========================================================== */

export interface Step5NomineeStyles {

  containerStyle:
    CSSProperties;

  leftStyle:
    CSSProperties;

  rightStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createStep5NomineeStyles(

  tokens:
    NomineeResponsiveTokens,

):
  Step5NomineeStyles {


  const containerStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    boxSizing:
      "border-box",

    display:
      "grid",

    gridTemplateColumns:
      tokens.workspace.gridTemplateColumns,

    columnGap:
      `${tokens.workspace.columnGap}px`,

    rowGap:
      `${tokens.workspace.rowGap}px`,

    alignItems:
      "start",

    alignContent:
      "start",

    justifyContent:
      "stretch",

    overflow:
      "auto",

    padding:
      "0",

  };


  const leftStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${tokens.workspace.rowGap}px`,

    alignSelf:
      "start",

    overflow:
      "visible",

  };


  const rightStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    boxSizing:
      "border-box",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      `${tokens.workspace.rowGap}px`,

    alignSelf:
      "start",

    overflow:
      "visible",

  };


  return {

    containerStyle,

    leftStyle,

    rightStyle,

  };

}


/* ===========================================================
   END
=========================================================== */