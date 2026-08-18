/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   RESPONSIVE HOOK

   RESPONSIBILITY:
   - Read live viewport dimensions
   - Track viewport changes
   - Resolve current FINORA device tier
   - Resolve current detailed viewport profile
   - Resolve current responsive tokens
   - Expose responsive device flags
   - Provide safe viewport values

   IMPORTANT:
   - No visual values belong here.
   - Breakpoint boundaries belong to breakpoints.ts.
   - Device classification belongs to helpers.ts.
   - Visual tokens belong to tokens.ts.
   - Layout calculations belong to layout.ts.
   - Shared contracts belong to types.ts.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import {
  useEffect,
  useState,
} from "react";


import {
  getDeviceType,
  getDeviceFlags,
  getSafeViewport,
  getResponsiveViewport,
} from "./helpers";


import {
  getResponsiveViewportTokens,
} from "./tokens";


import type {
  ResponsiveState,
  ResponsiveViewport,
} from "./types";


/* ===========================================================
   VIEWPORT SIZE
=========================================================== */

interface ViewportSize {

  width:
    number;

  height:
    number;

}


/* ===========================================================
   VIEWPORT READER
=========================================================== */

function getViewportSize(): ViewportSize {

  if (
    typeof window === "undefined"
  ) {

    return {

      width:
        0,

      height:
        0,

    };

  }


  return getSafeViewport(
    window.innerWidth,
    window.innerHeight,
  );

}


/* ===========================================================
   HOOK
=========================================================== */

export default function useResponsive():
  ResponsiveState {

  const [
    viewportSize,
    setViewportSize,
  ] = useState<ViewportSize>(
    getViewportSize,
  );


  /* =========================================================
     VIEWPORT LISTENER
  ========================================================= */

  useEffect(() => {

    if (
      typeof window === "undefined"
    ) {

      return undefined;

    }


    const handleResize = (): void => {

      const nextViewport =
        getViewportSize();


      setViewportSize(
        previous => {

          if (
            previous.width ===
              nextViewport.width &&
            previous.height ===
              nextViewport.height
          ) {

            return previous;

          }


          return nextViewport;

        },
      );

    };


    /*
      Synchronize immediately after mount.
    */

    handleResize();


    window.addEventListener(
      "resize",
      handleResize,
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleResize,
      );

    };

  }, []);


  /* ===========================================================
     DEVICE
  =========================================================== */

  const device =
    getDeviceType(
      viewportSize.width,
    );


  /* ===========================================================
     DEVICE FLAGS
  =========================================================== */

  const flags =
    getDeviceFlags(
      viewportSize.width,
    );


  /* ===========================================================
     RESPONSIVE TOKENS
  =========================================================== */

  const tokens =
    getResponsiveViewportTokens(
      viewportSize.width,
    );


  /* ===========================================================
     RESPONSIVE VIEWPORT
     
     The shared ResponsiveViewport contract is resolved by
     the global Responsive Engine.

     This keeps viewport classification owned by helpers.ts
     instead of leaking the detailed token-profile type into
     the global ResponsiveState contract.
  =========================================================== */

  const responsiveViewport:
    ResponsiveViewport =
    getResponsiveViewport(
      viewportSize.width,
    );


  /* ===========================================================
     RESPONSIVE STATE
     
     IMPORTANT:
     ResponsiveState is the canonical global contract.

     Do not add customer-specific / legacy viewport flags
     such as:

     - isWideDesktop
     - isUltraWide
     - isTv

     unless those fields are explicitly part of the shared
     types.ts contract.
  =========================================================== */

  const state: ResponsiveState = {

    viewport:
      responsiveViewport,

    tokens:
      tokens,

    width:
      viewportSize.width,

    height:
      viewportSize.height,

    device,

    isMobile:
      flags.isMobile,

    isTablet:
      flags.isTablet,

    isLaptop:
      flags.isLaptop,

    isDesktop:
      flags.isDesktop,

  };


  return state;

}


/* ===========================================================
   NAMED HOOK EXPORT
=========================================================== */

export {
  useResponsive,
};


/* ===========================================================
   END
=========================================================== */