/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD NAVIGATION™

   STYLES

   RESPONSIBILITY:
   - Customer Wizard navigation presentation
   - Fixed bottom navigation
   - Navigation button presentation
   - Responsive sizing through Customer Responsive Engine

   IMPORTANT:
   - No React logic
   - No state
   - No breakpoint calculations
   - No viewport calculations
   - No inline CSS dependency
   - Responsive dimensions come from customers tokens
   - Navigation is OUT OF DOCUMENT FLOW
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../../../utils/responsive/tokens";


/* ===========================================================
   COLORS
=========================================================== */

const COLORS = {

  border:
    "rgba(255,255,255,.20)",

  footerBackground:
    "rgba(8,8,10,.98)",

  secondaryBackground:
    "#ffffff",

  secondaryBorder:
    "#d6d8dc",

  secondaryText:
    "#17130f",

  secondaryShadow:
    "0 3px 8px rgba(0,0,0,.14)",

  primaryBorder:
    "rgba(244,193,68,.95)",

  primaryText:
    "#ffffff",

  primaryShadow:
    "0 5px 14px rgba(132,84,10,.30), inset 0 1px 0 rgba(255,255,255,.35)",

  infoText:
    "rgba(255,255,255,.72)",

} as const;


/* ===========================================================
   STYLE CONTRACT
=========================================================== */

export interface CustomerWizardNavigationStyles {

  wrapper:
    CSSProperties;

  left:
    CSSProperties;

  right:
    CSSProperties;

  secondaryButton:
    CSSProperties;

  secondaryButtonDisabled:
    CSSProperties;

  primaryButton:
    CSSProperties;

  info:
    CSSProperties;

}


/* ===========================================================
   STYLE BUILDER
=========================================================== */

export function getCustomerWizardNavigationStyles(

  tokens:
    ResponsiveTokens,

): CustomerWizardNavigationStyles {


  /* =========================================================
     FIXED BOTTOM FOOTER

     IMPORTANT:
     This navigation is intentionally removed from the
     document flow.

     Therefore:
     - Step 1 height will not change
     - Step 2 height will not change
     - Step 3 height will not change
     - Footer always stays at viewport bottom
  ========================================================= */

  const wrapper:
    CSSProperties = {

    position:
      "fixed",

    left:
      0,

    right:
      0,

    bottom:
      0,

    width:
      "100%",

    boxSizing:
      "border-box",

    height:
      tokens.button.minHeight +
      26,

    minHeight:
      tokens.button.minHeight +
      26,

    padding:
      "7px 0",

    margin:
      0,

    borderTop:
      `1px solid ${COLORS.border}`,

    display:
      "grid",

    gridTemplateColumns:
      "1fr auto 1fr",

    alignItems:
      "center",

    columnGap:
      tokens.spacing.medium,

    background:
      COLORS.footerBackground,

    zIndex:
      1000,

    flexShrink:
      0,

  };


  /* =========================================================
     LEFT
  ========================================================= */

  const left:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "flex-start",

    gap:
      0,

    minWidth:
      0,

    padding:
      0,

  };


  /* =========================================================
     RIGHT
  ========================================================= */

  const right:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "flex-end",

    gap:
      0,

    minWidth:
      0,

    padding:
      0,

  };


  /* =========================================================
     SECONDARY BUTTON
  ========================================================= */

  const secondaryButton:
    CSSProperties = {

    minHeight:
      tokens.button.minHeight,

    padding:
      `0 ${tokens.button.paddingX + 6}px`,

    borderRadius:
      tokens.button.radius,

    border:
      `1px solid ${COLORS.secondaryBorder}`,

    background:
      COLORS.secondaryBackground,

    color:
      COLORS.secondaryText,

    cursor:
      "pointer",

    fontWeight:
      750,

    fontSize:
      tokens.button.fontSize,

    lineHeight:
      1,

    whiteSpace:
      "nowrap",

    boxShadow:
      COLORS.secondaryShadow,

    transition:
      "transform .18s ease, box-shadow .18s ease, background .18s ease",

  };


  /* =========================================================
     DISABLED SECONDARY BUTTON
  ========================================================= */

  const secondaryButtonDisabled:
    CSSProperties = {

    ...secondaryButton,

    opacity:
      0.45,

    cursor:
      "not-allowed",

  };


  /* =========================================================
     PRIMARY BUTTON
  ========================================================= */

  const primaryButton:
    CSSProperties = {

    minHeight:
      tokens.button.minHeight,

    padding:
      `0 ${tokens.button.paddingX + 14}px`,

    borderRadius:
      tokens.button.radius,

    border:
      `1px solid ${COLORS.primaryBorder}`,

    background:
      "linear-gradient(135deg, #f4c44e 0%, #da9b23 52%, #bd7810 100%)",

    color:
      COLORS.primaryText,

    cursor:
      "pointer",

    fontWeight:
      850,

    fontSize:
      tokens.button.fontSize,

    lineHeight:
      1,

    whiteSpace:
      "nowrap",

    boxShadow:
      COLORS.primaryShadow,

    transition:
      "transform .18s ease, box-shadow .18s ease, filter .18s ease",

  };


  /* =========================================================
     STEP INFO
  ========================================================= */

  const info:
    CSSProperties = {

    justifySelf:
      "center",

    color:
      COLORS.infoText,

    fontSize:
      tokens.typography.navigation,

    fontWeight:
      650,

    whiteSpace:
      "nowrap",

    textAlign:
      "center",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    wrapper,

    left,

    right,

    secondaryButton,

    secondaryButtonDisabled,

    primaryButton,

    info,

  };

}


/* ===========================================================
   END
=========================================================== */