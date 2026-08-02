/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   LIGHT THEME
--------------------------------------------------------------
Default FINORA Light Theme
=========================================================== */

import { colors } from "../tokens/colors";

/* ===========================================================
   LIGHT THEME
=========================================================== */

export const lightTheme = {

  name: "light",

  colors,

} as const;

export type FinoraLightTheme = typeof lightTheme;
