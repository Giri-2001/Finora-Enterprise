/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PREVIEW CARD™

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

export function createCustomerLoanPreviewCardStyles(
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
      `repeat(${Math.min(2, tokens.grid.columns)}, minmax(0, 1fr))`,

    gap:
      tokens.card.gap,

    flex:
      1,

  };


  /* =========================================================
     STAT CARD
  ========================================================= */

  const statCardStyle: CSSProperties = {

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


  const statLabelStyle: CSSProperties = {

    fontSize:
      tokens.typography.small,

    fontWeight:
      600,

    color:
      "#8B5E34",

  };


  const statValueStyle: CSSProperties = {

    marginTop:
      tokens.spacing.small,

    fontSize:
      tokens.typography.heading,

    fontWeight:
      700,

    color:
      "#8A612B",

  };


  /* =========================================================
     RUNNING / CLOSED / OUTSTANDING / EMI CARDS
  ========================================================= */

  const runningCardStyle: CSSProperties = {

    ...statCardStyle,

  };


  const closedCardStyle: CSSProperties = {

    ...statCardStyle,

  };


  const outstandingCardStyle: CSSProperties = {

    ...statCardStyle,

  };


  const emiCardStyle: CSSProperties = {

    ...statCardStyle,

  };


  /* =========================================================
     VALUES
  ========================================================= */

  const runningValueStyle: CSSProperties = {

    ...statValueStyle,

    color:
      "#15803D",

  };


  const closedValueStyle: CSSProperties = {

    ...statValueStyle,

    color:
      "#B91C1C",

  };


  const moneyValueStyle: CSSProperties = {

    ...statValueStyle,

    fontSize:
      tokens.typography.body,

    color:
      "#8A612B",

  };


  const emiValueStyle: CSSProperties = {

    ...statValueStyle,

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
     BUTTON
  ========================================================= */

  const buttonStyle: CSSProperties = {

    width:
      "100%",

    height:
      tokens.button.height,

    border:
      `${tokens.border.width}px solid #C9A45C`,

    borderRadius:
      tokens.button.radius,

    background:
      "linear-gradient(180deg,#A67C38,#7A5625)",

    color:
      "#FFFFFF",

    fontSize:
      tokens.button.fontSize,

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

    statCardStyle,

    statLabelStyle,

    statValueStyle,

    runningCardStyle,

    closedCardStyle,

    outstandingCardStyle,

    emiCardStyle,

    runningValueStyle,

    closedValueStyle,

    moneyValueStyle,

    emiValueStyle,

    footerStyle,

    footerLabelStyle,

    footerArrowStyle,

    buttonStyle,

  };

}


/* ===========================================================
   END
=========================================================== */