/* ===========================================================
   FINORA ENTERPRISE OS™

   ADMIN PROFILE™

   STYLES

   IMPORTANT
   -----------------------------------------------------------
   - Theme colors come ONLY from FinoraTheme.
   - No hard-coded theme colors.
   - Responsive geometry remains outside this file.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  FinoraTheme,
} from "../../../../themes/core/types";


/* ===========================================================
   TYPES
=========================================================== */

export interface AdminProfileStyles {

  containerStyle:
    CSSProperties;

  iconStyle:
    CSSProperties;

  nameStyle:
    CSSProperties;

  arrowStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createAdminProfileStyles(

  theme:
    FinoraTheme,

): AdminProfileStyles {


  /* =========================================================
     SEMANTIC THEME COLORS
  ========================================================= */

  const primaryText =
    theme
      .colors
      .text
      .primary;

  const overlayShadow =
    theme
      .colors
      .overlay
      .shadow;


  /* =========================================================
     CONTAINER
  ========================================================= */

  const containerStyle:
    CSSProperties = {

    display:
      "flex",

    alignItems:
      "center",

    gap:
      "10px",

    cursor:
      "pointer",

    userSelect:
      "none",

    transition:
      "all .25s ease",

  };


  /* =========================================================
     ICON
  ========================================================= */

  const iconStyle:
    CSSProperties = {

    color:
      primaryText,

    flexShrink:
      0,

    filter:
      `drop-shadow(0 0 4px ${overlayShadow})`,

  };


  /* =========================================================
     NAME
  ========================================================= */

  const nameStyle:
    CSSProperties = {

    fontSize:
      "15px",

    fontWeight:
      700,

    color:
      primaryText,

    letterSpacing:
      ".35px",

    whiteSpace:
      "nowrap",

    textShadow:
      `0 1px 6px ${overlayShadow}`,

  };


  /* =========================================================
     ARROW
  ========================================================= */

  const arrowStyle:
    CSSProperties = {

    color:
      primaryText,

    flexShrink:
      0,

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    iconStyle,

    nameStyle,

    arrowStyle,

  };

}


/* ===========================================================
   END
=========================================================== */