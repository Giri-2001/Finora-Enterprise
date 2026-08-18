/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER RESPONSIVE ENGINE™

   HELPERS

   RESPONSIBILITY:
   - Customer responsive helper functions ONLY
   - Resolve customer device profile
   - Resolve customer viewport profile
   - Read customer breakpoint boundaries
   - Provide safe width/height checks
   - Provide customer responsive utility helpers

   IMPORTANT:
   - No visual tokens
   - No component styling
   - No hard-coded customer layout dimensions
   - Breakpoint values come ONLY from customers.breakpoints.ts
   - Global responsive contracts come ONLY from ../types
   - This file contains logic only
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  DeviceType,
  ResponsiveDevice,
  ResponsiveDeviceIndex,
  ResponsiveViewport,
  ViewportSize,
} from "../types";


import {
  CUSTOMERS_MOBILE_MIN_WIDTH,
  CUSTOMERS_MOBILE_MAX_WIDTH,

  CUSTOMERS_TABLET_MIN_WIDTH,
  CUSTOMERS_TABLET_MAX_WIDTH,

  CUSTOMERS_LAPTOP_MIN_WIDTH,
  CUSTOMERS_LAPTOP_MAX_WIDTH,

  CUSTOMERS_DESKTOP_MIN_WIDTH,
  CUSTOMERS_DESKTOP_MAX_WIDTH,

  CUSTOMERS_WIDE_DESKTOP_MIN_WIDTH,
  CUSTOMERS_WIDE_DESKTOP_MAX_WIDTH,

  CUSTOMERS_ULTRA_WIDE_MIN_WIDTH,
  CUSTOMERS_ULTRA_WIDE_MAX_WIDTH,

  CUSTOMERS_TV_MIN_WIDTH,

  isCustomersMobileWidth,
  isCustomersTabletWidth,
  isCustomersLaptopWidth,
  isCustomersDesktopWidth,
  isCustomersWideDesktopWidth,
  isCustomersUltraWideWidth,
  isCustomersTvWidth,

  isValidCustomersViewportWidth,

} from "./customers.breakpoints";


/* ===========================================================
   WIDTH NORMALIZATION
=========================================================== */

export function normalizeCustomerWidth(
  width: number,
): number {

  if (
    !Number.isFinite(width)
  ) {

    return 0;

  }

  return Math.max(
    0,
    width,
  );

}


/* ===========================================================
   HEIGHT NORMALIZATION
=========================================================== */

export function normalizeCustomerHeight(
  height: number,
): number {

  if (
    !Number.isFinite(height)
  ) {

    return 0;

  }

  return Math.max(
    0,
    height,
  );

}


/* ===========================================================
   VIEWPORT SIZE NORMALIZATION
=========================================================== */

export function normalizeCustomerViewport(
  viewport: ViewportSize,
): ViewportSize {

  return {

    width:
      normalizeCustomerWidth(
        viewport.width,
      ),

    height:
      normalizeCustomerHeight(
        viewport.height,
      ),

  };

}


/* ===========================================================
   DEVICE RESOLUTION
=========================================================== */

export function getCustomerDevice(
  width: number,
): DeviceType {

  const normalizedWidth =
    normalizeCustomerWidth(
      width,
    );


  if (
    isCustomersMobileWidth(
      normalizedWidth,
    )
  ) {

    return "mobile";

  }


  if (
    isCustomersTabletWidth(
      normalizedWidth,
    )
  ) {

    return "tablet";

  }


  if (
    isCustomersLaptopWidth(
      normalizedWidth,
    )
  ) {

    return "laptop";

  }


  if (
    isCustomersDesktopWidth(
      normalizedWidth,
    )
  ) {

    return "desktop";

  }


  if (
    isCustomersWideDesktopWidth(
      normalizedWidth,
    )
  ) {

    return "wideDesktop";

  }


  if (
    isCustomersUltraWideWidth(
      normalizedWidth,
    )
  ) {

    return "ultraWide";

  }


  if (
    isCustomersTvWidth(
      normalizedWidth,
    )
  ) {

    return "tv";

  }


  return "mobile";

}


/* ===========================================================
   RESPONSIVE DEVICE RESOLUTION
=========================================================== */

export function resolveCustomerDevice(
  width: number,
): ResponsiveDevice {

  return getCustomerDevice(
    width,
  );

}


/* ===========================================================
   DEVICE INDEX
=========================================================== */

export function getCustomerDeviceIndex(
  device: DeviceType,
): ResponsiveDeviceIndex {

  switch (device) {

    case "mobile":
      return 0;

    case "tablet":
      return 1;

    case "laptop":
      return 2;

    case "desktop":
      return 3;

    case "wideDesktop":
      return 4;

    case "ultraWide":
      return 5;

    case "tv":
      return 6;

    default:
      return 0;

  }

}


/* ===========================================================
   VIEWPORT RESOLUTION
=========================================================== */

export function getCustomerViewport(
  width: number,
): ResponsiveViewport {

  const normalizedWidth =
    normalizeCustomerWidth(
      width,
    );


  /*
   * Customer viewport classification uses only the
   * breakpoint boundaries exposed by customers.breakpoints.ts.
   *
   * No independent numeric breakpoint values are defined here.
   */


  if (
    normalizedWidth <
    CUSTOMERS_MOBILE_MIN_WIDTH
  ) {

    return "verySmallMobile";

  }


  if (
    normalizedWidth <=
    CUSTOMERS_MOBILE_MAX_WIDTH
  ) {

    return "mobile";

  }


  if (
    normalizedWidth <=
    CUSTOMERS_TABLET_MAX_WIDTH
  ) {

    return "tablet";

  }


  /*
   * The laptop device range can contain a more detailed
   * smallLaptop viewport profile.
   *
   * The boundary itself comes from the central breakpoint
   * engine.
   */

  if (
    normalizedWidth >=
    CUSTOMERS_LAPTOP_MIN_WIDTH &&
    normalizedWidth <
    CUSTOMERS_LAPTOP_MAX_WIDTH
  ) {

    return "smallLaptop";

  }


  if (
    normalizedWidth <=
    CUSTOMERS_LAPTOP_MAX_WIDTH
  ) {

    return "laptop";

  }


  if (
    normalizedWidth <=
    CUSTOMERS_DESKTOP_MAX_WIDTH
  ) {

    return "desktop";

  }


  if (
    normalizedWidth <=
    CUSTOMERS_WIDE_DESKTOP_MAX_WIDTH
  ) {

    return "wideDesktop";

  }


  if (
    normalizedWidth <=
    CUSTOMERS_ULTRA_WIDE_MAX_WIDTH
  ) {

    return "ultraWide";

  }


  /*
   * TV / projector-sized viewport.
   */

  return "projector";

}


/* ===========================================================
   RESPONSIVE VIEWPORT RESOLVER
=========================================================== */

export function resolveCustomerViewport(
  width: number,
): ResponsiveViewport {

  return getCustomerViewport(
    width,
  );

}


/* ===========================================================
   MOBILE CHECK
=========================================================== */

export function isCustomerMobile(
  width: number,
): boolean {

  return isCustomersMobileWidth(
    width,
  );

}


/* ===========================================================
   TABLET CHECK
=========================================================== */

export function isCustomerTablet(
  width: number,
): boolean {

  return isCustomersTabletWidth(
    width,
  );

}


/* ===========================================================
   LAPTOP CHECK
=========================================================== */

export function isCustomerLaptop(
  width: number,
): boolean {

  return isCustomersLaptopWidth(
    width,
  );

}


/* ===========================================================
   DESKTOP CHECK
=========================================================== */

export function isCustomerDesktop(
  width: number,
): boolean {

  return isCustomersDesktopWidth(
    width,
  );

}


/* ===========================================================
   WIDE DESKTOP CHECK
=========================================================== */

export function isCustomerWideDesktop(
  width: number,
): boolean {

  return isCustomersWideDesktopWidth(
    width,
  );

}


/* ===========================================================
   ULTRA WIDE CHECK
=========================================================== */

export function isCustomerUltraWide(
  width: number,
): boolean {

  return isCustomersUltraWideWidth(
    width,
  );

}


/* ===========================================================
   TV CHECK
=========================================================== */

export function isCustomerTv(
  width: number,
): boolean {

  return isCustomersTvWidth(
    width,
  );

}


/* ===========================================================
   VALID VIEWPORT CHECK
=========================================================== */

export function isValidCustomerViewportWidth(
  width: number,
): boolean {

  return isValidCustomersViewportWidth(
    width,
  );

}


/* ===========================================================
   VIEWPORT OBJECT CHECK
=========================================================== */

export function isValidCustomerViewport(
  viewport: ViewportSize,
): boolean {

  if (
    !viewport
  ) {

    return false;

  }


  return (
    isValidCustomersViewportWidth(
      viewport.width,
    ) &&
    Number.isFinite(
      viewport.height,
    ) &&
    viewport.height >= 0
  );

}


/* ===========================================================
   DEVICE FLAGS
=========================================================== */

export function getCustomerDeviceFlags(
  width: number,
): {

  isMobile: boolean;

  isTablet: boolean;

  isLaptop: boolean;

  isDesktop: boolean;

  isWideDesktop: boolean;

  isUltraWide: boolean;

  isTv: boolean;

} {

  return {

    isMobile:
      isCustomerMobile(
        width,
      ),

    isTablet:
      isCustomerTablet(
        width,
      ),

    isLaptop:
      isCustomerLaptop(
        width,
      ),

    isDesktop:
      isCustomerDesktop(
        width,
      ),

    isWideDesktop:
      isCustomerWideDesktop(
        width,
      ),

    isUltraWide:
      isCustomerUltraWide(
        width,
      ),

    isTv:
      isCustomerTv(
        width,
      ),

  };

}


/* ===========================================================
   MOBILE OR TABLET
=========================================================== */

export function isCustomerMobileOrTablet(
  width: number,
): boolean {

  return (
    isCustomerMobile(
      width,
    ) ||
    isCustomerTablet(
      width,
    )
  );

}


/* ===========================================================
   LAPTOP OR ABOVE
=========================================================== */

export function isCustomerLaptopOrAbove(
  width: number,
): boolean {

  return (
    isCustomerLaptop(
      width,
    ) ||
    isCustomerDesktop(
      width,
    ) ||
    isCustomerWideDesktop(
      width,
    ) ||
    isCustomerUltraWide(
      width,
    ) ||
    isCustomerTv(
      width,
    )
  );

}


/* ===========================================================
   DESKTOP OR ABOVE
=========================================================== */

export function isCustomerDesktopOrAbove(
  width: number,
): boolean {

  return (
    isCustomerDesktop(
      width,
    ) ||
    isCustomerWideDesktop(
      width,
    ) ||
    isCustomerUltraWide(
      width,
    ) ||
    isCustomerTv(
      width,
    )
  );

}


/* ===========================================================
   LARGE DISPLAY CHECK
=========================================================== */

export function isCustomerLargeDisplay(
  width: number,
): boolean {

  return (
    isCustomerWideDesktop(
      width,
    ) ||
    isCustomerUltraWide(
      width,
    ) ||
    isCustomerTv(
      width,
    )
  );

}


/* ===========================================================
   PROJECTOR / TV CHECK
=========================================================== */

export function isCustomerProjectorViewport(
  width: number,
): boolean {

  return (
    normalizeCustomerWidth(
      width,
    ) >=
    CUSTOMERS_TV_MIN_WIDTH
  );

}


/* ===========================================================
   CUSTOMER BREAKPOINT NAME
=========================================================== */

export function getCustomerBreakpointName(
  width: number,
): DeviceType {

  return getCustomerDevice(
    width,
  );

}


/* ===========================================================
   CUSTOMER RESPONSIVE PROFILE
=========================================================== */

export function getCustomerResponsiveProfile(
  width: number,
): {

  device: DeviceType;

  viewport: ResponsiveViewport;

  index: ResponsiveDeviceIndex;

} {

  const device =
    getCustomerDevice(
      width,
    );

  const viewport =
    getCustomerViewport(
      width,
    );

  const index =
    getCustomerDeviceIndex(
      device,
    );


  return {

    device,

    viewport,

    index,

  };

}


/* ===========================================================
   CUSTOMER WIDTH RANGE CHECK
=========================================================== */

export function isCustomerWidthBetween(
  width: number,
  minWidth: number,
  maxWidth: number | null,
): boolean {

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(minWidth)
  ) {

    return false;

  }


  if (
    width <
    minWidth
  ) {

    return false;

  }


  if (
    maxWidth !== null &&
    (
      !Number.isFinite(maxWidth) ||
      width >
      maxWidth
    )
  ) {

    return false;

  }


  return true;

}


/* ===========================================================
   CUSTOMER BREAKPOINT BOUNDARY CHECK
=========================================================== */

export function isCustomerBreakpointBoundary(
  width: number,
): boolean {

  return (
    width === CUSTOMERS_MOBILE_MIN_WIDTH ||
    width === CUSTOMERS_MOBILE_MAX_WIDTH ||

    width === CUSTOMERS_TABLET_MIN_WIDTH ||
    width === CUSTOMERS_TABLET_MAX_WIDTH ||

    width === CUSTOMERS_LAPTOP_MIN_WIDTH ||
    width === CUSTOMERS_LAPTOP_MAX_WIDTH ||

    width === CUSTOMERS_DESKTOP_MIN_WIDTH ||
    width === CUSTOMERS_DESKTOP_MAX_WIDTH ||

    width === CUSTOMERS_WIDE_DESKTOP_MIN_WIDTH ||
    width === CUSTOMERS_WIDE_DESKTOP_MAX_WIDTH ||

    width === CUSTOMERS_ULTRA_WIDE_MIN_WIDTH ||
    width === CUSTOMERS_ULTRA_WIDE_MAX_WIDTH ||

    width === CUSTOMERS_TV_MIN_WIDTH
  );

}


/* ===========================================================
   END
=========================================================== */