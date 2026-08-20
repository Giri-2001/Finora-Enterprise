/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   PAGE STYLES

   IMPORTANT
   -----------------------------------------------------------
   - Responsive geometry comes ONLY from Responsive Engine.
   - Theme colors come ONLY from FINORA Theme Engine.
   - No local theme definitions.
   - No hard-coded theme colors.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../utils/responsive";

import type {
  FinoraTheme,
} from "../../themes/core/types";


/* ===========================================================
   TYPES
=========================================================== */

export interface ReceptionPageStyles {

  pageStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createReceptionPageStyles(

  tokens:
    ResponsiveTokens,

  theme:
    FinoraTheme,

): ReceptionPageStyles {


  /* =========================================================
     PAGE BACKGROUND

     Theme owns the visual surface.

     Responsive Engine owns only geometry.
  ========================================================= */

  const pageStyle:
    CSSProperties = {

    width:
      "100%",

    minWidth:
      0,

    minHeight:
      0,

    display:
      "flex",

    flex:
      "1 1 auto",

    flexDirection:
      "column",

    boxSizing:
      "border-box",

    overflowX:
      "hidden",

    overflowY:
      "visible",

    background:
      `
        linear-gradient(
          180deg,
          ${theme.colors.background.page} 0%,
          ${theme.colors.background.surface} 100%
        )
      `,

    color:
      theme.colors.text.primary,

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    pageStyle,

  };

}


/* ===========================================================
   END
=========================================================== */