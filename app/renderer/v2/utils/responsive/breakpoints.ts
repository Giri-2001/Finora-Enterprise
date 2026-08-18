/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   BREAKPOINTS

   RESPONSIBILITY:
   - Responsive breakpoint constants
   - Device classification
   - Width validation
   - Breakpoint map
   - Device helper functions

   DEVICE SYSTEM:

   01. MOBILE
   02. TABLET
   03. LAPTOP
   04. DESKTOP

   IMPORTANT:
   - This is the single source of truth for device breakpoints.
   - No wideDesktop.
   - No ultraWide.
   - No tv.
   - No projector.
   - No visual styling values.
   - No token values.
=========================================================== */

import type {
  DeviceType,
  ResponsiveBreakpoint,
  ResponsiveBreakpointMap,
  ResponsiveDeviceIndex,
} from "./types";


/* ===========================================================
   DEVICE NAMES

   These constants are intentionally kept as strings so every
   responsive module uses the same canonical device names.
=========================================================== */

export const MOBILE: DeviceType =
  "mobile";

export const TABLET: DeviceType =
  "tablet";

export const LAPTOP: DeviceType =
  "laptop";

export const DESKTOP: DeviceType =
  "desktop";


/* ===========================================================
   DEVICE MINIMUM WIDTHS

   These values define where each device class begins.

   Mobile:
   0px+

   Tablet:
   768px+

   Laptop:
   1024px+

   Desktop:
   1440px+
=========================================================== */

export const MOBILE_MIN_WIDTH =
  0;

export const TABLET_MIN_WIDTH =
  768;

export const LAPTOP_MIN_WIDTH =
  1024;

export const DESKTOP_MIN_WIDTH =
  1440;


/* ===========================================================
   DEVICE MAXIMUM WIDTHS

   The maximum width is derived from the next device boundary.

   Desktop has no upper limit.
=========================================================== */

export const MOBILE_MAX_WIDTH =
  TABLET_MIN_WIDTH - 1;

export const TABLET_MAX_WIDTH =
  LAPTOP_MIN_WIDTH - 1;

export const LAPTOP_MAX_WIDTH =
  DESKTOP_MIN_WIDTH - 1;


/* ===========================================================
   BREAKPOINT MAP

   Single canonical 4-device breakpoint map.

   No additional device classifications are permitted.
=========================================================== */

export const RESPONSIVE_BREAKPOINTS:
  ResponsiveBreakpointMap = {

  mobile: {
    minWidth:
      MOBILE_MIN_WIDTH,

    maxWidth:
      MOBILE_MAX_WIDTH,
  },

  tablet: {
    minWidth:
      TABLET_MIN_WIDTH,

    maxWidth:
      TABLET_MAX_WIDTH,
  },

  laptop: {
    minWidth:
      LAPTOP_MIN_WIDTH,

    maxWidth:
      LAPTOP_MAX_WIDTH,
  },

  desktop: {
    minWidth:
      DESKTOP_MIN_WIDTH,

    maxWidth:
      null,
  },

};


/* ===========================================================
   ALIAS

   Kept as a semantic export for consumers that refer to the
   breakpoint configuration as a map.
=========================================================== */

export const BREAKPOINTS:
  ResponsiveBreakpointMap =
  RESPONSIVE_BREAKPOINTS;


/* ===========================================================
   WIDTH VALIDATION
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
   MOBILE WIDTH
=========================================================== */

export function isMobileWidth(
  width: number,
): boolean {

  return (
    isValidViewportWidth(width) &&
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
    isValidViewportWidth(width) &&
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
    isValidViewportWidth(width) &&
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
    isValidViewportWidth(width) &&
    width >= DESKTOP_MIN_WIDTH
  );

}


/* ===========================================================
   DEVICE CLASSIFICATION

   This is the single authoritative width -> device resolver.
=========================================================== */

export function getDeviceType(
  width: number,
): DeviceType {

  if (
    width < TABLET_MIN_WIDTH
  ) {
    return MOBILE;
  }

  if (
    width < LAPTOP_MIN_WIDTH
  ) {
    return TABLET;
  }

  if (
    width < DESKTOP_MIN_WIDTH
  ) {
    return LAPTOP;
  }

  return DESKTOP;

}


/* ===========================================================
   DEVICE INDEX

   0 = Mobile
   1 = Tablet
   2 = Laptop
   3 = Desktop
=========================================================== */

export function getDeviceIndex(
  device: DeviceType,
): ResponsiveDeviceIndex {

  switch (device) {

    case MOBILE:
      return 0;

    case TABLET:
      return 1;

    case LAPTOP:
      return 2;

    case DESKTOP:
      return 3;

    default:
      return 0;

  }

}


/* ===========================================================
   DEVICE BREAKPOINT

   Returns the canonical breakpoint definition for a device.
=========================================================== */

export function getBreakpoint(
  device: DeviceType,
): ResponsiveBreakpoint {

  return RESPONSIVE_BREAKPOINTS[device];

}


/* ===========================================================
   DEVICE MINIMUM WIDTH
=========================================================== */

export function getMinWidth(
  device: DeviceType,
): number {

  return RESPONSIVE_BREAKPOINTS[device].minWidth;

}


/* ===========================================================
   DEVICE MAXIMUM WIDTH
=========================================================== */

export function getMaxWidth(
  device: DeviceType,
): number | null {

  return RESPONSIVE_BREAKPOINTS[device].maxWidth;

}


/* ===========================================================
   WIDTH -> BREAKPOINT MATCH
=========================================================== */

export function isWidthInBreakpoint(
  width: number,
  breakpoint: ResponsiveBreakpoint,
): boolean {

  if (
    !isValidViewportWidth(width)
  ) {
    return false;
  }

  if (
    width < breakpoint.minWidth
  ) {
    return false;
  }

  if (
    breakpoint.maxWidth !== null &&
    width > breakpoint.maxWidth
  ) {
    return false;
  }

  return true;

}


/* ===========================================================
   DEVICE CHECK

   Generic helper for consumers that already know the device.
=========================================================== */

export function isDeviceWidth(
  width: number,
  device: DeviceType,
): boolean {

  return isWidthInBreakpoint(
    width,
    RESPONSIVE_BREAKPOINTS[device],
  );

}


/* ===========================================================
   DEVICE ORDER

   Useful for responsive comparisons without introducing
   additional device classifications.
=========================================================== */

export const DEVICE_ORDER:
  readonly DeviceType[] = [
    MOBILE,
    TABLET,
    LAPTOP,
    DESKTOP,
];


/* ===========================================================
   DEVICE COUNT
=========================================================== */

export const RESPONSIVE_DEVICE_COUNT =
  DEVICE_ORDER.length;


/* ===========================================================
   BREAKPOINT RESOLUTION

   Returns the breakpoint matching the supplied viewport width.
=========================================================== */

export function getBreakpointForWidth(
  width: number,
): ResponsiveBreakpoint {

  const device =
    getDeviceType(width);

  return RESPONSIVE_BREAKPOINTS[device];

}


/* ===========================================================
   END
=========================================================== */