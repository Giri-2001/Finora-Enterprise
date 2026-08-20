/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™
   RECEPTION FOOTER™

   THEME + RESPONSIVE ENGINE CONSUMER

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
} from "../../../../utils/responsive";

import type {
  FinoraTheme,
} from "../../../../themes/core/types";


/* ===========================================================
   TYPES
=========================================================== */

export interface ReceptionFooterStyles {

  containerStyle:
    CSSProperties;

  contentStyle:
    CSSProperties;

  copyrightStyle:
    CSSProperties;

  versionStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createReceptionFooterStyles(

  tokens:
    ResponsiveTokens,

  theme:
    FinoraTheme,

): ReceptionFooterStyles {


  /* =========================================================
     SEMANTIC THEME COLORS
  ========================================================= */

  const primaryText =
    theme
      .colors
      .text
      .primary;

  const secondaryText =
    theme
      .colors
      .text
      .secondary;


  /* =========================================================
     ROOT
  ========================================================= */

  const containerStyle:
    CSSProperties = {

    width:
      `calc(100% - ${tokens.layout.pageGutter * 2}px)`,

    maxWidth:
      `${tokens.layout.maxContentWidth}px`,

    minWidth:
      0,

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "center",

    boxSizing:
      "border-box",

    marginTop:
      "auto",

    alignSelf:
      "center",

    flexShrink:
      0,

    minHeight:
      `${tokens.footer.minHeight}px`,

    height:
      `${tokens.footer.height}px`,

    padding:
      `${tokens.footer.paddingY}px ${tokens.footer.paddingX}px`,

    borderRadius:
      `${tokens.border.radius}px`,

    background:
      "transparent",

    border:
      `${tokens.border.width}px solid ${
        theme
          .colors
          .border
          .strong
      }`,

    boxShadow:
      "none",

    letterSpacing:
      "0.3px",

  };


  /* =========================================================
     CONTENT
  ========================================================= */

  const contentStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    display:
      "flex",

    flexWrap:
      "wrap",

    alignItems:
      "center",

    justifyContent:
      "space-between",

    gap:
      `${tokens.spacing.small}px`,

    boxSizing:
      "border-box",

  };


  /* =========================================================
     COPYRIGHT
  ========================================================= */

  const copyrightStyle:
    CSSProperties = {

    minWidth:
      0,

    flex:
      "1 1 auto",

    color:
      primaryText,

    fontSize:
      `${tokens.footer.fontSize}px`,

    fontWeight:
      500,

    lineHeight:
      tokens.lineHeight.body,

    textAlign:
      "left",

    overflowWrap:
      "anywhere",

  };


  /* =========================================================
     VERSION
     
     Uses semantic secondary text so the right-side
     footer content follows the active theme naturally.
  ========================================================= */

  const versionStyle:
    CSSProperties = {

    minWidth:
      0,

    flex:
      "0 1 auto",

    color:
      secondaryText,

    fontSize:
      `${tokens.footer.fontSize}px`,

    fontWeight:
      600,

    lineHeight:
      tokens.lineHeight.body,

    textAlign:
      "right",

    overflowWrap:
      "anywhere",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    contentStyle,

    copyrightStyle,

    versionStyle,

  };

}


/* ===========================================================
   END
=========================================================== */