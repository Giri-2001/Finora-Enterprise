/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HANGER

   HELPERS
=========================================================== */

import {
  DEFAULT_ROTATION,
  HOVER_ROTATION,
} from "./constants";

/* ===========================================================
   BUILD ROTATION
=========================================================== */

export function buildRotation(
  hovered: boolean,
): number {

  return hovered
    ? HOVER_ROTATION
    : DEFAULT_ROTATION;

}

/* ===========================================================
   CAN OPEN
=========================================================== */

export function canOpen(
  active?: boolean,
): boolean {

  return active !== false;

}
