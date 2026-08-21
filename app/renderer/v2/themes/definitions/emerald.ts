/* ===========================================================
   FINORA ENTERPRISE OS™
   THEME ENGINE

   EMERALD THEME

   PURPOSE
   -----------------------------------------------------------
   Official FINORA Emerald premium visual theme.

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
   EMERALD THEME
=========================================================== */

export const EMERALD_THEME:
  FinoraTheme = {

  /* ---------------------------------------------------------
     IDENTITY
  --------------------------------------------------------- */

  id:
    "emerald",

  name:
    "Emerald",

  mode:
    "dark",

  description:
    "FINORA's premium Emerald theme with deep green surfaces, refined emerald accents, and enterprise-grade contrast.",


  /* =========================================================
     COLORS
  ========================================================= */

  colors: {

    /* -------------------------------------------------------
       BRAND
    ------------------------------------------------------- */

    brand: {

      primary:
        "#35A878",

      secondary:
        "#167A59",

      accent:
        "#59C895",

      accentSoft:
        "#1D4637",

    },


    /* -------------------------------------------------------
       BACKGROUND / SURFACE
    ------------------------------------------------------- */

    background: {

      page:
        "#09130F",

      surface:
        "#101D18",

      surfaceElevated:
        "#162821",

      surfaceMuted:
        "#1C342A",

      surfaceStrong:
        "#27483A",

    },


    /* -------------------------------------------------------
       TEXT
    ------------------------------------------------------- */

    text: {

      primary:
        "#F1FAF6",

      secondary:
        "#BFD0C8",

      muted:
        "#81968C",

      inverse:
        "#102018",

      disabled:
        "#5E7068",

      link:
        "#69D6A5",

    },


    /* -------------------------------------------------------
       BORDER
    ------------------------------------------------------- */

    border: {

      default:
        "#29493D",

      subtle:
        "#203A31",

      strong:
        "#396452",

      focus:
        "#35A878",

    },


    /* -------------------------------------------------------
       STATUS
    ------------------------------------------------------- */

    status: {

      success:
  "#39D98A",

successSoft:
  "#103A2A",

      warning:
        "#D5A03B",

      warningSoft:
        "#332814",

      danger:
        "#E46F7D",

      dangerSoft:
        "#351C24",

      info:
        "#7DB6E8",

      infoSoft:
        "#182A3A",

    },


    /* -------------------------------------------------------
       INTERACTIVE
    ------------------------------------------------------- */

    interactive: {

      hover:
        "#193027",

      active:
        "#234236",

      selected:
        "#2D5344",

      focus:
        "#35A878",

      disabled:
        "#202B27",

    },


    /* -------------------------------------------------------
       OVERLAY
    ------------------------------------------------------- */

    overlay: {

      backdrop:
        "rgba(2, 13, 9, 0.64)",

      shadow:
        "rgba(2, 13, 9, 0.54)",

    },

  },


  /* =========================================================
     TYPOGRAPHY
  ========================================================= */

  typography: {

    heading:
      "#F1FAF6",

    body:
      "#D1DED8",

    label:
      "#BFD0C8",

    caption:
      "#81968C",

    placeholder:
      "#687B72",

    link:
      "#69D6A5",

    inverse:
      "#102018",

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
        "#101D18",

      border:
        "#29493D",

      shadow:
        "0 10px 30px rgba(2, 13, 9, 0.44)",

    },


    /* -------------------------------------------------------
       INPUT
    ------------------------------------------------------- */

    input: {

      background:
        "#0D1814",

      border:
        "#29493D",

      text:
        "#F1FAF6",

      placeholder:
        "#687B72",

      focusBorder:
        "#35A878",

      focusBackground:
        "#12231C",

      disabledBackground:
        "#1C2823",

    },


    /* -------------------------------------------------------
       BUTTON
    ------------------------------------------------------- */

    button: {

      primaryBackground:
        "#19835F",

      primaryText:
        "#FFFFFF",

      primaryHover:
        "#229B70",

      secondaryBackground:
        "#162821",

      secondaryText:
        "#DDEBE5",

      secondaryBorder:
        "#396452",

      secondaryHover:
        "#20382D",

      dangerBackground:
        "#713341",

      dangerText:
        "#FFE9ED",

      dangerHover:
        "#843B4C",

    },


    /* -------------------------------------------------------
       NAVIGATION
    ------------------------------------------------------- */

    navigation: {

      background:
        "#0D1814",

      text:
        "#BFD0C8",

      activeBackground:
        "#234236",

      activeText:
        "#F1FAF6",

      hoverBackground:
        "#193027",

    },


    /* -------------------------------------------------------
       HEADER
    ------------------------------------------------------- */

    header: {

      background:
        "#0D1814",

      text:
        "#F1FAF6",

      border:
        "#29493D",

    },


    /* -------------------------------------------------------
       PANEL
    ------------------------------------------------------- */

    panel: {

      background:
        "#101D18",

      border:
        "#29493D",

      shadow:
        "0 12px 32px rgba(2, 13, 9, 0.44)",

    },


    /* -------------------------------------------------------
       TABLE
    ------------------------------------------------------- */

    table: {

      headerBackground:
        "#162821",

      headerText:
        "#DDEBE5",

      rowBackground:
        "#101D18",

      rowAlternateBackground:
        "#14231D",

      rowHoverBackground:
        "#193027",

      border:
        "#253F34",

    },


    /* -------------------------------------------------------
       MODAL
    ------------------------------------------------------- */

    modal: {

      background:
        "#101D18",

      border:
        "#396452",

      backdrop:
        "rgba(2, 13, 9, 0.64)",

      shadow:
        "0 24px 60px rgba(2, 13, 9, 0.58)",

    },

  },

};


/* ===========================================================
   END
=========================================================== */