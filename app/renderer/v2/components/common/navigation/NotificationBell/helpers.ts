/* ===========================================================
   FINORA ENTERPRISE OS™
   NOTIFICATION BELL™

   HELPERS
=========================================================== */

import {
  DEFAULT_COUNT,
} from "./constants";

export function buildUnreadCount(

  count?: number,

): number {

  return count ?? DEFAULT_COUNT;

}
