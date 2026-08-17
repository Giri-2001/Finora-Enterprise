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
     DETAILED VIEWPORT PROFILE
     
     ResponsiveViewport is the detailed 10-profile system:
     
     - verySmallMobile
     - mobile
     - largeMobile
     - tablet
     - smallLaptop
     - laptop
     - desktop
     - wideDesktop
     - ultraWide
     - projector
     
     The token resolver already determines this profile.
     Therefore the hook consumes the authoritative token
     metadata instead of duplicating breakpoint logic here.
  =========================================================== */

  const responsiveViewport:
    ResponsiveViewport =
    tokens.meta.viewport;


  /* ===========================================================
     RESPONSIVE STATE
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

    isWideDesktop:
      flags.isWideDesktop,

    isUltraWide:
      flags.isUltraWide,

    isTv:
      flags.isTv,

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