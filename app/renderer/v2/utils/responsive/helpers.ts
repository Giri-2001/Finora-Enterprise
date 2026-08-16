/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   HELPERS
=========================================================== */

import {
  DESKTOP_MIN_WIDTH,
  TABLET_MIN_WIDTH,
  TABLET_MAX_WIDTH,
  MOBILE_MAX_WIDTH,
} from "./breakpoints";

import type {
  DeviceType,
} from "./types";


/* ===========================================================
   DEVICE DETECTION
=========================================================== */

export function getDeviceType(
  width: number,
): DeviceType {

  if (
    width >= DESKTOP_MIN_WIDTH
  ) {

    return "desktop";

  }

  if (
    width >= TABLET_MIN_WIDTH &&
    width <= TABLET_MAX_WIDTH
  ) {

    return "tablet";

  }

  return "mobile";

}


/* ===========================================================
   DESKTOP
=========================================================== */

export function isDesktop(
  width: number,
): boolean {

  return (
    width >= DESKTOP_MIN_WIDTH
  );

}


/* ===========================================================
   TABLET
=========================================================== */

export function isTablet(
  width: number,
): boolean {

  return (
    width >= TABLET_MIN_WIDTH &&
    width <= TABLET_MAX_WIDTH
  );

}


/* ===========================================================
   MOBILE
=========================================================== */

export function isMobile(
  width: number,
): boolean {

  return (
    width >= 0 &&
    width <= MOBILE_MAX_WIDTH
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
   SAFE WIDTH
=========================================================== */

export function getSafeWidth(
  width: number,
): number {

  if (
    !Number.isFinite(width) ||
    width < 0
  ) {

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

  if (
    !Number.isFinite(height) ||
    height < 0
  ) {

    return 0;

  }

  return height;

}


/* ===========================================================
   END
=========================================================== */