/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   RECEPTION FOOTER™

   HELPERS
=========================================================== */

import {

  FOOTER_COPYRIGHT,
  FOOTER_STATUS,
  FOOTER_VERSION,

} from "./constants";

/* ===========================================================
   FOOTER DATA
=========================================================== */

export function buildReceptionFooter() {

  return {

    version:
      FOOTER_VERSION,

    copyright:
      FOOTER_COPYRIGHT,

    status:
      FOOTER_STATUS,

  };

}
