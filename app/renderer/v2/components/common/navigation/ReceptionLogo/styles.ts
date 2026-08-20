/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION LOGO™

   RESPONSIVE + THEME-AWARE STYLES

   RESPONSIBILITY:
   - Render FINORA Reception brand presentation
   - Consume central FINORA Theme Engine
   - Consume central FINORA Responsive Engine
   - Keep responsive geometry outside static styles

   IMPORTANT:
   - No hardcoded theme colors.
   - No hardcoded responsive geometry.
   - Theme values come directly from FinoraTheme.
   - Responsive geometry comes only from ResponsiveTokens.
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
   STYLE CONTRACT
=========================================================== */

export interface ReceptionLogoStyles {

  containerStyle:
    CSSProperties;

  logoStyle:
    CSSProperties;

  titleStyle:
    CSSProperties;

}


/* ===========================================================
   STYLE FACTORY
=========================================================== */

export function createReceptionLogoStyles(

  tokens:
    ResponsiveTokens,

  theme:
    FinoraTheme,

): ReceptionLogoStyles {


  /* =========================================================
     RESPONSIVE TOKENS
  ========================================================= */

  const header =
    tokens.header;


  /* =========================================================
     CENTRAL THEME TOKENS
  ========================================================= */

  const headerText =
    theme.components.header.text;

  const headerShadow =
    theme.colors.overlay.shadow;


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
      `${header.paddingX / 2}px`,

    cursor:
      "pointer",

    userSelect:
      "none",

    transition:
      "opacity 160ms ease",

  };


  /* =========================================================
     LOGO
  ========================================================= */

  const logoStyle:
    CSSProperties = {

    width:
      `${header.logoHeight}px`,

    height:
      `${header.logoHeight}px`,

    objectFit:
      "contain",

    flexShrink:
      0,

    filter:
      `drop-shadow(0 0 6px ${headerShadow})`,

  };


  /* =========================================================
     TITLE
  ========================================================= */

  const titleStyle:
    CSSProperties = {

    color:
      headerText,

    fontSize:
      `${header.titleSize}px`,

    fontWeight:
      800,

    letterSpacing:
      ".8px",

    whiteSpace:
      "nowrap",

    textShadow:
      `0 1px 8px ${headerShadow}`,

    fontFamily:
      '"Segoe UI", Inter, system-ui, sans-serif',

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    logoStyle,

    titleStyle,

  };

}


/* ===========================================================
   END
=========================================================== */