/* ===========================================================
   FINORA ENTERPRISE OS™
   THEME ENGINE

   AMETHYST THEME

   PURPOSE
   -----------------------------------------------------------
   Official FINORA Amethyst premium visual theme.

   IMPORTANT
   -----------------------------------------------------------
   This file controls visual appearance only.

   Responsive dimensions MUST continue to come from:

   app/renderer/v2/utils/responsive/

   DO NOT place:
   - widths
   - heights
   - padding
   - gaps
   - radii
   - font sizes
   - layout geometry

   inside this theme definition.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  FinoraTheme,
} from "../core/types";


/* ===========================================================
   AMETHYST THEME
=========================================================== */

export const AMETHYST_THEME:
  FinoraTheme = {

  /* ---------------------------------------------------------
     IDENTITY
  --------------------------------------------------------- */

  id:
    "amethyst",

  name:
    "Amethyst",

  mode:
    "dark",

  description:
    "FINORA's premium Amethyst theme with deep violet surfaces, refined lavender accents, and enterprise-grade contrast.",


  /* =========================================================
     COLORS
  ========================================================= */

  colors: {

    /* -------------------------------------------------------
       BRAND
    ------------------------------------------------------- */

    brand: {

      primary:
        "#8B5CC7",

      secondary:
        "#633A98",

      accent:
        "#B58AE8",

      accentSoft:
        "#35244D",

    },


    /* -------------------------------------------------------
       BACKGROUND / SURFACE
    ------------------------------------------------------- */

    background: {

      page:
        "#120D1A",

      surface:
        "#1B1426",

      surfaceElevated:
        "#241936",

      surfaceMuted:
        "#2C2040",

      surfaceStrong:
        "#3A2A52",

    },


    /* -------------------------------------------------------
       TEXT
    ------------------------------------------------------- */

    text: {

      primary:
        "#F8F3FF",

      secondary:
        "#C7BAD8",

      muted:
        "#9385A7",

      inverse:
        "#17101F",

      disabled:
        "#675B75",

      link:
        "#C29AF0",

    },


    /* -------------------------------------------------------
       BORDER
    ------------------------------------------------------- */

    border: {

      default:
        "#463457",

      subtle:
        "#32243F",

      strong:
        "#644A7D",

      focus:
        "#A46BE5",

    },


    /* -------------------------------------------------------
       STATUS
    ------------------------------------------------------- */

    status: {

      success:
  "#C084FC",

successSoft:
  "#30204A",
  
      warning:
        "#D7A13D",

      warningSoft:
        "#332714",

      danger:
        "#E37483",

      dangerSoft:
        "#351B24",

      info:
        "#8EB7F5",

      infoSoft:
        "#19263B",

    },


    /* -------------------------------------------------------
       INTERACTIVE
    ------------------------------------------------------- */

    interactive: {

      hover:
        "#2B1E3D",

      active:
        "#38264F",

      selected:
        "#493263",

      focus:
        "#A46BE5",

      disabled:
        "#29212F",

    },


    /* -------------------------------------------------------
       OVERLAY
    ------------------------------------------------------- */

    overlay: {

      backdrop:
        "rgba(8, 4, 14, 0.62)",

      shadow:
        "rgba(8, 3, 16, 0.52)",

    },

  },


  /* =========================================================
     TYPOGRAPHY
  ========================================================= */

  typography: {

    heading:
      "#F8F3FF",

    body:
      "#D7CDE2",

    label:
      "#C7BAD8",

    caption:
      "#9385A7",

    placeholder:
      "#766987",

    link:
      "#C29AF0",

    inverse:
      "#17101F",

  },


  /* =========================================================
     COMPONENTS
  ========================================================= */

  components: {

    /* -------------------------------------------------------
       CARD
    ------------------------------------------------------- */

    card: {

      background:
        "#1B1426",

      border:
        "#463457",

      shadow:
        "0 10px 30px rgba(8, 3, 16, 0.42)",

    },


    /* -------------------------------------------------------
       INPUT
    ------------------------------------------------------- */

    input: {

      background:
        "#17111F",

      border:
        "#463457",

      text:
        "#F8F3FF",

      placeholder:
        "#766987",

      focusBorder:
        "#A46BE5",

      focusBackground:
        "#1D142A",

      disabledBackground:
        "#241D2B",

    },


    /* -------------------------------------------------------
       BUTTON
    ------------------------------------------------------- */

    button: {

      primaryBackground:
        "#8B5CC7",

      primaryText:
        "#FFFFFF",

      primaryHover:
        "#9B6DDA",

      secondaryBackground:
        "#241936",

      secondaryText:
        "#E9DFF5",

      secondaryBorder:
        "#644A7D",

      secondaryHover:
        "#302143",

      dangerBackground:
        "#6F2F40",

      dangerText:
        "#FFE8ED",

      dangerHover:
        "#82384B",

    },


    /* -------------------------------------------------------
       NAVIGATION
    ------------------------------------------------------- */

    navigation: {

      background:
        "#17111F",

      text:
        "#C7BAD8",

      activeBackground:
        "#38264F",

      activeText:
        "#F8F3FF",

      hoverBackground:
        "#2B1E3D",

    },


    /* -------------------------------------------------------
       HEADER
    ------------------------------------------------------- */

    header: {

      background:
        "#17111F",

      text:
        "#F8F3FF",

      border:
        "#463457",

    },


    /* -------------------------------------------------------
       PANEL
    ------------------------------------------------------- */

    panel: {

      background:
        "#1B1426",

      border:
        "#463457",

      shadow:
        "0 12px 32px rgba(8, 3, 16, 0.42)",

    },


    /* -------------------------------------------------------
       TABLE
    ------------------------------------------------------- */

    table: {

      headerBackground:
        "#241936",

      headerText:
        "#E9DFF5",

      rowBackground:
        "#1B1426",

      rowAlternateBackground:
        "#21172F",

      rowHoverBackground:
        "#2B1E3D",

      border:
        "#3B2B4C",

    },


    /* -------------------------------------------------------
       MODAL
    ------------------------------------------------------- */

    modal: {

      background:
        "#1B1426",

      border:
        "#644A7D",

      backdrop:
        "rgba(8, 3, 16, 0.62)",

      shadow:
        "0 24px 60px rgba(8, 3, 16, 0.58)",

    },

  },

};


/* ===========================================================
   END
=========================================================== */