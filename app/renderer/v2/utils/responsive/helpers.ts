/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   HELPERS
=========================================================== */

import {

  DESKTOP,

  TABLET,

} from "./breakpoints";

/* ===========================================================
   DEVICE
=========================================================== */

export function isDesktop(

  width: number,

): boolean {

  return width >= DESKTOP.minWidth;

}

/* ===========================================================
   TABLET
=========================================================== */

export function isTablet(

  width: number,

): boolean {

  return (

    width >= TABLET.minWidth &&

    width <= (TABLET.maxWidth ?? width)

  );

}

/* ===========================================================
   MOBILE
=========================================================== */

export function isMobile(

  width: number,

): boolean {

  return width < TABLET.minWidth;

}
