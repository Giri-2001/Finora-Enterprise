/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   BREAKPOINTS

   RESPONSIBILITY:
   - Define viewport boundaries ONLY
   - Define 7-device classification boundaries
   - Keep viewport range logic centralized
   - Do NOT define visual dimensions
   - Do NOT define typography
   - Do NOT define spacing
   - Do NOT define component sizes

   VISUAL VALUES BELONG TO:
   ./tokens.ts

   DEVICE SYSTEM:

   01. MOBILE
       0px → 767px

   02. TABLET
       768px → 1023px

   03. LAPTOP
       1024px → 1599px

   04. DESKTOP
       1600px → 1919px

   05. WIDE DESKTOP
       1920px → 2559px

   06. ULTRA WIDE
       2560px → 3839px

   07. TV
       3840px+

=========================================================== */


/* ===========================================================
   BREAKPOINT TYPE
=========================================================== */

import type {
  ResponsiveBreakpoint,
  ResponsiveBreakpointMap,
} from "./types";


/* ===========================================================
   MOBILE
   0px → 767px
=========================================================== */

export const MOBILE_MIN_WIDTH =
  0;

export const MOBILE_MAX_WIDTH =
  767;


/* ===========================================================
   TABLET
   768px → 1023px
=========================================================== */

export const TABLET_MIN_WIDTH =
  768;

export const TABLET_MAX_WIDTH =
  1023;


/* ===========================================================
   LAPTOP
   1024px → 1599px
=========================================================== */

export const LAPTOP_MIN_WIDTH =
  1024;

export const LAPTOP_MAX_WIDTH =
  1599;


/* ===========================================================
   DESKTOP
   1600px → 1919px
=========================================================== */

export const DESKTOP_MIN_WIDTH =
  1600;

export const DESKTOP_MAX_WIDTH =
  1919;


/* ===========================================================
   WIDE DESKTOP
   1920px → 2559px
=========================================================== */

export const WIDE_DESKTOP_MIN_WIDTH =
  1920;

export const WIDE_DESKTOP_MAX_WIDTH =
  2559;


/* ===========================================================
   ULTRA WIDE
   2560px → 3839px
=========================================================== */

export const ULTRA_WIDE_MIN_WIDTH =
  2560;

export const ULTRA_WIDE_MAX_WIDTH =
  3839;


/* ===========================================================
   TV
   3840px+
=========================================================== */

export const TV_MIN_WIDTH =
  3840;


/* ===========================================================
   MOBILE BREAKPOINT
=========================================================== */

export const MOBILE:
  ResponsiveBreakpoint = {

  minWidth:
    MOBILE_MIN_WIDTH,

  maxWidth:
    MOBILE_MAX_WIDTH,

};


/* ===========================================================
   TABLET BREAKPOINT
=========================================================== */

export const TABLET:
  ResponsiveBreakpoint = {

  minWidth:
    TABLET_MIN_WIDTH,

  maxWidth:
    TABLET_MAX_WIDTH,

};


/* ===========================================================
   LAPTOP BREAKPOINT
=========================================================== */

export const LAPTOP:
  ResponsiveBreakpoint = {

  minWidth:
    LAPTOP_MIN_WIDTH,

  maxWidth:
    LAPTOP_MAX_WIDTH,

};


/* ===========================================================
   DESKTOP BREAKPOINT
=========================================================== */

export const DESKTOP:
  ResponsiveBreakpoint = {

  minWidth:
    DESKTOP_MIN_WIDTH,

  maxWidth:
    DESKTOP_MAX_WIDTH,

};


/* ===========================================================
   WIDE DESKTOP BREAKPOINT
=========================================================== */

export const WIDE_DESKTOP:
  ResponsiveBreakpoint = {

  minWidth:
    WIDE_DESKTOP_MIN_WIDTH,

  maxWidth:
    WIDE_DESKTOP_MAX_WIDTH,

};


/* ===========================================================
   ULTRA WIDE BREAKPOINT
=========================================================== */

export const ULTRA_WIDE:
  ResponsiveBreakpoint = {

  minWidth:
    ULTRA_WIDE_MIN_WIDTH,

  maxWidth:
    ULTRA_WIDE_MAX_WIDTH,

};


/* ===========================================================
   TV BREAKPOINT
=========================================================== */

export const TV:
  ResponsiveBreakpoint = {

  minWidth:
    TV_MIN_WIDTH,

  maxWidth:
    null,

};


/* ===========================================================
   CENTRAL BREAKPOINT MAP
=========================================================== */

export const RESPONSIVE_BREAKPOINTS:
  ResponsiveBreakpointMap = {

  mobile:
    MOBILE,

  tablet:
    TABLET,

  laptop:
    LAPTOP,

  desktop:
    DESKTOP,

  wideDesktop:
    WIDE_DESKTOP,

  ultraWide:
    ULTRA_WIDE,

  tv:
    TV,

};


/* ===========================================================
   RANGE HELPERS
=========================================================== */


/* ===========================================================
   MOBILE WIDTH
=========================================================== */

export function isMobileWidth(
  width: number,
): boolean {

  return (
    Number.isFinite(width) &&
    width >= MOBILE_MIN_WIDTH &&
    width <= MOBILE_MAX_WIDTH
  );

}


/* ===========================================================
   TABLET WIDTH
=========================================================== */

export function isTabletWidth(
  width: number,
): boolean {

  return (
    Number.isFinite(width) &&
    width >= TABLET_MIN_WIDTH &&
    width <= TABLET_MAX_WIDTH
  );

}


/* ===========================================================
   LAPTOP WIDTH
=========================================================== */

export function isLaptopWidth(
  width: number,
): boolean {

  return (
    Number.isFinite(width) &&
    width >= LAPTOP_MIN_WIDTH &&
    width <= LAPTOP_MAX_WIDTH
  );

}


/* ===========================================================
   DESKTOP WIDTH
=========================================================== */

export function isDesktopWidth(
  width: number,
): boolean {

  return (
    Number.isFinite(width) &&
    width >= DESKTOP_MIN_WIDTH &&
    width <= DESKTOP_MAX_WIDTH
  );

}


/* ===========================================================
   WIDE DESKTOP WIDTH
=========================================================== */

export function isWideDesktopWidth(
  width: number,
): boolean {

  return (
    Number.isFinite(width) &&
    width >= WIDE_DESKTOP_MIN_WIDTH &&
    width <= WIDE_DESKTOP_MAX_WIDTH
  );

}


/* ===========================================================
   ULTRA WIDE WIDTH
=========================================================== */

export function isUltraWideWidth(
  width: number,
): boolean {

  return (
    Number.isFinite(width) &&
    width >= ULTRA_WIDE_MIN_WIDTH &&
    width <= ULTRA_WIDE_MAX_WIDTH
  );

}


/* ===========================================================
   TV WIDTH
=========================================================== */

export function isTvWidth(
  width: number,
): boolean {

  return (
    Number.isFinite(width) &&
    width >= TV_MIN_WIDTH
  );

}


/* ===========================================================
   VALID VIEWPORT WIDTH
=========================================================== */

export function isValidViewportWidth(
  width: number,
): boolean {

  return (
    Number.isFinite(width) &&
    width >= 0
  );

}


/* ===========================================================
   END
=========================================================== */