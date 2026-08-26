/* ===========================================================
   FINORA ENTERPRISE OS™

   LOAN STUDIO
   STEP 1 — DETAILS

   RESPONSIVE BREAKPOINT CONTRACT

   RESPONSIBILITY:
   - Step 1 viewport classification only.
   - No UI rendering.
   - No business logic.
   - No component styling.

   VERSION : 1.0
   STATUS  : Production
=========================================================== */

/* ===========================================================
   BREAKPOINTS
=========================================================== */

export const STEP1_DETAILS_BREAKPOINTS = {
  mobile: 768,

  tablet: 1024,

  laptop: 1600,
} as const;

/* ===========================================================
   VIEWPORT RESOLVER
=========================================================== */

export function resolveStep1DetailsViewport(
  width: number,
): "mobile" | "tablet" | "laptop" | "desktop" {
  if (!Number.isFinite(width) || width < STEP1_DETAILS_BREAKPOINTS.mobile) {
    return "mobile";
  }

  if (width < STEP1_DETAILS_BREAKPOINTS.tablet) {
    return "tablet";
  }

  if (width < STEP1_DETAILS_BREAKPOINTS.laptop) {
    return "laptop";
  }

  return "desktop";
}

/* ===========================================================
   END
=========================================================== */
