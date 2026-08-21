/* ===========================================================
   FINORA ENTERPRISE OS
   THEME ENGINE

   ROYAL NAVY THEME

   PURPOSE
   -----------------------------------------------------------
   Official FINORA Royal Navy visual theme.

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
   ROYAL NAVY THEME
=========================================================== */

export const ROYAL_NAVY_THEME:
  FinoraTheme = {

  /* ---------------------------------------------------------
     IDENTITY
  --------------------------------------------------------- */

  id: "royal-navy",

  name: "Royal Navy",

  mode: "dark",

  description:
    "FINORA's premium royal navy theme combining deep navy surfaces, refined blue accents, and high-contrast enterprise presentation.",


  /* =========================================================
     COLORS
  ========================================================= */

  colors: {

    /* -------------------------------------------------------
       BRAND
    ------------------------------------------------------- */

    brand: {
      primary: "#1E3A5F",
      secondary: "#142A45",
      accent: "#4F8CC9",
      accentSoft: "#DCEBFA",
    },


    /* -------------------------------------------------------
       BACKGROUND / SURFACE
    ------------------------------------------------------- */

    background: {
      page: "#0B1220",
      surface: "#111C2E",
      surfaceElevated: "#16243A",
      surfaceMuted: "#1A2940",
      surfaceStrong: "#223550",
    },


    /* -------------------------------------------------------
       TEXT
    ------------------------------------------------------- */

    text: {
      primary: "#F5F8FC",
      secondary: "#C4D0DF",
      muted: "#8F9FB2",
      inverse: "#FFFFFF",
      disabled: "#65758A",
      link: "#76A9D8",
    },


    /* -------------------------------------------------------
       BORDER
    ------------------------------------------------------- */

    border: {
      default: "#30445E",
      subtle: "#24364D",
      strong: "#48617E",
      focus: "#4F8CC9",
    },


    /* -------------------------------------------------------
       STATUS
    ------------------------------------------------------- */

    status: {

  success: "#6EA8FF",
  successSoft: "#182F4F",

      warning: "#D6A33A",
      warningSoft: "#40351D",

      danger: "#E05A50",
      dangerSoft: "#422522",

      info: "#4F9BD8",
      infoSoft: "#18344D",
    },


    /* -------------------------------------------------------
       INTERACTIVE
    ------------------------------------------------------- */

    interactive: {
      hover: "#1A2A40",
      active: "#223550",
      selected: "#263F5E",
      focus: "#4F8CC9",
      disabled: "#182435",
    },


    /* -------------------------------------------------------
       OVERLAY
    ------------------------------------------------------- */

    overlay: {
      backdrop: "rgba(2, 8, 18, 0.68)",
      shadow: "rgba(0, 0, 0, 0.30)",
    },
  },


  /* =========================================================
     TYPOGRAPHY COLORS
  ========================================================= */

  typography: {

    heading: "#F5F8FC",
    body: "#C4D0DF",
    label: "#D7E0EA",
    caption: "#8F9FB2",
    placeholder: "#718198",
    link: "#76A9D8",
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
      background: "#111C2E",
      border: "#30445E",
      shadow: "rgba(0, 0, 0, 0.22)",
    },


    /* -------------------------------------------------------
       INPUT
    ------------------------------------------------------- */

    input: {
      background: "#0F1929",
      border: "#30445E",
      text: "#F5F8FC",
      placeholder: "#718198",
      focusBorder: "#4F8CC9",
      focusBackground: "#111C2E",
      disabledBackground: "#182435",
    },


    /* -------------------------------------------------------
       BUTTON
    ------------------------------------------------------- */

    button: {

      primaryBackground: "#1E3A5F",
      primaryText: "#FFFFFF",
      primaryHover: "#28517F",

      secondaryBackground: "#16243A",
      secondaryText: "#D7E0EA",
      secondaryBorder: "#48617E",
      secondaryHover: "#1F314A",

      dangerBackground: "#B9423B",
      dangerText: "#FFFFFF",
      dangerHover: "#D14F47",
    },


    /* -------------------------------------------------------
       NAVIGATION
    ------------------------------------------------------- */

    navigation: {
      background: "#0F1929",
      text: "#AEBBCD",
      activeBackground: "#1E3A5F",
      activeText: "#FFFFFF",
      hoverBackground: "#1A2A40",
    },


    /* -------------------------------------------------------
       HEADER
    ------------------------------------------------------- */

    header: {
      background: "#0F1929",
      text: "#F5F8FC",
      border: "#24364D",
    },


    /* -------------------------------------------------------
       PANEL
    ------------------------------------------------------- */

    panel: {
      background: "#111C2E",
      border: "#30445E",
      shadow: "rgba(0, 0, 0, 0.18)",
    },


    /* -------------------------------------------------------
       TABLE
    ------------------------------------------------------- */

    table: {
      headerBackground: "#1A2940",
      headerText: "#D7E0EA",
      rowBackground: "#111C2E",
      rowAlternateBackground: "#0F1929",
      rowHoverBackground: "#1A2A40",
      border: "#24364D",
    },


    /* -------------------------------------------------------
       MODAL
    ------------------------------------------------------- */

    modal: {
      background: "#111C2E",
      border: "#30445E",
      backdrop: "rgba(2, 8, 18, 0.68)",
      shadow: "rgba(0, 0, 0, 0.32)",
    },
  },
};


/* ===========================================================
   END
=========================================================== */