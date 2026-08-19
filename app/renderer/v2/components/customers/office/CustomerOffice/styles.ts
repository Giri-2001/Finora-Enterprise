/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OFFICE™

   STYLES

   RESPONSIBILITY:
   - Provide Customer Office styles
   - Consume Customer Responsive Engine tokens
   - Keep responsive dimensions centralized
   - No hardcoded responsive sizing
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


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createCustomerOfficeStyles(
  tokens: ResponsiveTokens,
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
      "#FFFFFF",

    border:
      `${tokens.border.width}px solid #E5E7EB`,

    borderRadius:
      tokens.panel.radius,

    padding:
      tokens.panel.padding,

    gap:
      tokens.panel.gap,

    boxShadow:
      "0 16px 40px rgba(15,23,42,.08)",

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