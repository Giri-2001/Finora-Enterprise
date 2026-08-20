/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   RECEPTION HEADER™

   STYLES

   IMPORTANT
   -----------------------------------------------------------
   Responsive geometry comes only from ResponsiveTokens.

   Theme colors come only from FinoraTheme.

   No local theme color definitions.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../../../utils/responsive/tokens";

import type {
  FinoraTheme,
} from "../../../../themes/core/types";


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createReceptionHeaderStyles(

  tokens:
    ResponsiveTokens,

  theme:
    FinoraTheme,

) {


  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle:
    CSSProperties = {

    width:
      "100%",

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      `${tokens.spacing.medium}px`,

    padding:
      `${tokens.spacing.large}px ${tokens.layout.pageGutter}px`,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     LOGO
  ========================================================= */

  const logoStyle:
    CSSProperties = {

    width:
      `${tokens.header.logoHeight}px`,

    height:
      `${tokens.header.logoHeight}px`,

    objectFit:
      "contain",

  };


  /* =========================================================
     TITLE
  ========================================================= */

  const titleStyle:
    CSSProperties = {

    margin:
      0,

    fontSize:
      `${tokens.reception.titleSize}px`,

    fontWeight:
      800,

    color:
      theme
        .colors
        .text
        .primary,

    letterSpacing:
      "1px",

    textAlign:
      "center",

    lineHeight:
      tokens.lineHeight.title,

  };


  /* =========================================================
     SUBTITLE
  ========================================================= */

  const subtitleStyle:
    CSSProperties = {

    margin:
      0,

    fontSize:
      `${tokens.typography.subheading}px`,

    fontWeight:
      600,

    color:
      theme
        .colors
        .text
        .secondary,

    textAlign:
      "center",

    lineHeight:
      tokens.lineHeight.heading,

  };


  /* =========================================================
     DESCRIPTION
  ========================================================= */

  const descriptionStyle:
    CSSProperties = {

    maxWidth:
      `${tokens.layout.maxContentWidth}px`,

    margin:
      0,

    fontSize:
      `${tokens.typography.body}px`,

    lineHeight:
      tokens.lineHeight.body,

    color:
      theme
        .colors
        .text
        .muted,

    textAlign:
      "center",

  };


  /* =========================================================
     VERSION
  ========================================================= */

  const versionStyle:
    CSSProperties = {

    marginTop:
      `${tokens.spacing.small}px`,

    padding:
      `${tokens.spacing.small}px ${tokens.spacing.medium}px`,

    borderRadius:
      `${tokens.border.radius}px`,

    background:
      theme
        .colors
        .background
        .surfaceMuted,

    border:
      `${tokens.border.width}px solid ${
        theme
          .colors
          .border
          .strong
      }`,

    fontSize:
      `${tokens.typography.caption}px`,

    fontWeight:
      700,

    color:
      theme
        .colors
        .brand
        .primary,

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    logoStyle,

    titleStyle,

    subtitleStyle,

    descriptionStyle,

    versionStyle,

  };

}


/* ===========================================================
   END
=========================================================== */