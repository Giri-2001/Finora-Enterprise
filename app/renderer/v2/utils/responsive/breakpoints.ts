/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   BREAKPOINTS
=========================================================== */

import type {
  ResponsiveBreakpoint,
} from "./types";

/* ===========================================================
   BREAKPOINTS
=========================================================== */

export const DESKTOP: ResponsiveBreakpoint = {

  minWidth: 1280,

};

export const TABLET: ResponsiveBreakpoint = {

  minWidth: 768,

  maxWidth: 1279,

};

export const MOBILE: ResponsiveBreakpoint = {

  minWidth: 0,

  maxWidth: 767,

};

/* ===========================================================
   CARD COUNTS
=========================================================== */

export const DESKTOP_CUSTOMER_CARDS = 7;

export const TABLET_CUSTOMER_CARDS = 5;

export const MOBILE_CUSTOMER_CARDS = 2;

/* ===========================================================
   SEARCH
=========================================================== */

export const DESKTOP_SEARCH_WIDTH = 340;

export const TABLET_SEARCH_WIDTH = 300;

export const MOBILE_SEARCH_WIDTH = "100%";
