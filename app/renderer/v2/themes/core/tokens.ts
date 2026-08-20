/* ===========================================================
   FINORA ENTERPRISE OS
   THEME ENGINE

   CORE SEMANTIC TOKENS

   PURPOSE
   -----------------------------------------------------------
   Defines the semantic structure used by every FINORA theme.

   IMPORTANT
   -----------------------------------------------------------
   This file does NOT contain responsive dimensions.

   Responsive values remain exclusively inside:

   app/renderer/v2/utils/responsive/

   This layer defines visual meaning only.
=========================================================== */

import type {
  ThemeColors,
  ThemeComponents,
  ThemeTypography,
} from "./types";


/* ===========================================================
   SEMANTIC COLOR BASE
=========================================================== */

export const DEFAULT_THEME_COLORS:
  ThemeColors = {

  brand: {
    primary: "#B8860B",
    secondary: "#8C6A00",
    accent: "#D4AF37",
    accentSoft: "#F5E7B2",
  },

  background: {
    page: "#F7F8FA",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceMuted: "#F1F3F6",
    surfaceStrong: "#E7EAF0",
  },

  text: {
    primary: "#171A21",
    secondary: "#4B5563",
    muted: "#7A8494",
    inverse: "#FFFFFF",
    disabled: "#A5ACB8",
    link: "#8C6A00",
  },

  border: {
    default: "#D9DEE7",
    subtle: "#E8EBF0",
    strong: "#B8C0CC",
    focus: "#B8860B",
  },

  status: {
    success: "#16845B",
    successSoft: "#E7F6EF",

    warning: "#B7791F",
    warningSoft: "#FFF4D8",

    danger: "#C0392B",
    dangerSoft: "#FCEBE8",

    info: "#2563A8",
    infoSoft: "#EAF3FC",
  },

  interactive: {
    hover: "#F3F5F8",
    active: "#E8EBF0",
    selected: "#F5E7B2",
    focus: "#B8860B",
    disabled: "#EEF0F3",
  },

  overlay: {
    backdrop: "rgba(15, 23, 42, 0.48)",
    shadow: "rgba(15, 23, 42, 0.14)",
  },
};


/* ===========================================================
   SEMANTIC TYPOGRAPHY COLORS
=========================================================== */

export const DEFAULT_THEME_TYPOGRAPHY:
  ThemeTypography = {

  heading: "#171A21",
  body: "#4B5563",
  label: "#374151",
  caption: "#7A8494",
  placeholder: "#9AA3B2",
  link: "#8C6A00",
  inverse: "#FFFFFF",
};


/* ===========================================================
   SEMANTIC COMPONENT COLORS
=========================================================== */

export const DEFAULT_THEME_COMPONENTS:
  ThemeComponents = {

  /* ---------------------------------------------------------
     CARD
  --------------------------------------------------------- */

  card: {
    background: "#FFFFFF",
    border: "#D9DEE7",
    shadow: "rgba(15, 23, 42, 0.08)",
  },


  /* ---------------------------------------------------------
     INPUT
  --------------------------------------------------------- */

  input: {
    background: "#FFFFFF",
    border: "#D9DEE7",
    text: "#171A21",
    placeholder: "#9AA3B2",
    focusBorder: "#B8860B",
    focusBackground: "#FFFFFF",
    disabledBackground: "#EEF0F3",
  },


  /* ---------------------------------------------------------
     BUTTON
  --------------------------------------------------------- */

  button: {
    primaryBackground: "#B8860B",
    primaryText: "#FFFFFF",
    primaryHover: "#8C6A00",

    secondaryBackground: "#FFFFFF",
    secondaryText: "#374151",
    secondaryBorder: "#D9DEE7",
    secondaryHover: "#F3F5F8",

    dangerBackground: "#C0392B",
    dangerText: "#FFFFFF",
    dangerHover: "#A93226",
  },


  /* ---------------------------------------------------------
     NAVIGATION
  --------------------------------------------------------- */

  navigation: {
    background: "#FFFFFF",
    text: "#4B5563",
    activeBackground: "#F5E7B2",
    activeText: "#8C6A00",
    hoverBackground: "#F3F5F8",
  },


  /* ---------------------------------------------------------
     HEADER
  --------------------------------------------------------- */

  header: {
    background: "#FFFFFF",
    text: "#171A21",
    border: "#E8EBF0",
  },


  /* ---------------------------------------------------------
     PANEL
  --------------------------------------------------------- */

  panel: {
    background: "#FFFFFF",
    border: "#D9DEE7",
    shadow: "rgba(15, 23, 42, 0.06)",
  },


  /* ---------------------------------------------------------
     TABLE
  --------------------------------------------------------- */

  table: {
    headerBackground: "#F1F3F6",
    headerText: "#374151",
    rowBackground: "#FFFFFF",
    rowAlternateBackground: "#FAFBFC",
    rowHoverBackground: "#F3F5F8",
    border: "#E8EBF0",
  },


  /* ---------------------------------------------------------
     MODAL
  --------------------------------------------------------- */

  modal: {
    background: "#FFFFFF",
    border: "#D9DEE7",
    backdrop: "rgba(15, 23, 42, 0.48)",
    shadow: "rgba(15, 23, 42, 0.18)",
  },
};


/* ===========================================================
   END
=========================================================== */