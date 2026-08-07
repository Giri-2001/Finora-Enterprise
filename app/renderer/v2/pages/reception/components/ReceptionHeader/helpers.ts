/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   RECEPTION HEADER™

   HELPERS
=========================================================== */

import {

  COMPANY_NAME,
  COMPANY_SUBTITLE,
  COMPANY_DESCRIPTION,
  COMPANY_VERSION,

} from "./constants";

/* ===========================================================
   HEADER DATA
=========================================================== */

export function buildReceptionHeader() {

  return {

    title: COMPANY_NAME,

    subtitle: COMPANY_SUBTITLE,

    description: COMPANY_DESCRIPTION,

    version: COMPANY_VERSION,

  };

}
