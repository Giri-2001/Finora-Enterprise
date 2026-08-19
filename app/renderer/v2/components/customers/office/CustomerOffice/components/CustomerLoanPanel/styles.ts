/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PANEL™

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

export function createCustomerLoanPanelStyles(
  tokens: ResponsiveTokens,
) {


  /* =========================================================
     CONTAINER
  ========================================================= */

  const containerStyle: CSSProperties = {

    background:
      "#FFFFFF",

    border:
      `${tokens.border.width}px solid #E2E8F0`,

    borderRadius:
      tokens.panel.radius,

    padding:
      tokens.panel.padding,

    boxShadow:
      "0 16px 40px rgba(15,23,42,.08)",

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      tokens.panel.gap,

    height:
      "100%",

    boxSizing:
      "border-box",

    overflow:
      "hidden",

  };


  /* =========================================================
     HEADER
  ========================================================= */

  const titleStyle: CSSProperties = {

    margin:
      0,

    fontSize:
      tokens.typography.heading,

    fontWeight:
      700,

    color:
      "#0F172A",

  };


  const subtitleStyle: CSSProperties = {

    marginTop:
      tokens.spacing.small,

    color:
      "#64748B",

    fontSize:
      tokens.typography.label,

  };


  /* =========================================================
     STATISTICS
  ========================================================= */

  const statisticsGridStyle: CSSProperties = {

    display:
      "grid",

    gridTemplateColumns:
      `repeat(${tokens.grid.columns}, minmax(0, 1fr))`,

    gap:
      tokens.card.gap,

  };


  const statisticCardStyle: CSSProperties = {

    borderRadius:
      tokens.card.radius,

    border:
      `${tokens.border.width}px solid #D6B36A`,

    background:
      "linear-gradient(180deg,#FFFDF8,#FFF6E6)",

    padding:
      tokens.card.padding,

  };


  const statisticLabelStyle: CSSProperties = {

    color:
      "#7C5A2C",

    fontSize:
      tokens.typography.small,

    fontWeight:
      600,

  };


  const runningValueStyle: CSSProperties = {

    marginTop:
      tokens.spacing.small,

    fontSize:
      tokens.typography.heading,

    fontWeight:
      700,

    color:
      "#15803D",

  };


  const closedValueStyle: CSSProperties = {

    marginTop:
      tokens.spacing.small,

    fontSize:
      tokens.typography.heading,

    fontWeight:
      700,

    color:
      "#B91C1C",

  };


  const amountValueStyle: CSSProperties = {

    marginTop:
      tokens.spacing.small,

    fontSize:
      tokens.typography.heading,

    fontWeight:
      700,

    color:
      "#8B5E34",

  };


  /* =========================================================
     LOANS
  ========================================================= */

  const loansSectionStyle: CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    gap:
      tokens.card.gap,

    marginTop:
      tokens.spacing.small,

  };


  /* =========================================================
     LOAN SECTION HEADER
  ========================================================= */

  const sectionTitleStyle: CSSProperties = {

    margin:
      0,

    fontSize:
      tokens.typography.body,

    fontWeight:
      700,

    color:
      "#0F172A",

  };


  /* =========================================================
     EMPTY STATE
  ========================================================= */

  const emptyStateStyle: CSSProperties = {

    padding:
      tokens.panel.padding,

    textAlign:
      "center",

    borderRadius:
      tokens.panel.radius,

    border:
      `${tokens.border.width}px dashed #D6B36A`,

    background:
      "linear-gradient(180deg,#FFFDF8,#FFF8EC)",

    color:
      "#7C5A2C",

    fontSize:
      tokens.typography.label,

  };


  /* =========================================================
     RETURN STYLES
  ========================================================= */

  return {

    containerStyle,

    titleStyle,

    subtitleStyle,

    statisticsGridStyle,

    statisticCardStyle,

    statisticLabelStyle,

    runningValueStyle,

    closedValueStyle,

    amountValueStyle,

    loansSectionStyle,

    sectionTitleStyle,

    emptyStateStyle,

  };

}


/* ===========================================================
   END
=========================================================== */