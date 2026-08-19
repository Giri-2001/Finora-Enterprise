/* ===========================================================
   FINORA ENTERPRISE OS™

   ENTERPRISE CARD GRID™

   CONSTANTS

   RESPONSIBILITY:
   - Shared Enterprise Card Grid defaults only
   - No responsive breakpoint ownership
   - No customer-card geometry ownership
   - No viewport detection

   IMPORTANT:
   - Responsive column counts are resolved by the caller.
   - Customer Responsive Engine remains the single source
     of truth for Customer Hub responsive columns.
   - These constants must NOT override caller-resolved values.
=========================================================== */


/* ===========================================================
   DEFAULT GRID
=========================================================== */

/*
 * Generic fallback only.
 *
 * Individual responsive consumers provide their own resolved
 * column count through EnterpriseCardGrid props.
 */

export const DEFAULT_COLUMNS = 5;

export const DEFAULT_GAP = 24;


/* ===========================================================
   LEGACY COMPATIBILITY
=========================================================== */

/*
 * These values are retained only for compatibility with any
 * older EnterpriseCardGrid consumers that may import them.
 *
 * They do NOT control Customer Hub responsive behavior.
 *
 * Customer Hub receives its actual column count from:
 *
 *   customers.tokens.ts
 *
 * through:
 *
 *   CustomerHangerRail.tsx
 *
 * and then:
 *
 *   EnterpriseCardGrid.tsx
 */

export const DESKTOP_COLUMNS = 5;

export const LAPTOP_COLUMNS = 4;

export const TABLET_COLUMNS = 3;

export const MOBILE_COLUMNS = 1;


/* ===========================================================
   GRID WIDTH
=========================================================== */

/*
 * EnterpriseCardGrid must consume the complete width supplied
 * by its parent layout.
 *
 * No fixed pixel width belongs here.
 */

export const GRID_WIDTH = "100%";


/* ===========================================================
   GRID ALIGNMENT
=========================================================== */

/*
 * Grid items remain vertically aligned at the beginning of
 * their respective grid tracks.
 *
 * Horizontal card positioning is handled by the grid layout
 * itself and by the resolved card/hanger geometry.
 */

export const GRID_ALIGNMENT = "start";


/* ===========================================================
   END
=========================================================== */