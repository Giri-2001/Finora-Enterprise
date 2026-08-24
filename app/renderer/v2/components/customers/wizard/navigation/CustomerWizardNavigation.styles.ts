/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER WIZARD NAVIGATION™

   STYLES

   RESPONSIBILITY:
   - Customer Wizard navigation presentation
   - Fixed bottom navigation
   - Navigation button presentation
   - Responsive sizing through Customer Responsive Engine
   - Visual appearance through FINORA Theme Engine

   IMPORTANT:
   - No React logic
   - No state
   - No breakpoint calculations
   - No viewport calculations
   - No inline CSS dependency
   - Responsive dimensions come from Customer Responsive Engine
   - Theme colours come directly from active FinoraTheme
   - No local theme palette
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


import type {
  FinoraTheme,
} from "../../../../themes/core/types";


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

  theme:
    FinoraTheme,

): CustomerWizardNavigationStyles {


  /* =========================================================
     ACTIVE THEME COLORS

     IMPORTANT:

     These values come directly from the central FINORA
     Theme Engine.

     No theme ID checks.
     No local colour mapping.
     No hard-coded theme palette.

     Therefore every registered theme automatically flows
     through this navigation component.
  ========================================================= */

  const footerBackground =
  theme
    .colors
    .background
    .page;


  const secondaryBackground =
    theme
      .colors
      .background
      .surfaceMuted;


  const secondaryBackgroundHover =
    theme
      .colors
      .background
      .surface;


  const brandPrimary =
    theme
      .colors
      .brand
      .primary;


  const brandAccent =
    theme
      .colors
      .brand
      .accent;


  const textPrimary =
    theme
      .colors
      .text
      .primary;


  const textInverse =
    theme
      .colors
      .text
      .inverse;


  const borderDefault =
    theme
      .colors
      .border
      .default;


  const borderStrong =
    theme
      .colors
      .border
      .strong;


  const shadow =
    theme
      .colors
      .overlay
      .shadow;


  /* =========================================================
     FIXED BOTTOM FOOTER

     IMPORTANT:

     Navigation intentionally remains outside normal document
     flow.

     Therefore:

     - Step 1 height remains unchanged
     - Step 2 height remains unchanged
     - Step 3 height remains unchanged
     - Footer stays fixed at viewport bottom
     - Navigation geometry remains responsive-token driven
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
      20,

    minHeight:
      tokens.button.minHeight +
      20,

    padding:
      "7px 0",

    margin:
      0,

    borderTop:
      `${tokens.border.width}px solid ${borderDefault}`,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      tokens.spacing.medium,

    background:
      footerBackground,

    zIndex:
      1000,

    flexShrink:
      0,

    boxShadow:
  `0 -2px 10px ${shadow}`,

  };


  /* =========================================================
     LEFT NAVIGATION AREA

     Previous button remains part of the centered navigation
     group rather than being pushed to the viewport edge.
  ========================================================= */

  const left:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    minWidth:
      0,

    padding:
      0,

  };


  /* =========================================================
     RIGHT NAVIGATION AREA

     Continue / Finish remains part of the centered navigation
     group rather than being pushed to the viewport edge.
  ========================================================= */

  const right:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    minWidth:
      0,

    padding:
      0,

  };


  /* =========================================================
     SECONDARY BUTTON

     Previous button:

     - Theme-aware surface
     - Theme-aware border
     - Theme-aware text
     - Responsive geometry
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
      `1px solid ${borderStrong}`,

    background:
      secondaryBackground,

    color:
      textPrimary,

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
      `0 3px 8px ${shadow}`,

    transition:
      "transform .18s ease, box-shadow .18s ease, background .18s ease",

  };


  /* =========================================================
     DISABLED SECONDARY BUTTON

     Step 1 Previous button is intentionally disabled.
  ========================================================= */

  const secondaryButtonDisabled:
    CSSProperties = {

    ...secondaryButton,

    opacity:
      0.45,

    cursor:
      "not-allowed",

    boxShadow:
      "none",

  };


  /* =========================================================
     PRIMARY BUTTON

     Continue / Finish:

     - Active FINORA brand
     - Theme-aware text contrast
     - Theme-aware border
     - Responsive geometry
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
      `1px solid ${brandPrimary}`,

    background:
      `
        linear-gradient(
          135deg,
          ${brandAccent} 0%,
          ${brandPrimary} 100%
        )
      `,

    color:
      textInverse,

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
      `0 5px 14px ${shadow}`,

    transition:
      "transform .18s ease, box-shadow .18s ease, filter .18s ease",

  };


  /* =========================================================
     STEP INFORMATION

     "Step 1 of 3"

     Typography remains responsive-token driven while the
     actual text colour follows the active FINORA theme.
  ========================================================= */

  const info:
    CSSProperties = {

    color:
      textPrimary,

    fontSize:
      tokens.typography.navigation +
      3,

    fontWeight:
      750,

    whiteSpace:
      "nowrap",

    textAlign:
      "center",

    padding:
      `0 ${tokens.spacing.small}px`,

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