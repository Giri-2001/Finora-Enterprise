/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD
   STEP 6 — REVIEW RESPONSIVE LAYOUT™

   RESPONSIBILITY:

   - Convert resolved Review Responsive Tokens into CSS.
   - Keep Step 6 geometry out of component-local responsive logic.
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ReviewResponsiveTokens,
} from "./review.tokens";


/* ===========================================================
   WORKSPACE
=========================================================== */

export function createStep6ReviewWorkspaceStyle(
  tokens:
    ReviewResponsiveTokens,
): CSSProperties {

  return {

    width:
      "100%",

    height:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    flex:
      "1 1 auto",

    display:
      "grid",

    gridTemplateColumns:
      tokens.workspace.gridTemplateColumns,

    gridTemplateRows:
      tokens.workspace.gridTemplateRows,

    columnGap:
      `${tokens.workspace.columnGap}px`,

    rowGap:
      `${tokens.workspace.rowGap}px`,

    boxSizing:
      "border-box",

    padding:
        0,

    overflowY:
      tokens.workspace.overflowY,

    overflowX:
      "hidden",

    alignItems:
      "stretch",

    justifyItems:
      "stretch",

    alignSelf:
      "stretch",

  };

}


/* ===========================================================
   COLUMN WRAPPERS
=========================================================== */

export function createStep6ReviewColumnStyle():
  CSSProperties {

  return {

    display:
      "contents",

  };

}


/* ===========================================================
   ACTION PANEL
=========================================================== */

export function createStep6ReviewActionPanelStyle(
  tokens:
    ReviewResponsiveTokens,
): CSSProperties {

  return {

    minWidth:
      0,

    minHeight:
      0,

    width:
      "100%",

    height:
      tokens.workspace.actionPanelHeight,

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      "8px",

    boxSizing:
      "border-box",

    overflow:
      "hidden",

    alignSelf:
      "stretch",

    justifySelf:
      "stretch",

  };

}


/* ===========================================================
   DRAFT AREA
=========================================================== */

export function createStep6ReviewDraftAreaStyle():
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    flex:
      "0 0 auto",

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   ACTION AREA
=========================================================== */

export function createStep6ReviewActionAreaStyle():
  CSSProperties {

  return {

    width:
      "100%",

    minWidth:
      0,

    flex:
      "1 1 auto",

    display:
      "flex",

    flexDirection:
      "column",

    boxSizing:
      "border-box",

    overflow:
      "hidden",

  };

}


/* ===========================================================
   RESPONSIVE WRAPPER
=========================================================== */

export function createStep6ReviewResponsiveStyle():
  CSSProperties {

  return {

    width:
      "100%",

    height:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   END
=========================================================== */