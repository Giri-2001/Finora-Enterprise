/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ACTIONS PANEL™

   STYLES
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type { CSSProperties } from "react";

import type {
  ResponsiveTokens,
} from "../../../../../../utils/responsive/tokens";


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createCustomerActionsPanelStyles(
  tokens: ResponsiveTokens,
) {


  /* =========================================================
     CONTAINER
  ========================================================= */

  const containerStyle: CSSProperties = {

    background:
      "#FFFDF9",

    border:
      `${tokens.border.width}px solid #D8C7A4`,

    borderRadius:
      tokens.panel.radius,

    padding:
      tokens.panel.padding,

    boxShadow:
      "0 12px 28px rgba(15,23,42,.08)",

  };


  /* =========================================================
     HEADER
  ========================================================= */

  const headerStyle: CSSProperties = {

    color:
      "#6F4A23",

    fontSize:
      tokens.typography.heading,

    fontWeight:
      700,

    marginBottom:
      tokens.panel.gap,

  };


  /* =========================================================
     GRID
  ========================================================= */

  const gridStyle: CSSProperties = {

    display:
      "grid",

    gridTemplateColumns:
      "1fr 1fr",

    gap:
      tokens.card.gap,

  };


  /* =========================================================
     BUTTON
  ========================================================= */

  const buttonStyle: CSSProperties = {

    height:
      tokens.button.height,

    borderRadius:
      tokens.button.radius,

    border:
      `${tokens.border.width}px solid #D8C7A4`,

    background:
      "linear-gradient(180deg,#8A6135,#6F4A23)",

    color:
      "#FFF7E3",

    fontSize:
      tokens.button.fontSize,

    fontWeight:
      700,

    cursor:
      "pointer",

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      tokens.control.gap,

    transition:
      ".25s",

  };


  /* =========================================================
     RETURN STYLES
  ========================================================= */

  return {

    containerStyle,

    headerStyle,

    gridStyle,

    buttonStyle,

  };

}


/* ===========================================================
   END
=========================================================== */