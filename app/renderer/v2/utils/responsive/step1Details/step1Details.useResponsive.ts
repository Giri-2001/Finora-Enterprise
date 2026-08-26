/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN STUDIO
   STEP 1 — DETAILS

   RESPONSIVE HOOK

   RESPONSIBILITY:
   - Read viewport width.
   - Resolve Step 1 responsive tokens.
   - Recalculate on viewport resize.

   IMPORTANT:
   - Components do not inspect window.innerWidth.
   - Components consume this resolved contract only.

   VERSION : 1.0
   STATUS  : Production
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import { useEffect, useState } from "react";

import { resolveStep1DetailsViewport } from "./step1Details.breakpoints";

import { getStep1DetailsTokensByWidth } from "./step1Details.tokens";

import type {
  Step1DetailsResponsiveTokens,
  Step1DetailsViewport,
} from "./step1Details.types";

/* ===========================================================
   WIDTH READER
=========================================================== */

function getViewportWidth(): number {
  if (typeof window === "undefined") {
    return 1280;
  }

  return window.innerWidth;
}

/* ===========================================================
   HOOK
=========================================================== */

export function useStep1DetailsResponsive() {
  const [width, setWidth] = useState<number>(getViewportWidth);

  /* =========================================================
     RESIZE LISTENER
  ========================================================= */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = (): void => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =========================================================
     RESOLVE VIEWPORT
  ========================================================= */

  const viewport: Step1DetailsViewport = resolveStep1DetailsViewport(width);

  /* =========================================================
     RESOLVE TOKENS
  ========================================================= */

  const tokens: Step1DetailsResponsiveTokens =
    getStep1DetailsTokensByWidth(width);

  /* =========================================================
     RETURN
  ========================================================= */

  return {
    width,

    viewport,

    tokens,
  };
}

/* ===========================================================
   END
=========================================================== */
