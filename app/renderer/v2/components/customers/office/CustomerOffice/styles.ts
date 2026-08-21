/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE™

   STYLES

   RESPONSIBILITY:
   - Provide Customer Office styles
   - Consume Customer Responsive Engine tokens
   - Consume FINORA Theme Engine visual tokens
   - Keep responsive dimensions centralized
   - No hardcoded responsive sizing
   - No business logic
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  ResponsiveTokens,
} from "../../../../utils/responsive";


import type {
  FinoraTheme,
} from "../../../../themes/core/types";


/* ===========================================================
   RESPONSIVE CONTRACT
   -----------------------------------------------------------
   IMPORTANT:

   Customer Office does NOT need the complete ResponsiveTokens
   contract.

   Only the responsive groups actually consumed by this file
   are accepted here.

   This prevents a Theme Engine / Responsive Engine contract
   change such as `themeSelector` from breaking this component.

   Responsive values still come exclusively from the
   Responsive Engine.
=========================================================== */

type CustomerOfficeResponsiveTokens =
  Pick<
    ResponsiveTokens,
    "border" | "panel"
  >;


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createCustomerOfficeStyles(

  tokens:
    CustomerOfficeResponsiveTokens,

  theme:
    FinoraTheme,

) {


  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle: CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    width:
      "100%",

    height:
      "100%",

    minHeight:
      0,

    overflow:
      "hidden",

    boxSizing:
      "border-box",

  };


  /* =========================================================
     WORKSPACE
  ========================================================= */

  const workspaceStyle: CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    width:
      "100%",

    flex:
      1,

    minHeight:
      0,

    overflow:
      "hidden",

    boxSizing:
      "border-box",

    padding:
      0,

  };


  /* =========================================================
     PANEL
     ---------------------------------------------------------
     RESPONSIVE:
     - radius
     - padding
     - gap
     - border width

     remain controlled by Responsive Engine.

     THEME:
     - background
     - border color
     - shadow

     come from Theme Engine.
  ========================================================= */

  const panelStyle: CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    width:
      "100%",

    height:
      "100%",

    minHeight:
      0,

    overflow:
      "hidden",

    boxSizing:
      "border-box",

    background:
      theme.components.panel.background,

    border:
      `${tokens.border.width}px solid ${theme.components.panel.border}`,

    borderRadius:
      tokens.panel.radius,

    padding:
      tokens.panel.padding,

    gap:
      tokens.panel.gap,

    boxShadow:
      theme.components.panel.shadow,

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    workspaceStyle,

    panelStyle,

  };

}


/* ===========================================================
   END
=========================================================== */