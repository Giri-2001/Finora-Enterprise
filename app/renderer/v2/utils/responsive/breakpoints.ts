/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   BREAKPOINTS
=========================================================== */


/* ===========================================================
   DEVICE BREAKPOINTS
=========================================================== */

/*
  FINORA responsive boundaries are intentionally explicit.

  MOBILE
  0px  → 767px

  TABLET
  768px → 1279px

  DESKTOP
  1280px and above

  IMPORTANT:
  No layout should switch to full-width merely because the
  viewport crosses 767px / 768px.

  Component sizing is controlled separately by the
  Responsive Engine layout/tokens.
=========================================================== */


/* ===========================================================
   MOBILE
=========================================================== */

export const MOBILE_MIN_WIDTH =
  0;

export const MOBILE_MAX_WIDTH =
  767;


/* ===========================================================
   TABLET
=========================================================== */

export const TABLET_MIN_WIDTH =
  768;

export const TABLET_MAX_WIDTH =
  1279;


/* ===========================================================
   DESKTOP
=========================================================== */

export const DESKTOP_MIN_WIDTH =
  1280;


/* ===========================================================
   BREAKPOINT OBJECTS
=========================================================== */

import type {
  ResponsiveBreakpoint,
} from "./types";


export const DESKTOP:
  ResponsiveBreakpoint = {

  minWidth:
    DESKTOP_MIN_WIDTH,

};


export const TABLET:
  ResponsiveBreakpoint = {

  minWidth:
    TABLET_MIN_WIDTH,

  maxWidth:
    TABLET_MAX_WIDTH,

};


export const MOBILE:
  ResponsiveBreakpoint = {

  minWidth:
    MOBILE_MIN_WIDTH,

  maxWidth:
    MOBILE_MAX_WIDTH,

};


/* ===========================================================
   CUSTOMER CARD COUNTS
=========================================================== */

/*
  These are responsive defaults.

  Actual card sizing/layout must be consumed through the
  Responsive Engine rather than duplicated inside pages.
=========================================================== */

export const DESKTOP_CUSTOMER_CARDS =
  7;

export const TABLET_CUSTOMER_CARDS =
  5;

export const MOBILE_CUSTOMER_CARDS =
  2;


/* ===========================================================
   CUSTOMER SEARCH WIDTH
=========================================================== */

export const DESKTOP_SEARCH_WIDTH =
  340;

export const TABLET_SEARCH_WIDTH =
  300;

export const MOBILE_SEARCH_WIDTH =
  "100%";


/* ===========================================================
   END
=========================================================== */