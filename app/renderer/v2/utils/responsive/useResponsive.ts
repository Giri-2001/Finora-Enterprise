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
  isDesktop,
  isTablet,
  isMobile,
} from "./helpers";

/* ===========================================================
   TYPES
=========================================================== */

export interface ResponsiveState {

  width: number;

  height: number;

  isDesktop: boolean;

  isTablet: boolean;

  isMobile: boolean;

}

/* ===========================================================
   HOOK
=========================================================== */

export default function useResponsive(): ResponsiveState {

  const [size, setSize] = useState({

    width: window.innerWidth,

    height: window.innerHeight,

  });

  useEffect(() => {

    function handleResize() {

      setSize({

        width: window.innerWidth,

        height: window.innerHeight,

      });

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

  return {

    width: size.width,

    height: size.height,

    isDesktop: isDesktop(size.width),

    isTablet: isTablet(size.width),

    isMobile: isMobile(size.width),

  };

}
