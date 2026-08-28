/* ===========================================================
   FINORA ENTERPRISE OS™

   GOLD LOAN ENGINE™

   GOLD LOAN RESPONSIVE HOOK

   MODULE  : Gold Loan
   LAYER   : Responsive Hook
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Consume canonical FINORA useResponsive()
   - Read live viewport dimensions
   - Resolve Gold Loan four-device tier
   - Resolve Gold Loan device flags
   - Resolve Gold Loan layout geometry
   - Expose canonical FINORA responsive tokens
   - Keep Gold Loan components free from window access

   IMPORTANT:

   - No direct window.innerWidth.
   - No direct window.innerHeight.
   - No resize listeners.
   - No media queries.
   - No theme logic.
   - No component-specific styling.
   - Global FINORA Responsive Engine remains authoritative.

   DEVICE MODEL:

   MOBILE   : 0 - 767
   TABLET   : 768 - 1023
   LAPTOP   : 1024 - 1599
   DESKTOP  : 1600+

=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import { useMemo } from "react";

import { useResponsive } from "../useResponsive";

import { createGoldLoanLayout } from "./goldLoan.layout";

import {
  getSafeGoldLoanViewportHeight,
  getSafeGoldLoanViewportWidth,
  resolveGoldLoanDevice,
  resolveGoldLoanDeviceFlags,
} from "./goldLoan.helpers";

import type { GoldLoanResponsiveValue } from "./goldLoan.types";

/* ===========================================================
   HOOK
=========================================================== */

export function useGoldLoanResponsive(): GoldLoanResponsiveValue {
  /* =========================================================
     CANONICAL FINORA RESPONSIVE STATE
  ========================================================= */

  const responsive = useResponsive();

  /* =========================================================
     SAFE VIEWPORT
  ========================================================= */

  const width = getSafeGoldLoanViewportWidth(responsive.width);

  const height = getSafeGoldLoanViewportHeight(responsive.height);

  /* =========================================================
     GOLD LOAN DEVICE

     Gold Loan intentionally resolves its four supported
     presentation tiers from the canonical live viewport.

     This prevents module components from creating their own
     breakpoint conditions.
  ========================================================= */

  const device = useMemo(() => resolveGoldLoanDevice(width), [width]);

  /* =========================================================
     DEVICE FLAGS
  ========================================================= */

  const flags = useMemo(() => resolveGoldLoanDeviceFlags(device), [device]);

  /* =========================================================
     GOLD LOAN LAYOUT
  ========================================================= */

  const layout = useMemo(
    () =>
      createGoldLoanLayout({
        width,

        height,

        tokens: responsive.tokens,

        device,
      }),
    [device, height, responsive.tokens, width],
  );

  /* =========================================================
     RESULT
  ========================================================= */

  return {
    width,

    height,

    device,

    tokens: responsive.tokens,

    layout,

    isMobile: flags.isMobile,

    isTablet: flags.isTablet,

    isLaptop: flags.isLaptop,

    isDesktop: flags.isDesktop,
  };
}

/* ===========================================================
   DEFAULT EXPORT

   Named export remains preferred.

   Default export is provided only to keep module consumption
   flexible where FINORA page architecture prefers it.
=========================================================== */

export default useGoldLoanResponsive;

/* ===========================================================
   END
=========================================================== */
