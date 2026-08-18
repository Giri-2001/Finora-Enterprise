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

  isCustomersMobileWidth,
  isCustomersTabletWidth,
  isCustomersLaptopWidth,
  isCustomersDesktopWidth,

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

   Customers uses the same canonical device classification
   as the global Responsive Engine.

   No customer-specific device classes are introduced here.
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


  return "desktop";

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

   0 = Mobile
   1 = Tablet
   2 = Laptop
   3 = Desktop
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

    default:
      return 0;

  }

}


/* ===========================================================
   VIEWPORT RESOLUTION

   Customer viewport classification intentionally follows
   the canonical four-device responsive system.

   No secondary viewport classifications are introduced.

   MOBILE
   0px → 767px

   TABLET
   768px → 1023px

   LAPTOP
   1024px → 1439px

   DESKTOP
   1440px+
=========================================================== */

export function getCustomerViewport(
  width: number,
): ResponsiveViewport {

  const normalizedWidth =
    normalizeCustomerWidth(
      width,
    );


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


  if (
    normalizedWidth <=
    CUSTOMERS_LAPTOP_MAX_WIDTH
  ) {

    return "laptop";

  }


  return "desktop";

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
    )
  );

}


/* ===========================================================
   DESKTOP OR ABOVE
=========================================================== */

export function isCustomerDesktopOrAbove(
  width: number,
): boolean {

  return isCustomerDesktop(
    width,
  );

}


/* ===========================================================
   LARGE DISPLAY CHECK
=========================================================== */

export function isCustomerLargeDisplay(
  width: number,
): boolean {

  return isCustomerDesktop(
    width,
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

    width === CUSTOMERS_DESKTOP_MIN_WIDTH
  );

}


/* ===========================================================
   END
=========================================================== */