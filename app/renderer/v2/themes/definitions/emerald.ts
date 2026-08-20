/* ===========================================================
   FINORA ENTERPRISE OS
   THEME ENGINE

   EMERALD THEME

   PURPOSE
   -----------------------------------------------------------
   Official FINORA Emerald visual theme.

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
   EMERALD THEME
=========================================================== */

export const EMERALD_THEME:
  FinoraTheme = {

  /* ---------------------------------------------------------
     IDENTITY
  --------------------------------------------------------- */

  id: "emerald",

  name: "Emerald",

  mode: "light",

  description:
    "FINORA's premium emerald theme combining deep financial green, refined neutral surfaces, and enterprise-grade clarity.",


  /* =========================================================
     COLORS
  ========================================================= */

  colors: {

    brand: {
      primary: "#087F5B",
      secondary: "#056044",
      accent: "#20A77A",
      accentSoft: "#DDF5EC",
    },

    background: {
      page: "#F6F9F8",
      surface: "#FFFFFF",
      surfaceElevated: "#FFFFFF",
      surfaceMuted: "#EEF5F2",
      surfaceStrong: "#DFEBE6",
    },

    text: {
      primary: "#17221E",
      secondary: "#45554E",
      muted: "#77867F",
      inverse: "#FFFFFF",
      disabled: "#A4B0AA",
      link: "#087F5B",
    },

    border: {
      default: "#D5E1DC",
      subtle: "#E5ECE9",
      strong: "#AEBFB7",
      focus: "#087F5B",
    },

    status: {

      success: "#16845B",
      successSoft: "#E4F5EE",

      warning: "#B7791F",
      warningSoft: "#FFF3D8",

      danger: "#C0392B",
      dangerSoft: "#FBEAE7",

      info: "#2867A5",
      infoSoft: "#EAF2FA",
    },

    interactive: {
      hover: "#F0F6F3",
      active: "#E3EEE9",
      selected: "#DDF5EC",
      focus: "#087F5B",
      disabled: "#EDF1EF",
    },

    overlay: {
      backdrop: "rgba(8, 31, 23, 0.48)",
      shadow: "rgba(8, 31, 23, 0.14)",
    },
  },


  /* =========================================================
     TYPOGRAPHY COLORS
  ========================================================= */

  typography: {

    heading: "#17221E",
    body: "#45554E",
    label: "#35443E",
    caption: "#77867F",
    placeholder: "#98A59F",
    link: "#087F5B",
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
      border: "#D5E1DC",
      shadow: "rgba(8, 31, 23, 0.08)",
    },


    /* -------------------------------------------------------
       INPUT
    ------------------------------------------------------- */

    input: {
      background: "#FFFFFF",
      border: "#D5E1DC",
      text: "#17221E",
      placeholder: "#98A59F",
      focusBorder: "#087F5B",
      focusBackground: "#FFFFFF",
      disabledBackground: "#EDF1EF",
    },


    /* -------------------------------------------------------
       BUTTON
    ------------------------------------------------------- */

    button: {

      primaryBackground: "#087F5B",
      primaryText: "#FFFFFF",
      primaryHover: "#056044",

      secondaryBackground: "#FFFFFF",
      secondaryText: "#35443E",
      secondaryBorder: "#D5E1DC",
      secondaryHover: "#F0F6F3",

      dangerBackground: "#C0392B",
      dangerText: "#FFFFFF",
      dangerHover: "#A93226",
    },


    /* -------------------------------------------------------
       NAVIGATION
    ------------------------------------------------------- */

    navigation: {
      background: "#FFFFFF",
      text: "#45554E",
      activeBackground: "#DDF5EC",
      activeText: "#087F5B",
      hoverBackground: "#F0F6F3",
    },


    /* -------------------------------------------------------
       HEADER
    ------------------------------------------------------- */

    header: {
      background: "#FFFFFF",
      text: "#17221E",
      border: "#E5ECE9",
    },


    /* -------------------------------------------------------
       PANEL
    ------------------------------------------------------- */

    panel: {
      background: "#FFFFFF",
      border: "#D5E1DC",
      shadow: "rgba(8, 31, 23, 0.06)",
    },


    /* -------------------------------------------------------
       TABLE
    ------------------------------------------------------- */

    table: {
      headerBackground: "#EEF5F2",
      headerText: "#35443E",
      rowBackground: "#FFFFFF",
      rowAlternateBackground: "#FAFCFB",
      rowHoverBackground: "#F0F6F3",
      border: "#E5ECE9",
    },


    /* -------------------------------------------------------
       MODAL
    ------------------------------------------------------- */

    modal: {
      background: "#FFFFFF",
      border: "#D5E1DC",
      backdrop: "rgba(8, 31, 23, 0.48)",
      shadow: "rgba(8, 31, 23, 0.18)",
    },
  },
};


/* ===========================================================
   END
=========================================================== */