/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER OCCUPATION RESPONSIVE ENGINE

   RESPONSIBILITY:
   - Consume the central Responsive Engine
   - Resolve Basic Form responsive tokens
   - Keep Occupation aligned with Family Details
   - No local viewport detection
   - No local media queries
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useResponsive,
} from "..";


import {
  getBasicFormTokens,
} from "./basicform/basicform.tokens";


/* ===========================================================
   RESPONSIVE HOOK
=========================================================== */

export function useOccupationResponsive() {

  const {
    tokens,
  } =
    useResponsive();


  const occupationTokens =
    getBasicFormTokens(
      tokens.meta.viewport,
    );


  return {

    occupationTokens,

  };

}


/* ===========================================================
   END
=========================================================== */