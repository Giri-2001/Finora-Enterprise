/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER PROFILE PANEL™

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

export function createCustomerProfilePanelStyles(
  tokens: ResponsiveTokens,
) {

  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle: CSSProperties = {

    width:
      "100%",

    height:
      tokens.panel.minHeight * 2 +
      tokens.spacing.large,

    background:
      "#FFFDF9",

    border:
      `${tokens.border.width}px solid #D8C7A4`,

    borderRadius:
      tokens.panel.radius,

    overflow:
      "hidden",

    display:
      "flex",

    flexDirection:
      "column",

    boxShadow:
      "0 12px 28px rgba(15,23,42,.08)",

  };


  /* =========================================================
     HEADER
  ========================================================= */

  const headerStyle: CSSProperties = {

    background:
      "linear-gradient(180deg,#6F4A23,#8A6135)",

    padding:
      tokens.spacing.control,

    textAlign:
      "center",

  };


  const companyStyle: CSSProperties = {

    color:
      "#F8E7B2",

    fontWeight:
      700,

    fontSize:
      tokens.typography.heading,

    letterSpacing:
      "1px",

  };


  const subtitleStyle: CSSProperties = {

    marginTop:
      tokens.spacing.small,

    color:
      "#FFF7E3",

    fontSize:
      tokens.typography.small,

    letterSpacing:
      ".8px",

  };


  /* =========================================================
     BODY
  ========================================================= */

  const bodyStyle: CSSProperties = {

    flex:
      1,

    display:
      "flex",

    flexDirection:
      "column",

    justifyContent:
      "space-evenly",

    alignItems:
      "center",

    padding:
      tokens.panel.padding,

    gap:
      tokens.panel.gap,

  };


  /* =========================================================
     IMAGE
  ========================================================= */

  const profileImageSize =
    tokens.customerCards.minHeight -
    tokens.card.padding * 4;


  const imageStyle: CSSProperties = {

    width:
      profileImageSize,

    height:
      profileImageSize,

    borderRadius:
      tokens.card.radius +

      tokens.spacing.small,

    border:
      `${tokens.border.strongWidth}px solid #D4AF37`,

    background:
      "#FFFFFF",

  };


  /* =========================================================
     NAME
  ========================================================= */

  const nameStyle: CSSProperties = {

    fontSize:
      tokens.typography.title,

    fontWeight:
      700,

    lineHeight:
      tokens.lineHeight.title,

    color:
      "#1E293B",

    textAlign:
      "center",

  };


  /* =========================================================
     CUSTOMER ID
  ========================================================= */

  const idStyle: CSSProperties = {

    color:
      "#64748B",

    fontSize:
      tokens.typography.label,

    fontWeight:
      600,

  };


  /* =========================================================
     STATUS
  ========================================================= */

  const statusStyle: CSSProperties = {

    padding:
      `${tokens.spacing.small}px ${tokens.control.paddingX}px`,

    borderRadius:
      "999px",

    fontSize:
      tokens.typography.small,

    fontWeight:
      700,

  };


  /* =========================================================
     RETURN STYLES
  ========================================================= */

  return {

    containerStyle,

    headerStyle,

    companyStyle,

    subtitleStyle,

    bodyStyle,

    imageStyle,

    nameStyle,

    idStyle,

    statusStyle,

  };

}


/* ===========================================================
   END
=========================================================== */