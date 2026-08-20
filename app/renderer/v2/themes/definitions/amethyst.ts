/* ===========================================================
   FINORA ENTERPRISE OS
   THEME ENGINE

   AMETHYST THEME

   PURPOSE
   -----------------------------------------------------------
   Official FINORA Amethyst visual theme.

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

  id: "amethyst",

  name: "Amethyst",

  mode: "light",

  description:
    "FINORA's premium amethyst theme combining refined violet branding, elegant neutral surfaces, and enterprise-grade contrast.",


  /* =========================================================
     COLORS
  ========================================================= */

  colors: {

    brand: {
      primary: "#6D3FB3",
      secondary: "#512A8A",
      accent: "#9B6DDA",
      accentSoft: "#EDE3FA",
    },

    background: {
      page: "#F8F7FB",
      surface: "#FFFFFF",
      surfaceElevated: "#FFFFFF",
      surfaceMuted: "#F1EEF7",
      surfaceStrong: "#E5DFEF",
    },

    text: {
      primary: "#211A2B",
      secondary: "#51485E",
      muted: "#81758F",
      inverse: "#FFFFFF",
      disabled: "#AAA2B5",
      link: "#6D3FB3",
    },

    border: {
      default: "#DCD5E5",
      subtle: "#EBE7F0",
      strong: "#BEB3CC",
      focus: "#7B4FC1",
    },

    status: {

      success: "#16845B",
      successSoft: "#E6F5EE",

      warning: "#B7791F",
      warningSoft: "#FFF3D8",

      danger: "#C0392B",
      dangerSoft: "#FBEAE7",

      info: "#4267A8",
      infoSoft: "#EAF0FA",
    },

    interactive: {
      hover: "#F3F0F7",
      active: "#E8E1F0",
      selected: "#EDE3FA",
      focus: "#7B4FC1",
      disabled: "#EEEAF2",
    },

    overlay: {
      backdrop: "rgba(35, 20, 55, 0.48)",
      shadow: "rgba(35, 20, 55, 0.14)",
    },
  },


  /* =========================================================
     TYPOGRAPHY COLORS
  ========================================================= */

  typography: {

    heading: "#211A2B",
    body: "#51485E",
    label: "#403748",
    caption: "#81758F",
    placeholder: "#9B92A5",
    link: "#6D3FB3",
    inverse: "#FFFFFF",
  },


  /* =========================================================
     COMPONENT COLORS
  ========================================================= */

  components: {

    /* -------------------------------------------------------
       CARD
    ------------------------------------------------------- */

    card: {
      background: "#FFFFFF",
      border: "#DCD5E5",
      shadow: "rgba(35, 20, 55, 0.08)",
    },


    /* -------------------------------------------------------
       INPUT
    ------------------------------------------------------- */

    input: {
      background: "#FFFFFF",
      border: "#DCD5E5",
      text: "#211A2B",
      placeholder: "#9B92A5",
      focusBorder: "#7B4FC1",
      focusBackground: "#FFFFFF",
      disabledBackground: "#EEEAF2",
    },


    /* -------------------------------------------------------
       BUTTON
    ------------------------------------------------------- */

    button: {

      primaryBackground: "#6D3FB3",
      primaryText: "#FFFFFF",
      primaryHover: "#512A8A",

      secondaryBackground: "#FFFFFF",
      secondaryText: "#403748",
      secondaryBorder: "#DCD5E5",
      secondaryHover: "#F3F0F7",

      dangerBackground: "#C0392B",
      dangerText: "#FFFFFF",
      dangerHover: "#A93226",
    },


    /* -------------------------------------------------------
       NAVIGATION
    ------------------------------------------------------- */

    navigation: {
      background: "#FFFFFF",
      text: "#51485E",
      activeBackground: "#EDE3FA",
      activeText: "#6D3FB3",
      hoverBackground: "#F3F0F7",
    },


    /* -------------------------------------------------------
       HEADER
    ------------------------------------------------------- */

    header: {
      background: "#FFFFFF",
      text: "#211A2B",
      border: "#EBE7F0",
    },


    /* -------------------------------------------------------
       PANEL
    ------------------------------------------------------- */

    panel: {
      background: "#FFFFFF",
      border: "#DCD5E5",
      shadow: "rgba(35, 20, 55, 0.06)",
    },


    /* -------------------------------------------------------
       TABLE
    ------------------------------------------------------- */

    table: {
      headerBackground: "#F1EEF7",
      headerText: "#403748",
      rowBackground: "#FFFFFF",
      rowAlternateBackground: "#FAF9FC",
      rowHoverBackground: "#F3F0F7",
      border: "#EBE7F0",
    },


    /* -------------------------------------------------------
       MODAL
    ------------------------------------------------------- */

    modal: {
      background: "#FFFFFF",
      border: "#DCD5E5",
      backdrop: "rgba(35, 20, 55, 0.48)",
      shadow: "rgba(35, 20, 55, 0.18)",
    },
  },
};


/* ===========================================================
   END
=========================================================== */