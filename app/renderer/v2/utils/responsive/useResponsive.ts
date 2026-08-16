/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   RESPONSIVE HOOK
=========================================================== */

import {
  useEffect,
  useState,
} from "react";

import {
  getDeviceType,
  isDesktop,
  isTablet,
  isMobile,
  getSafeWidth,
  getSafeHeight,
} from "./helpers";

import type {
  DeviceType,
} from "./types";


/* ===========================================================
   RESPONSIVE STATE
=========================================================== */

export interface ResponsiveState {

  width:
    number;

  height:
    number;

  device:
    DeviceType;

  isDesktop:
    boolean;

  isTablet:
    boolean;

  isMobile:
    boolean;

}


/* ===========================================================
   VIEWPORT READER
=========================================================== */

function getViewportSize(): {
  width: number;
  height: number;
} {

  if (
    typeof window === "undefined"
  ) {

    return {

      width: 0,

      height: 0,

    };

  }

  return {

    width:
      getSafeWidth(
        window.innerWidth,
      ),

    height:
      getSafeHeight(
        window.innerHeight,
      ),

  };

}


/* ===========================================================
   HOOK
=========================================================== */

export default function useResponsive():
  ResponsiveState {

  const [
    size,
    setSize,
  ] = useState(
    getViewportSize,
  );


  /* ==========================================================
     VIEWPORT MONITOR
  ========================================================== */

  useEffect(() => {

    function handleResize(): void {

      const next =
        getViewportSize();

      setSize(
        next,
      );

    }


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


  /* ==========================================================
     DEVICE
  ========================================================== */

  const device =
    getDeviceType(
      size.width,
    );


  /* ==========================================================
     STATE
  ========================================================== */

  return {

    width:
      size.width,

    height:
      size.height,

    device,

    isDesktop:
      isDesktop(
        size.width,
      ),

    isTablet:
      isTablet(
        size.width,
      ),

    isMobile:
      isMobile(
        size.width,
      ),

  };

}


/* ===========================================================
   END
=========================================================== */