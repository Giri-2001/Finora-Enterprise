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
   1600px → 1919px

   WIDE DESKTOP
   1920px → 2559px

   ULTRA WIDE
   2560px → 3839px

   TV
   3840px+
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
  DESKTOP_MAX_WIDTH,

  WIDE_DESKTOP_MIN_WIDTH,
  WIDE_DESKTOP_MAX_WIDTH,

  ULTRA_WIDE_MIN_WIDTH,
  ULTRA_WIDE_MAX_WIDTH,

  TV_MIN_WIDTH,

  isValidViewportWidth,
} from "./breakpoints";

import type {
  DeviceType,
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
    width: getSafeWidth(width),
    height: getSafeHeight(height),
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
     TV
  ========================================================= */

  if (
    safeWidth >= TV_MIN_WIDTH
  ) {
    return "tv";
  }


  /* =========================================================
     ULTRA WIDE
  ========================================================= */

  if (
    safeWidth >= ULTRA_WIDE_MIN_WIDTH &&
    safeWidth <= ULTRA_WIDE_MAX_WIDTH
  ) {
    return "ultraWide";
  }


  /* =========================================================
     WIDE DESKTOP
  ========================================================= */

  if (
    safeWidth >= WIDE_DESKTOP_MIN_WIDTH &&
    safeWidth <= WIDE_DESKTOP_MAX_WIDTH
  ) {
    return "wideDesktop";
  }


  /* =========================================================
     DESKTOP
  ========================================================= */

  if (
    safeWidth >= DESKTOP_MIN_WIDTH &&
    safeWidth <= DESKTOP_MAX_WIDTH
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
    safeWidth >= DESKTOP_MIN_WIDTH &&
    safeWidth <= DESKTOP_MAX_WIDTH
  );

}


/* ===========================================================
   WIDE DESKTOP
=========================================================== */

export function isWideDesktop(
  width: number,
): boolean {

  const safeWidth =
    getSafeWidth(width);

  return (
    safeWidth >= WIDE_DESKTOP_MIN_WIDTH &&
    safeWidth <= WIDE_DESKTOP_MAX_WIDTH
  );

}


/* ===========================================================
   ULTRA WIDE
=========================================================== */

export function isUltraWide(
  width: number,
): boolean {

  const safeWidth =
    getSafeWidth(width);

  return (
    safeWidth >= ULTRA_WIDE_MIN_WIDTH &&
    safeWidth <= ULTRA_WIDE_MAX_WIDTH
  );

}


/* ===========================================================
   TV
=========================================================== */

export function isTv(
  width: number,
): boolean {

  const safeWidth =
    getSafeWidth(width);

  return (
    safeWidth >= TV_MIN_WIDTH
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
): {
  device: DeviceType;

  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;

  isWideDesktop: boolean;
  isUltraWide: boolean;
  isTv: boolean;
} {

  const device =
    getDeviceType(width);

  return {

    device,

    isMobile:
      device === "mobile",

    isTablet:
      device === "tablet",

    isLaptop:
      device === "laptop",

    isDesktop:
      device === "desktop",

    isWideDesktop:
      device === "wideDesktop",

    isUltraWide:
      device === "ultraWide",

    isTv:
      device === "tv",

  };

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
   END
=========================================================== */