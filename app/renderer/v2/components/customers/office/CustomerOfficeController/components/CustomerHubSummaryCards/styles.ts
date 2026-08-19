/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HUB SUMMARY CARDS™

   PREMIUM PRESENTATION STYLES

   RESPONSIVE MIGRATION
   -----------------------------------------------------------
   Visual/responsive dimensions are consumed from the
   Customer Hub Summary Cards Responsive Engine.

   No breakpoint logic exists in this file.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import {
  getCustomerSummaryCardsTokens,
} from "../../../../../../utils/responsive/customers/customerSummaryCards.tokens";

import type {
  ResponsiveViewport,
} from "../../../../../../utils/responsive/customers/customers.tokens";


/* ===========================================================
   TOKEN RESOLVER TYPE
=========================================================== */

type SummaryCardsStyles =
  ReturnType<
    typeof getCustomerSummaryCardsTokens
  >;


/* ===========================================================
   RESPONSIVE TOKEN RESOLVER
=========================================================== */

export function getCustomerHubSummaryCardsStyles(

  viewport:
    ResponsiveViewport,

):
  SummaryCardsStyles {

  return getCustomerSummaryCardsTokens(
    viewport,
  );

}


/* ===========================================================
   CONTAINER
=========================================================== */

export function containerStyle(

  tokens:
    SummaryCardsStyles,

):
  CSSProperties {

  return {

    width:
      "100%",

    display:
      "grid",

    gridTemplateColumns:
      `repeat(${tokens.columns}, minmax(0, ${tokens.cardWidth}px))`,

        justifyContent: 
      tokens.containerJustifyContent,

    alignItems:
      "center",

    gap:
      `${tokens.gap}px`,

    padding:
      `0 ${tokens.containerPaddingX}px`,

    boxSizing:
      "border-box",

    transform:
      `translateY(${tokens.containerTransformY}px)`,

  };

}


/* ===========================================================
   NORMAL SUMMARY CARD
=========================================================== */

export function cardStyle(

  tokens:
    SummaryCardsStyles,

):
  CSSProperties {

  return {

    width:
      `${tokens.cardWidth}px`,

    height:
      `${tokens.cardHeight}px`,

    borderRadius:
      `${tokens.cardRadius}px`,

    padding:
      `${tokens.cardPadding}px`,

    display:
      "flex",

    flexDirection:
      "column",

    justifyContent:
      "center",

    alignItems:
      "center",

    cursor:
      "pointer",

    background:
      "transparent",

    border:
      "1px solid rgba(212,175,55,.55)",

    boxShadow:
      "none",

    transition:
      "transform .25s ease",

    overflow:
      "hidden",

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   ICON
=========================================================== */

export const iconStyle: CSSProperties = {

  display:
    "none",

};


/* ===========================================================
   TITLE
=========================================================== */

export function titleStyle(

  tokens:
    SummaryCardsStyles,

):
  CSSProperties {

  return {

    fontSize:
      `${tokens.titleSize}px`,

    fontWeight:
      500,

    letterSpacing:
      "1px",

    textTransform:
      "uppercase",

    color:
      "#D4AF37",

    textAlign:
      "center",

  };

}


/* ===========================================================
   VALUE
=========================================================== */

export function valueStyle(

  tokens:
    SummaryCardsStyles,

):
  CSSProperties {

  return {

    marginTop:
      `${tokens.valueMarginTop}px`,

    fontSize:
      `${tokens.valueSize}px`,

    fontWeight:
      500,

    color:
      "#FFFFFF",

    textAlign:
      "center",

  };

}


/* ===========================================================
   DESCRIPTION
=========================================================== */

export function descriptionStyle(

  _tokens:
    SummaryCardsStyles,

):
  CSSProperties {

  return {

    display:
      "none",

  };

}


/* ===========================================================
   PAGINATION CARD
=========================================================== */

export function paginationCardStyle(

  tokens:
    SummaryCardsStyles,

):
  CSSProperties {

  return {

    width:
      `${tokens.cardWidth}px`,

    height:
      `${tokens.cardHeight}px`,

    borderRadius:
      `${tokens.cardRadius}px`,

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    gap:
      `${tokens.paginationGap}px`,

    background:
      "transparent",

    border:
      "1px solid rgba(212,175,55,.65)",

    boxShadow:
      "0 8px 20px rgba(0,0,0,.12)",

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   PAGINATION BUTTON
=========================================================== */

export function paginationButtonStyle(

  tokens:
    SummaryCardsStyles,

):
  CSSProperties {

  return {

    width:
      `${tokens.paginationButtonSize}px`,

    height:
      `${tokens.paginationButtonSize}px`,

    borderRadius:
      "50%",

    border:
      "1px solid rgba(212,175,55,.85)",

    background:
      "transparent",

    color:
      "#FFFFFF",

    cursor:
      "pointer",

    fontSize:
      `${tokens.paginationFontSize}px`,

    fontWeight:
      300,

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    lineHeight:
      1,

  };

}


/* ===========================================================
   ACTIVE DOT
=========================================================== */

export function paginationActiveDotStyle(

  tokens:
    SummaryCardsStyles,

):
  CSSProperties {

  return {

    width:
      `${tokens.paginationDotSize}px`,

    height:
      `${tokens.paginationDotSize}px`,

    borderRadius:
      "50%",

    background:
      "#D4AF37",

  };

}


/* ===========================================================
   NORMAL DOT
=========================================================== */

export function paginationDotStyle(

  tokens:
    SummaryCardsStyles,

):
  CSSProperties {

  return {

    width:
      `${tokens.paginationDotSize}px`,

    height:
      `${tokens.paginationDotSize}px`,

    borderRadius:
      "50%",

    background:
      "#FFFFFF",

  };

}


/* ===========================================================
   PAGINATION WRAPPER
=========================================================== */

export function paginationCenterStyle(

  tokens:
    SummaryCardsStyles,

):
  CSSProperties {

  return {

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      `${tokens.paginationDotGap}px`,

  };

}


/* ===========================================================
   END
=========================================================== */