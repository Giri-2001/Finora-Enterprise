/* ===========================================================
   FINORA ENTERPRISE OS™
   TODAY COLLECTIONS PREVIEW CARD™

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

export function createTodayCollectionsPreviewCardStyles(
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
      "0 10px 24px rgba(15,23,42,.08)",

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

    alignItems:
      "center",

    justifyContent:
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

    flex:
      1,

  };


  /* =========================================================
     STAT CARDS
  ========================================================= */

  const dueCardStyle: CSSProperties = {

    background:
      "#FFF8EA",

    border:
      `${tokens.border.width}px solid #D9B66C`,

    borderRadius:
      tokens.card.radius,

    padding:
      tokens.spacing.small,

    textAlign:
      "center",

  };


  const collectedCardStyle: CSSProperties = {

    ...dueCardStyle,

  };


  const pendingCardStyle: CSSProperties = {

    ...dueCardStyle,

  };


  const targetCardStyle: CSSProperties = {

    ...dueCardStyle,

  };


  /* =========================================================
     STAT LABEL
  ========================================================= */

  const statLabelStyle: CSSProperties = {

    fontSize:
      tokens.typography.small,

    fontWeight:
      600,

    color:
      "#8B5E34",

  };


  /* =========================================================
     STAT VALUES
  ========================================================= */

  const dueValueStyle: CSSProperties = {

    marginTop:
      tokens.spacing.small,

    fontSize:
      tokens.typography.heading,

    fontWeight:
      700,

    color:
      "#B45309",

  };


  const collectedValueStyle: CSSProperties = {

    ...dueValueStyle,

    color:
      "#15803D",

  };


  const pendingValueStyle: CSSProperties = {

    ...dueValueStyle,

    color:
      "#DC2626",

  };


  const targetValueStyle: CSSProperties = {

    ...dueValueStyle,

    color:
      "#8A612B",

  };


  /* =========================================================
     FOOTER
  ========================================================= */

  const footerStyle: CSSProperties = {

    borderTop:
      `${tokens.border.width}px solid #E7D6B3`,

    background:
      "#FFFCF6",

    padding:
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
      "#7C5A2C",

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

    gridStyle,

    dueCardStyle,

    collectedCardStyle,

    pendingCardStyle,

    targetCardStyle,

    statLabelStyle,

    dueValueStyle,

    collectedValueStyle,

    pendingValueStyle,

    targetValueStyle,

    footerStyle,

    footerLabelStyle,

    footerArrowStyle,

  };

}


/* ===========================================================
   END
=========================================================== */