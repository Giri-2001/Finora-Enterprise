/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER BASIC FORM
   RESPONSIVE HOOK

   RESPONSIBILITY:
   - Consume the existing central Responsive Engine
   - Resolve Basic Form specific tokens

   IMPORTANT:
   - No window.innerWidth
   - No local media queries
   - No local breakpoint calculations
   - No hard-coded responsive decisions
=========================================================== */

import {
  useResponsive,
} from "../../index";


import {
  getBasicFormTokens,
} from "./basicform.tokens";


/* ===========================================================
   HOOK
=========================================================== */

export function useBasicFormResponsive() {

  const {
    tokens,
  } =
    useResponsive();


  const basicFormTokens =
    getBasicFormTokens(
      tokens.meta.viewport,
    );


  return {

    tokens,

    basicFormTokens,

  };

}


/* ===========================================================
   END
=========================================================== */