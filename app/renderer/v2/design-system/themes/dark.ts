/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   DARK THEME
--------------------------------------------------------------
Default FINORA Dark Theme
=========================================================== */

import { colors } from "../tokens/colors";

/* ===========================================================
   DARK THEME
=========================================================== */

export const darkTheme = {

  name: "dark",

  colors: {

    ...colors,

    background: {

      page: "#111827",

      card: "#1f2937",

      overlay: "#000000",

    },

    surface: {

      primary: "#1f2937",

      secondary: "#374151",

      tertiary: "#4b5563",

    },

    text: {

      primary: "#ffffff",

      secondary: "#d1d5db",

      muted: "#9ca3af",

      inverse: "#111827",

    },

  },

} as const;

export type FinoraDarkTheme = typeof darkTheme;
