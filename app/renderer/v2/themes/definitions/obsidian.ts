/* ===========================================================
   FINORA ENTERPRISE OS

   THEME ENGINE

   OBSIDIAN THEME

   PURPOSE
   -----------------------------------------------------------
   Official FINORA Obsidian visual theme.

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
   OBSIDIAN THEME
=========================================================== */

export const OBSIDIAN_THEME:
  FinoraTheme = {

  /* ---------------------------------------------------------
     IDENTITY
  --------------------------------------------------------- */

  id: "obsidian",

  name: "Obsidian",

  mode: "dark",

  description:
    "FINORA's premium obsidian theme combining near-black surfaces, refined graphite structure, subtle silver accents, and high-contrast enterprise presentation.",


  /* =========================================================
     THEME SELECTOR SWATCH
     
     IMPORTANT
     ---------------------------------------------------------
     This matches the Obsidian selector identity used by
     the FINORA Login theme selector.

     Do NOT change brand.primary to this value.
  ========================================================= */

  selectorSwatch:
  "#6B7078",


  /* =========================================================
     COLORS
  ========================================================= */

  colors: {

    /* -------------------------------------------------------
       BRAND
    ------------------------------------------------------- */

    brand: {
      primary: "#D4D7DC",
      secondary: "#A7ADB7",
      accent: "#E5E7EB",
      accentSoft: "#30343A",
    },


    /* -------------------------------------------------------
       BACKGROUND / SURFACE
    ------------------------------------------------------- */

    background: {
      page: "#090A0C",
      surface: "#111315",
      surfaceElevated: "#17191D",
      surfaceMuted: "#1D2025",
      surfaceStrong: "#272B31",
    },


    /* -------------------------------------------------------
       TEXT
    ------------------------------------------------------- */

    text: {
      primary: "#F4F5F7",
      secondary: "#C1C5CC",
      muted: "#858B95",
      inverse: "#0A0B0D",
      disabled: "#5E646E",
      link: "#D4D7DC",
    },


    /* -------------------------------------------------------
       BORDER
    ------------------------------------------------------- */

    border: {
      default: "#343840",
      subtle: "#24272D",
      strong: "#4A4F58",
      focus: "#D4D7DC",
    },


    /* -------------------------------------------------------
       STATUS
    ------------------------------------------------------- */

    status: {
  success: "#B8C0C8",
  successSoft: "#252B31",

      warning: "#D6A33A",
      warningSoft: "#40351D",

      danger: "#E05A50",
      dangerSoft: "#422522",

      info: "#5D9BD3",
      infoSoft: "#1B3042",
    },


    /* -------------------------------------------------------
       INTERACTIVE
    ------------------------------------------------------- */

    interactive: {
      hover: "#1B1E23",
      active: "#25282E",
      selected: "#30343A",
      focus: "#D4D7DC",
      disabled: "#17191D",
    },


    /* -------------------------------------------------------
       OVERLAY
    ------------------------------------------------------- */

    overlay: {
      backdrop: "rgba(0, 0, 0, 0.72)",
      shadow: "rgba(0, 0, 0, 0.38)",
    },
  },


  /* =========================================================
     TYPOGRAPHY COLORS
  ========================================================= */

  typography: {

    heading: "#F4F5F7",
    body: "#C1C5CC",
    label: "#D5D8DE",
    caption: "#858B95",
    placeholder: "#707680",
    link: "#D4D7DC",
    inverse: "#0A0B0D",
  },


  /* =========================================================
     COMPONENT COLORS
  ========================================================= */

  components: {

    /* -------------------------------------------------------
       CARD
    ------------------------------------------------------- */

    card: {
      background: "#111315",
      border: "#343840",
      shadow: "rgba(0, 0, 0, 0.28)",
    },


    /* -------------------------------------------------------
       INPUT
    ------------------------------------------------------- */

    input: {
      background: "#0F1113",
      border: "#343840",
      text: "#F4F5F7",
      placeholder: "#707680",
      focusBorder: "#D4D7DC",
      focusBackground: "#15171A",
      disabledBackground: "#17191D",
    },


    /* -------------------------------------------------------
       BUTTON
    ------------------------------------------------------- */

    button: {

      primaryBackground: "#D4D7DC",
      primaryText: "#0A0B0D",
      primaryHover: "#F0F1F3",

      secondaryBackground: "#17191D",
      secondaryText: "#D5D8DE",
      secondaryBorder: "#4A4F58",
      secondaryHover: "#22252A",

      dangerBackground: "#B9423B",
      dangerText: "#FFFFFF",
      dangerHover: "#D14F47",
    },


    /* -------------------------------------------------------
       NAVIGATION
    ------------------------------------------------------- */

    navigation: {
      background: "#0F1113",
      text: "#AEB4BE",
      activeBackground: "#30343A",
      activeText: "#F4F5F7",
      hoverBackground: "#1B1E23",
    },


    /* -------------------------------------------------------
       HEADER
    ------------------------------------------------------- */

    header: {
      background: "#0F1113",
      text: "#F4F5F7",
      border: "#24272D",
    },


    /* -------------------------------------------------------
       PANEL
    ------------------------------------------------------- */

    panel: {
      background: "#111315",
      border: "#343840",
      shadow: "rgba(0, 0, 0, 0.24)",
    },


    /* -------------------------------------------------------
       TABLE
    ------------------------------------------------------- */

    table: {
      headerBackground: "#1D2025",
      headerText: "#D5D8DE",
      rowBackground: "#111315",
      rowAlternateBackground: "#0F1113",
      rowHoverBackground: "#1B1E23",
      border: "#24272D",
    },


    /* -------------------------------------------------------
       MODAL
    ------------------------------------------------------- */

    modal: {
      background: "#111315",
      border: "#343840",
      backdrop: "rgba(0, 0, 0, 0.72)",
      shadow: "rgba(0, 0, 0, 0.40)",
    },
  },
};


/* ===========================================================
   END
=========================================================== */