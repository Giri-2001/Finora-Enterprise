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

   DEVICE SYSTEM:
   01. MOBILE
   02. TABLET
   03. LAPTOP
   04. DESKTOP
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

  MOBILE_MIN_WIDTH,
  MOBILE_MAX_WIDTH,

  TABLET_MIN_WIDTH,
  TABLET_MAX_WIDTH,

  LAPTOP_MIN_WIDTH,
  LAPTOP_MAX_WIDTH,

  DESKTOP_MIN_WIDTH,

  isMobileWidth,
  isTabletWidth,
  isLaptopWidth,
  isDesktopWidth,

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

export const CUSTOMERS_MOBILE_MIN_WIDTH: number =
  MOBILE_MIN_WIDTH;

export const CUSTOMERS_MOBILE_MAX_WIDTH: number =
  MOBILE_MAX_WIDTH;


/* ===========================================================
   TABLET
=========================================================== */

export const CUSTOMERS_TABLET_MIN_WIDTH: number =
  TABLET_MIN_WIDTH;

export const CUSTOMERS_TABLET_MAX_WIDTH: number =
  TABLET_MAX_WIDTH;


/* ===========================================================
   LAPTOP
=========================================================== */

export const CUSTOMERS_LAPTOP_MIN_WIDTH: number =
  LAPTOP_MIN_WIDTH;

export const CUSTOMERS_LAPTOP_MAX_WIDTH: number =
  LAPTOP_MAX_WIDTH;


/* ===========================================================
   DESKTOP
=========================================================== */

export const CUSTOMERS_DESKTOP_MIN_WIDTH: number =
  DESKTOP_MIN_WIDTH;


/* ===========================================================
   BREAKPOINT OBJECTS
=========================================================== */

export const CUSTOMERS_MOBILE:
  CustomersBreakpoint = {

  minWidth:
    CUSTOMERS_MOBILE_MIN_WIDTH,

  maxWidth:
    CUSTOMERS_MOBILE_MAX_WIDTH,

};


export const CUSTOMERS_TABLET:
  CustomersBreakpoint = {

  minWidth:
    CUSTOMERS_TABLET_MIN_WIDTH,

  maxWidth:
    CUSTOMERS_TABLET_MAX_WIDTH,

};


export const CUSTOMERS_LAPTOP:
  CustomersBreakpoint = {

  minWidth:
    CUSTOMERS_LAPTOP_MIN_WIDTH,

  maxWidth:
    CUSTOMERS_LAPTOP_MAX_WIDTH,

};


export const CUSTOMERS_DESKTOP:
  CustomersBreakpoint = {

  minWidth:
    CUSTOMERS_DESKTOP_MIN_WIDTH,

  maxWidth:
    null,

};


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