/* ===========================================================
   FINORA ENTERPRISE OS™
   ACTION NEEDED PREVIEW CARD™

   STYLES
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../../../../../utils/responsive/tokens";


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createActionNeededPreviewCardStyles(
  tokens: ResponsiveTokens,
) {


  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle: CSSProperties = {

    width:
      "100%",

    height:
      tokens.customerCards.minHeight,

    background:
      "#FFFDF9",

    border:
      `${tokens.border.width}px solid #D8C7A4`,

    borderRadius:
      tokens.card.radius,

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
      tokens.spacing.small,

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

  };


  const titleStyle: CSSProperties = {

    color:
      "#F8E7B2",

    fontSize:
      tokens.typography.body,

    fontWeight:
      700,

  };


  /* =========================================================
     BODY
  ========================================================= */

  const bodyStyle: CSSProperties = {

    flex:
      1,

    padding:
      tokens.card.padding,

    display:
      "flex",

    flexDirection:
      "column",

    justifyContent:
      "flex-start",

    gap:
      tokens.card.gap,

  };


  /* =========================================================
     SECTION
  ========================================================= */

  const sectionStyle: CSSProperties = {};


  const labelStyle: CSSProperties = {

    fontWeight:
      700,

    fontSize:
      tokens.typography.label,

  };


  const valueStyle: CSSProperties = {

    marginTop:
      tokens.spacing.small,

    color:
      "#475569",

    fontSize:
      tokens.typography.small,

  };


  /* =========================================================
     LABEL COLORS
  ========================================================= */

  const outstandingLabelStyle: CSSProperties = {

    ...labelStyle,

    color:
      "#DC2626",

  };


  const statusLabelStyle: CSSProperties = {

    ...labelStyle,

    color:
      "#CA8A04",

  };


  const collectionLabelStyle: CSSProperties = {

    ...labelStyle,

    color:
      "#2563EB",

  };


  /* =========================================================
     FOOTER
  ========================================================= */

  const footerStyle: CSSProperties = {

    borderTop:
      `${tokens.border.width}px solid #E8D8B6`,

    paddingTop:
      tokens.spacing.small,

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "center",

  };


  const footerLabelStyle: CSSProperties = {

    color:
      "#8A6135",

    fontSize:
      tokens.typography.small,

    fontWeight:
      600,

  };


  const footerArrowStyle: CSSProperties = {

    color:
      "#8A6135",

    fontSize:
      tokens.typography.body,

    fontWeight:
      700,

    cursor:
      "pointer",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    headerStyle,

    titleStyle,

    bodyStyle,

    sectionStyle,

    labelStyle,

    valueStyle,

    outstandingLabelStyle,

    statusLabelStyle,

    collectionLabelStyle,

    footerStyle,

    footerLabelStyle,

    footerArrowStyle,

  };

}


/* ===========================================================
   END
=========================================================== */