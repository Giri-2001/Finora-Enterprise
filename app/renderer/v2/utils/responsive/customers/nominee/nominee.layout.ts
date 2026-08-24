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
   - Laptop / Desktop → exact workspace geometry from tokens.
   - Apply responsive stack ordering from the Responsive Engine.

   IMPORTANT:

   - No business logic.
   - No viewport detection.
   - No local breakpoints.
   - No media queries.
   - No local responsive calculations.
   - Ordering comes only from NomineeResponsiveTokens.
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

    nomineeFormStyle:
    CSSProperties;

  nomineePreviewStyle:
    CSSProperties;

  customerSummaryStyle:
    CSSProperties;

  validationStatusStyle:
    CSSProperties;

  reviewChecklistStyle:
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


  /* =========================================================
     STEP 5 WORKSPACE
  ========================================================= */

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


  /* =========================================================
     LEFT WORKSPACE

     Ordering is controlled centrally by:
       tokens.workspace.leftOrder
  ========================================================= */

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

    order:
      tokens.workspace.leftOrder,

  };


  /* =========================================================
     RIGHT WORKSPACE

     Ordering is controlled centrally by:
       tokens.workspace.rightOrder
  ========================================================= */

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

    order:
      tokens.workspace.rightOrder,

  };

    const nomineeFormStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    order:
      tokens.stackOrder.nomineeForm,

  };


  const nomineePreviewStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    order:
      tokens.stackOrder.nomineePreview,

  };


  const customerSummaryStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    order:
      tokens.stackOrder.customerSummary,

  };


  const validationStatusStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    order:
      tokens.stackOrder.validationStatus,

  };


  const reviewChecklistStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    boxSizing:
      "border-box",

    order:
      tokens.stackOrder.reviewChecklist,

  };


  /* =========================================================
     RETURN
  ========================================================= */

    return {

    containerStyle,

    leftStyle,

    rightStyle,

    nomineeFormStyle,

    nomineePreviewStyle,

    customerSummaryStyle,

    validationStatusStyle,

    reviewChecklistStyle,

  };

}


/* ===========================================================
   END
=========================================================== */