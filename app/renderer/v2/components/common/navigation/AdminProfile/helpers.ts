/* ===========================================================
   FINORA ENTERPRISE OS™
   ADMIN PROFILE™

   HELPERS
=========================================================== */

import {
  DEFAULT_ADMIN_NAME,
} from "./constants";

export function buildAdminName(

  name?: string,

): string {

  if (!name?.trim()) {

    return DEFAULT_ADMIN_NAME;

  }

  return name.trim();

}
