/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER CARD FLIP
   -----------------------------------------------------------
   Module  : Customer Hub
   Layer   : Cards
   Version : 2.0
   Status  : Production
=========================================================== */

import {
  DEFAULT_DURATION,
  DEFAULT_PERSPECTIVE,
} from "./constants";

/* ===========================================================
   BUILD PERSPECTIVE
=========================================================== */

export function buildPerspective(
  perspective?: number,
): number {

  if (
    typeof perspective !== "number" ||
    perspective <= 0
  ) {

    return DEFAULT_PERSPECTIVE;

  }

  return perspective;

}

/* ===========================================================
   BUILD DURATION
=========================================================== */

export function buildDuration(
  duration?: number,
): number {

  if (
    typeof duration !== "number" ||
    duration <= 0
  ) {

    return DEFAULT_DURATION;

  }

  return duration;

}

/* ===========================================================
   BUILD FLIP STATE
=========================================================== */

export function isFlipped(
  flipped?: boolean,
): boolean {

  return flipped === true;

}
