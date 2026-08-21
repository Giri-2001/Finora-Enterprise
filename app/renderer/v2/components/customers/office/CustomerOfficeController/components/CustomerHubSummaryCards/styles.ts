/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HUB SUMMARY CARDS™

   PREMIUM PRESENTATION STYLES

   RESPONSIVE MIGRATION
   -----------------------------------------------------------
   Visual / responsive dimensions are consumed from the
   Customer Hub Summary Cards Responsive Engine.

   Theme colors are consumed from the active FINORA
   Theme Engine through CSS variables.

   IMPORTANT:
   - No breakpoint logic exists here.
   - No local theme palette exists here.
   - Theme CSS variables use defensive fallback chains.
   - color-mix() NEVER receives an undefined CSS variable.
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
   THEME CSS VARIABLES
   -----------------------------------------------------------
   IMPORTANT:

   These are NOT a second theme definition.

   They are only defensive CSS-variable resolution chains.

   Resolution order:

     active theme accent
          ↓
     active theme primary
          ↓
     FINORA defensive fallback

   This prevents invalid color-mix() declarations when
   the summary-card parent does not directly expose one of
   the optional theme variables.
=========================================================== */

const THEME = {

  brand:
    "var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))",

  brandPrimary:
    "var(--finora-theme-brand-primary, var(--finora-theme-brand-accent, #D4AF37))",

  border:
    "var(--finora-theme-border-default, var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37)))",

  borderStrong:
    "var(--finora-theme-border-strong, var(--finora-theme-border-default, var(--finora-theme-brand-accent, var(--finora-theme-brand-primary, #D4AF37))))",

  textPrimary:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textSecondary:
    "var(--finora-theme-text-secondary, var(--finora-theme-text-primary, #FFFFFF))",

  overlay:
    "var(--finora-theme-overlay-shadow, rgba(0,0,0,.12))",

} as const;


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
  "var(--finora-theme-card-surface, var(--finora-theme-surface, #FFFFFF))",


    /* -------------------------------------------------------
       THEME BORDER

       IMPORTANT:

       The previous implementation used:

         var(--finora-theme-brand-accent)

       without a fallback.

       If that variable was unavailable, color-mix()
       became invalid and the entire border disappeared.

       This version always resolves to a valid colour.
    ------------------------------------------------------- */

    border:
      `1px solid color-mix(
        in srgb,
        ${THEME.brand} 60%,
        transparent
      )`,


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

export const iconStyle:
  CSSProperties = {

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
      `${tokens.titleSize + 2}px`,

    fontWeight:
      600,

    letterSpacing:
      "1px",

    textTransform:
      "uppercase",

    color:
      THEME.brand,

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
      THEME.textPrimary,

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
  "var(--finora-theme-card-surface, var(--finora-theme-surface, #FFFFFF))",


    /* -------------------------------------------------------
       THEME BORDER
    ------------------------------------------------------- */

    border:
      `1px solid color-mix(
        in srgb,
        ${THEME.borderStrong} 70%,
        transparent
      )`,


    boxShadow:
      `0 8px 20px ${THEME.overlay}`,

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


    /* -------------------------------------------------------
       THEME BORDER
    ------------------------------------------------------- */

    border:
      `1px solid color-mix(
        in srgb,
        ${THEME.brand} 80%,
        transparent
      )`,


    background:
      "transparent",

    color:
      THEME.textPrimary,

    cursor:
      "pointer",

    fontSize:
      `${tokens.paginationFontSize}px`,

    fontWeight:
      400,

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
      THEME.brand,

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
      THEME.textSecondary,

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