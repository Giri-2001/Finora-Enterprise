/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMERS RESPONSIVE ENGINE™

   BREAKPOINTS

   RESPONSIBILITY:
   - Reuse central Responsive Engine breakpoint boundaries
   - Expose Customers-specific breakpoint aliases
   - No duplicated viewport values
   - No typography
   - No spacing
   - No visual dimensions
   - No layout calculations

   SOURCE OF TRUTH:
   ../breakpoints.ts
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  ResponsiveBreakpoint,
  ResponsiveBreakpointMap,
} from "../types";

import {
  MOBILE,
  TABLET,
  LAPTOP,
  DESKTOP,
  WIDE_DESKTOP,
  ULTRA_WIDE,
  TV,

  MOBILE_MIN_WIDTH,
  MOBILE_MAX_WIDTH,

  TABLET_MIN_WIDTH,
  TABLET_MAX_WIDTH,

  LAPTOP_MIN_WIDTH,
  LAPTOP_MAX_WIDTH,

  DESKTOP_MIN_WIDTH,
  DESKTOP_MAX_WIDTH,

  WIDE_DESKTOP_MIN_WIDTH,
  WIDE_DESKTOP_MAX_WIDTH,

  ULTRA_WIDE_MIN_WIDTH,
  ULTRA_WIDE_MAX_WIDTH,

  TV_MIN_WIDTH,

  isMobileWidth,
  isTabletWidth,
  isLaptopWidth,
  isDesktopWidth,
  isWideDesktopWidth,
  isUltraWideWidth,
  isTvWidth,
  isValidViewportWidth,

} from "../breakpoints";


/* ===========================================================
   BREAKPOINT TYPE
=========================================================== */

export type CustomersBreakpoint =
  ResponsiveBreakpoint;


/* ===========================================================
   MOBILE
=========================================================== */

export const CUSTOMERS_MOBILE_MIN_WIDTH =
  MOBILE_MIN_WIDTH;

export const CUSTOMERS_MOBILE_MAX_WIDTH =
  MOBILE_MAX_WIDTH;


/* ===========================================================
   TABLET
=========================================================== */

export const CUSTOMERS_TABLET_MIN_WIDTH =
  TABLET_MIN_WIDTH;

export const CUSTOMERS_TABLET_MAX_WIDTH =
  TABLET_MAX_WIDTH;


/* ===========================================================
   LAPTOP
=========================================================== */

export const CUSTOMERS_LAPTOP_MIN_WIDTH =
  LAPTOP_MIN_WIDTH;

export const CUSTOMERS_LAPTOP_MAX_WIDTH =
  LAPTOP_MAX_WIDTH;


/* ===========================================================
   DESKTOP
=========================================================== */

export const CUSTOMERS_DESKTOP_MIN_WIDTH =
  DESKTOP_MIN_WIDTH;

export const CUSTOMERS_DESKTOP_MAX_WIDTH =
  DESKTOP_MAX_WIDTH;


/* ===========================================================
   WIDE DESKTOP
=========================================================== */

export const CUSTOMERS_WIDE_DESKTOP_MIN_WIDTH =
  WIDE_DESKTOP_MIN_WIDTH;

export const CUSTOMERS_WIDE_DESKTOP_MAX_WIDTH =
  WIDE_DESKTOP_MAX_WIDTH;


/* ===========================================================
   ULTRA WIDE
=========================================================== */

export const CUSTOMERS_ULTRA_WIDE_MIN_WIDTH =
  ULTRA_WIDE_MIN_WIDTH;

export const CUSTOMERS_ULTRA_WIDE_MAX_WIDTH =
  ULTRA_WIDE_MAX_WIDTH;


/* ===========================================================
   TV
=========================================================== */

export const CUSTOMERS_TV_MIN_WIDTH =
  TV_MIN_WIDTH;


/* ===========================================================
   BREAKPOINT OBJECTS
=========================================================== */

export const CUSTOMERS_MOBILE:
  CustomersBreakpoint =
  MOBILE;

export const CUSTOMERS_TABLET:
  CustomersBreakpoint =
  TABLET;

export const CUSTOMERS_LAPTOP:
  CustomersBreakpoint =
  LAPTOP;

export const CUSTOMERS_DESKTOP:
  CustomersBreakpoint =
  DESKTOP;

export const CUSTOMERS_WIDE_DESKTOP:
  CustomersBreakpoint =
  WIDE_DESKTOP;

export const CUSTOMERS_ULTRA_WIDE:
  CustomersBreakpoint =
  ULTRA_WIDE;

export const CUSTOMERS_TV:
  CustomersBreakpoint =
  TV;


/* ===========================================================
   BREAKPOINT MAP
=========================================================== */

export const CUSTOMERS_BREAKPOINTS:
  ResponsiveBreakpointMap = {

  mobile:
    CUSTOMERS_MOBILE,

  tablet:
    CUSTOMERS_TABLET,

  laptop:
    CUSTOMERS_LAPTOP,

  desktop:
    CUSTOMERS_DESKTOP,

  wideDesktop:
    CUSTOMERS_WIDE_DESKTOP,

  ultraWide:
    CUSTOMERS_ULTRA_WIDE,

  tv:
    CUSTOMERS_TV,

};


/* ===========================================================
   MOBILE WIDTH
=========================================================== */

export function isCustomersMobileWidth(
  width: number,
): boolean {

  return isMobileWidth(
    width,
  );

}


/* ===========================================================
   TABLET WIDTH
=========================================================== */

export function isCustomersTabletWidth(
  width: number,
): boolean {

  return isTabletWidth(
    width,
  );

}


/* ===========================================================
   LAPTOP WIDTH
=========================================================== */

export function isCustomersLaptopWidth(
  width: number,
): boolean {

  return isLaptopWidth(
    width,
  );

}


/* ===========================================================
   DESKTOP WIDTH
=========================================================== */

export function isCustomersDesktopWidth(
  width: number,
): boolean {

  return isDesktopWidth(
    width,
  );

}


/* ===========================================================
   WIDE DESKTOP WIDTH
=========================================================== */

export function isCustomersWideDesktopWidth(
  width: number,
): boolean {

  return isWideDesktopWidth(
    width,
  );

}


/* ===========================================================
   ULTRA WIDE WIDTH
=========================================================== */

export function isCustomersUltraWideWidth(
  width: number,
): boolean {

  return isUltraWideWidth(
    width,
  );

}


/* ===========================================================
   TV WIDTH
=========================================================== */

export function isCustomersTvWidth(
  width: number,
): boolean {

  return isTvWidth(
    width,
  );

}


/* ===========================================================
   VALID VIEWPORT WIDTH
=========================================================== */

export function isValidCustomersViewportWidth(
  width: number,
): boolean {

  return isValidViewportWidth(
    width,
  );

}


/* ===========================================================
   END
=========================================================== */

