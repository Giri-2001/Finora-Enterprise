/* ===========================================================
   FINORA ENTERPRISE OS™

   ACCOUNTS ENGINE™

   ACCOUNTS RESPONSIVE HOOK

   MODULE  : Accounts
   LAYER   : Responsive Hook
   VERSION : 1.1
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Consume canonical FINORA Responsive Engine state
   - Read live viewport width / height
   - Reuse canonical FINORA device classification
   - Reuse canonical FINORA responsive tokens
   - Resolve Accounts structural layout
   - Expose four Accounts device flags
   - Publish Accounts responsive CSS variables
   - React to live viewport changes

   FINORA DEVICE SYSTEM:

   mobile
   tablet
   laptop
   desktop

   IMPORTANT:

   - No local breakpoints.
   - No window.innerWidth access here.
   - No resize listener here.
   - No @media queries.
   - No theme colors.
   - No financial calculations.
   - No repository access.
   - No JSX inline styles.

   Canonical FINORA useResponsive() remains authoritative.
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import { useEffect, useMemo } from "react";

import { useResponsive } from "../useResponsive";

import { applyAccountsResponsiveCssVariables } from "./accounts.cssVariables";

import { createAccountsLayout } from "./accounts.layout";

import type {
  AccountsResponsiveDevice,
  AccountsResponsiveValue,
} from "./accounts.types";

/* ===========================================================
   SAFE VIEWPORT VALUE

   Defensive only.

   Device classification still comes exclusively from
   canonical FINORA useResponsive().
=========================================================== */

function getSafeViewportValue(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

/* ===========================================================
   HOOK
=========================================================== */

export function useAccountsResponsive(): AccountsResponsiveValue {
  /* =========================================================
     CANONICAL FINORA RESPONSIVE STATE
  ========================================================= */

  const responsive = useResponsive();

  /* =========================================================
     SAFE VIEWPORT
  ========================================================= */

  const width = getSafeViewportValue(responsive.width);

  const height = getSafeViewportValue(responsive.height);

  /* =========================================================
     CANONICAL DEVICE

     FINORA DeviceType and AccountsResponsiveDevice share the
     exact same four-value contract:

     mobile
     tablet
     laptop
     desktop

     Therefore no Accounts breakpoint resolver is required.
  ========================================================= */

  const device: AccountsResponsiveDevice = responsive.device;

  /* =========================================================
     ACCOUNTS STRUCTURAL LAYOUT
  ========================================================= */

  const layout = useMemo(
    () =>
      createAccountsLayout({
        width,

        height,

        tokens: responsive.tokens,

        device,
      }),
    [device, height, responsive.tokens, width],
  );

  /* =========================================================
     COMPLETE ACCOUNTS RESPONSIVE VALUE

     Memoized so:
     - component consumers receive a stable object
     - CSS variable publication runs only when real responsive
       inputs change
  ========================================================= */

  const accountsResponsive = useMemo<AccountsResponsiveValue>(
    () => ({
      width,

      height,

      device,

      tokens: responsive.tokens,

      layout,

      isMobile: responsive.isMobile,

      isTablet: responsive.isTablet,

      isLaptop: responsive.isLaptop,

      isDesktop: responsive.isDesktop,
    }),
    [
      device,
      height,
      layout,
      responsive.isDesktop,
      responsive.isLaptop,
      responsive.isMobile,
      responsive.isTablet,
      responsive.tokens,
      width,
    ],
  );

  /* =========================================================
     PUBLISH ACCOUNTS RESPONSIVE CSS VARIABLES

     This is the bridge that allows Accounts JSX to use only:

     className="..."

     instead of:

     style={...}

     Device classification and geometry remain authoritative
     in the FINORA / Accounts Responsive Engine.
  ========================================================= */

  useEffect(() => {
    applyAccountsResponsiveCssVariables(accountsResponsive);
  }, [accountsResponsive]);

  /* =========================================================
     RETURN
  ========================================================= */

  return accountsResponsive;
}

/* ===========================================================
   DEFAULT EXPORT

   Named export remains preferred.

   Default export is retained for convenient module imports.
=========================================================== */

export default useAccountsResponsive;

/* ===========================================================
   END
=========================================================== */
