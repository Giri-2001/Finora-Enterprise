/* ===========================================================
   FINORA ENTERPRISE OS
   THEME ENGINE

   THEME HOOK

   PURPOSE
   -----------------------------------------------------------
   Provides a dedicated hook entry point for consuming the
   FINORA V2 Theme Engine from application components.

   IMPORTANT
   -----------------------------------------------------------
   This hook exposes theme state only.

   Responsive dimensions MUST continue to come from:

   app/renderer/v2/utils/responsive/

   This hook must NOT contain responsive values.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useTheme as useThemeContext,
} from "../provider";


/* ===========================================================
   THEME HOOK
=========================================================== */

export function useTheme() {

  return useThemeContext();

}


/* ===========================================================
   END
=========================================================== */