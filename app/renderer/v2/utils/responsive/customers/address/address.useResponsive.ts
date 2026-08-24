/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER ADDRESS FORM
   RESPONSIVE HOOK

   RESPONSIBILITY:

   - Consume central Responsive Engine
   - Resolve Address specific responsive tokens

   IMPORTANT:

   - No window.innerWidth.
   - No media queries.
   - No local breakpoint calculations.
   - No component-level responsive decisions.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useResponsive,
} from "../../index";


import {
  getAddressTokens,
} from "./address.tokens";


/* ===========================================================
   HOOK
=========================================================== */

export function useAddressResponsive() {

  const {
    tokens,
  } =
    useResponsive();


  const addressTokens =
    getAddressTokens(
      tokens.meta.viewport,
    );


  return {

    tokens,

    addressTokens,

  };

}


/* ===========================================================
   END
=========================================================== */