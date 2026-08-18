/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   HELPERS

   RESPONSIBILITY:
   - Device classification
   - Safe viewport values
   - Device flags
   - Responsive state helpers

   IMPORTANT:
   - Visual values DO NOT belong here.
   - Breakpoint values come only from breakpoints.ts.
   - Visual tokens come only from tokens.ts.

   DEVICE SYSTEM:

   MOBILE
   0px → 767px

   TABLET
   768px → 1023px

   LAPTOP
   1024px → 1599px

   DESKTOP
   1600px+

   IMPORTANT:
   - Only 4 devices are supported.
   - No wideDesktop.
   - No ultraWide.
   - No tv.
   - No projector.
   - No smallLaptop.
   - No verySmallMobile.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  MOBILE_MIN_WIDTH,
  MOBILE_MAX_WIDTH,

  TABLET_MIN_WIDTH,
  TABLET_MAX_WIDTH,

  LAPTOP_MIN_WIDTH,
  LAPTOP_MAX_WIDTH,

  DESKTOP_MIN_WIDTH,

  isValidViewportWidth,
} from "./breakpoints";

import type {
  DeviceType,
  ResponsiveDeviceFlags,
} from "./types";


/* ===========================================================
   SAFE WIDTH
=========================================================== */

export function getSafeWidth(
  width: number,
): number {

  if (!Number.isFinite(width)) {
    return 0;
  }

  if (width < 0) {
    return 0;
  }

  return width;

}


/* ===========================================================
   SAFE HEIGHT
=========================================================== */

export function getSafeHeight(
  height: number,
): number {

  if (!Number.isFinite(height)) {
    return 0;
  }

  if (height < 0) {
    return 0;
  }

  return height;

}


/* ===========================================================
   SAFE VIEWPORT
=========================================================== */

export function getSafeViewport(
  width: number,
  height: number,
): {
  width: number;
  height: number;
} {

  return {

    width:
      getSafeWidth(width),

    height:
      getSafeHeight(height),

  };

}


/* ===========================================================
   DEVICE TYPE
=========================================================== */

export function getDeviceType(
  width: number,
): DeviceType {

  const safeWidth =
    getSafeWidth(width);


  /* =========================================================
     DESKTOP
  ========================================================= */

  if (
    safeWidth >= DESKTOP_MIN_WIDTH
  ) {
    return "desktop";
  }


  /* =========================================================
     LAPTOP
  ========================================================= */

  if (
    safeWidth >= LAPTOP_MIN_WIDTH &&
    safeWidth <= LAPTOP_MAX_WIDTH
  ) {
    return "laptop";
  }


  /* =========================================================
     TABLET
  ========================================================= */

  if (
    safeWidth >= TABLET_MIN_WIDTH &&
    safeWidth <= TABLET_MAX_WIDTH
  ) {
    return "tablet";
  }


  /* =========================================================
     MOBILE
  ========================================================= */

  return "mobile";

}


/* ===========================================================
   MOBILE
=========================================================== */

export function isMobile(
  width: number,
): boolean {

  const safeWidth =
    getSafeWidth(width);

  return (
    safeWidth >= MOBILE_MIN_WIDTH &&
    safeWidth <= MOBILE_MAX_WIDTH
  );

}


/* ===========================================================
   TABLET
=========================================================== */

export function isTablet(
  width: number,
): boolean {

  const safeWidth =
    getSafeWidth(width);

  return (
    safeWidth >= TABLET_MIN_WIDTH &&
    safeWidth <= TABLET_MAX_WIDTH
  );

}


/* ===========================================================
   LAPTOP
=========================================================== */

export function isLaptop(
  width: number,
): boolean {

  const safeWidth =
    getSafeWidth(width);

  return (
    safeWidth >= LAPTOP_MIN_WIDTH &&
    safeWidth <= LAPTOP_MAX_WIDTH
  );

}


/* ===========================================================
   DESKTOP
=========================================================== */

export function isDesktop(
  width: number,
): boolean {

  const safeWidth =
    getSafeWidth(width);

  return (
    safeWidth >= DESKTOP_MIN_WIDTH
  );

}


/* ===========================================================
   DEVICE CHECK
=========================================================== */

export function isDevice(
  width: number,
  device: DeviceType,
): boolean {

  return (
    getDeviceType(width) === device
  );

}


/* ===========================================================
   DEVICE FLAGS
=========================================================== */

export function getDeviceFlags(
  width: number,
): ResponsiveDeviceFlags {

  const device =
    getDeviceType(width);

  return {

    isMobile:
      device === "mobile",

    isTablet:
      device === "tablet",

    isLaptop:
      device === "laptop",

    isDesktop:
      device === "desktop",

  };

}


/* ===========================================================
   DEVICE INDEX
=========================================================== */

export function getDeviceIndex(
  device: DeviceType,
): 0 | 1 | 2 | 3 {

  switch (device) {

    case "mobile":
      return 0;

    case "tablet":
      return 1;

    case "laptop":
      return 2;

    case "desktop":
      return 3;

    default:
      return 0;

  }

}


/* ===========================================================
   VIEWPORT TYPE
=========================================================== */

export function getResponsiveViewport(
  width: number,
): DeviceType {

  return getDeviceType(width);

}


/* ===========================================================
   VIEWPORT VALIDATION
=========================================================== */

export function isValidWidth(
  width: number,
): boolean {

  return isValidViewportWidth(width);

}


/* ===========================================================
   RESPONSIVE DEVICE FLAGS
=========================================================== */

export function getResponsiveDeviceFlags(
  width: number,
): ResponsiveDeviceFlags {

  return getDeviceFlags(width);

}


/* ===========================================================
   END
=========================================================== */