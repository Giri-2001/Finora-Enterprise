/* ===========================================================
   FINORA ENTERPRISE OS™

   ADMIN PROFILE™

   STYLES

   IMPORTANT
   -----------------------------------------------------------
   - Theme colors come ONLY from FinoraTheme.
   - No local theme definitions.
   - No inline visual styles.
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

  wrapperStyle:
    CSSProperties;

  containerStyle:
    CSSProperties;

  iconStyle:
    CSSProperties;

  nameStyle:
    CSSProperties;

  arrowStyle:
    CSSProperties;

  dropdownStyle:
    CSSProperties;

  logoutButtonStyle:
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

  const headerBackground =
    theme
      .components
      .header
      .background;

  const headerText =
    theme
      .components
      .header
      .text;

  const border =
    theme
      .colors
      .border
      .default;

  const overlayShadow =
    theme
      .colors
      .overlay
      .shadow;


  /* =========================================================
     WRAPPER
  ========================================================= */

  const wrapperStyle:
    CSSProperties = {

    position:
      "relative",

     zIndex:
    10000,

    flexShrink:
      0,

  };


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

    transition:
      "transform .2s ease",

  };


  /* =========================================================
     DROPDOWN
  ========================================================= */

  const dropdownStyle:
    CSSProperties = {

    position:
      "absolute",

    top:
      "calc(100% + 8px)",

    right:
      0,

    zIndex:
      10001,

    minWidth:
      110,

    padding:
      6,

    boxSizing:
      "border-box",

    background:
      headerBackground,

    border:
      `1px solid ${border}`,

    borderRadius:
      10,

    boxShadow:
      `0 8px 24px ${overlayShadow}`,

  };


  /* =========================================================
     LOGOUT BUTTON
  ========================================================= */

  const logoutButtonStyle:
    CSSProperties = {

    width:
      "100%",

    minHeight:
      36,

    padding:
      "0 12px",

    border:
      `1px solid ${border}`,

    borderRadius:
      8,

    background:
      headerBackground,

    color:
      headerText,

    cursor:
      "pointer",

    fontWeight:
      700,

    fontSize:
      13,

    textAlign:
      "center",

    boxSizing:
      "border-box",

    transition:
      "background .18s ease, opacity .18s ease",

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    wrapperStyle,

    containerStyle,

    iconStyle,

    nameStyle,

    arrowStyle,

    dropdownStyle,

    logoutButtonStyle,

  };

}


/* ===========================================================
   END
=========================================================== */