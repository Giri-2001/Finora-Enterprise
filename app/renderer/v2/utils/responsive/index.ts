/* ===========================================================
   FINORA ENTERPRISE OS™
   RESPONSIVE ENGINE™

   CENTRAL EXPORTS

   RESPONSIBILITY:
   - Single public entry point for Responsive Engine
   - Export responsive types
   - Export breakpoint definitions
   - Export helper functions
   - Export layout calculations
   - Export responsive tokens
   - Export responsive hook
=========================================================== */


/* ===========================================================
   TYPES
=========================================================== */

export * from "./types";


/* ===========================================================
   BREAKPOINTS
=========================================================== */

export * from "./breakpoints";


/* ===========================================================
   LAYOUT
=========================================================== */

export * from "./layout";


/* ===========================================================
   TOKENS
=========================================================== */

/*
   tokens.ts is the authoritative source for:

   - ResponsiveTokens
   - Responsive token profiles
   - Responsive viewport resolution

   ResponsiveTokens also exists in the legacy/common
   types.ts surface.

   Therefore:

   - Keep types.ts wildcard exports intact.
   - Explicitly re-export ResponsiveTokens from tokens.ts.
   - The explicit token type becomes the authoritative
     public ResponsiveTokens type for consumers.

   This keeps the Responsive Engine as the single source
   of truth for responsive dimensions.
*/

export type {
  ResponsiveTokens,
} from "./tokens";

export {
  getResponsiveViewportTokens,
} from "./tokens";

export * as responsiveTokens from "./tokens";


/* ===========================================================
   RESPONSIVE HOOK
=========================================================== */

export {
  default as useResponsive,
} from "./useResponsive";


/* ===========================================================
   END
=========================================================== */