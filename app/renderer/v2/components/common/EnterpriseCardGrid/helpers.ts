/* ===========================================================
   FINORA ENTERPRISE OS™
   ENTERPRISE CARD GRID™

   HELPERS
=========================================================== */

import {

  DEFAULT_COLUMNS,

  DEFAULT_GAP,

} from "./constants";

/* ===========================================================
   GRID
=========================================================== */

export function resolveColumns(

  columns?: number,

): number {

  return columns ?? DEFAULT_COLUMNS;

}

/* ===========================================================
   GAP
=========================================================== */

export function resolveGap(

  gap?: number,

): number {

  return gap ?? DEFAULT_GAP;

}
