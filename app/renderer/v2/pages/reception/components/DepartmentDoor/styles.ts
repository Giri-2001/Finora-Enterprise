/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   DEPARTMENT DOOR™

   STYLES

   IMPORTANT
   -----------------------------------------------------------
   - Responsive geometry comes ONLY from Responsive Engine.
   - Theme appearance comes ONLY from FINORA Theme Engine.
   - Card depth comes ONLY from Theme Engine.
   - Department cards contain only:
       1. Premium icon
       2. Department title
   - No subtitle/status presentation.
   - No hard-coded theme colors.
   - No hard-coded responsive geometry.
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
   RESPONSIVE + THEME STYLE FACTORY
=========================================================== */

export function createDepartmentDoorStyles(

  tokens:
    ResponsiveTokens,

  theme:
    FinoraTheme,

) {


  /* =========================================================
     ROOT / DEPARTMENT CARD

     ENTERPRISE ELEVATED CARD
     ---------------------------------------------------------
     Card depth is controlled entirely by the Theme Engine.

     No local shadow geometry is defined here.
  ========================================================= */

    // FINORA_C80_B21_B2_RECEPTION_ONLY
  // Additional 15% RGB darkening on Reception card gradients.
  // No effect on Gold, Obsidian or other modules.
  const finoraReceptionVivid =
    theme.id === "royal-navy" ||
    theme.id === "amethyst" ||
    theme.id === "emerald";

  const finoraReceptionTone = (value: string): string => {
    if (!finoraReceptionVivid) return value;
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
      return value;
    }

    const channel = (offset: number): string =>
      Math.round(
        parseInt(value.slice(offset, offset + 2), 16) * 0.85,
      )
        .toString(16)
        .padStart(2, "0");

    return `#${channel(1)}${channel(3)}${channel(5)}`;
  };
  const containerStyle:
    CSSProperties = {

    width:
      tokens.door.width,

    height:
      `${tokens.door.height}px`,

    minHeight:
      `${tokens.door.height}px`,

    borderRadius:
      `${tokens.door.radius}px`,

    padding:
      `${tokens.door.padding}px`,

    display:
      "flex",

    flexDirection:
      "column",

    justifyContent:
      "center",

    alignItems:
      "center",

    boxSizing:
      "border-box",

    cursor:
      "pointer",

    userSelect:
      "none",


    /* =======================================================
       ELEVATED SURFACE
    ======================================================= */

    background:
      `
        linear-gradient(
          180deg,
          ${finoraReceptionTone(theme.colors.background.surfaceElevated)} 0%,
          ${finoraReceptionTone(theme.colors.background.surface)} 100%
        )
      `,


    /* =======================================================
       BORDER
    ======================================================= */

    border:
      finoraReceptionVivid
        ? `${tokens.border.width}px solid transparent`
        : `${tokens.border.width}px solid ${theme.colors.border.default}`,


    /* =======================================================
       THEME ENGINE CARD DEPTH

       The complete shadow definition is owned by:

       theme.components.card.shadow

       Therefore Reception does not define its own
       shadow geometry or shadow color.
    ======================================================= */

    boxShadow:
  `
    ${theme
      .components
      .card
      .shadow},

    0 10px 30px ${theme
      .colors
      .overlay
      .shadow}
  `,

    /* =======================================================
       TEXT
    ======================================================= */

    color:
      theme
        .colors
        .text
        .primary,


    /* =======================================================
       TRANSITION
    ======================================================= */

    transition:
      "all 220ms ease",

  };


  /* =========================================================
     PREMIUM MODULE ICON
  ========================================================= */

  const iconStyle:
    CSSProperties = {

    width:
      `${tokens.door.iconSize}px`,

    height:
      `${tokens.door.iconSize}px`,

    display:
      "flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    flexShrink:
      0,

    color:
      theme
        .colors
        .text
        .primary,

  };


  /* =========================================================
     CONTENT
  ========================================================= */

  const contentStyle:
    CSSProperties = {

    display:
      "flex",

    flexDirection:
      "column",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      `${tokens.door.gap}px`,

    textAlign:
      "center",

    width:
      "100%",

    transform:
      "translateY(-8px)",

  };


  /* =========================================================
     TITLE
  ========================================================= */

  const titleStyle:
    CSSProperties = {

    margin:
      0,

    fontSize:
      `${tokens.door.titleSize}px`,

    lineHeight:
      tokens.lineHeight.heading,

    fontWeight:
      700,

    textAlign:
      "center",

    color:
      theme
        .colors
        .text
        .primary,

  };


  /* =========================================================
     RETURN
  ========================================================= */

  return {

    containerStyle,

    iconStyle,

    contentStyle,

    titleStyle,

  };

}


/* ===========================================================
   END
=========================================================== */