/* ===========================================================
   FINORA ENTERPRISE OS™

   RECEPTION™

   DEPARTMENT DOOR™

   CONSTANTS

   IMPORTANT
   -----------------------------------------------------------
   - Responsive geometry belongs to Responsive Engine.
   - Theme colors belong to Theme Engine.
   - This file contains ONLY interaction constants.
   - No local door dimensions.
   - No local theme colors.
   - No colored hover glow.
=========================================================== */


/* ===========================================================
   ANIMATION
=========================================================== */

/*
 * Smooth, premium interaction timing.
 */
export const DOOR_TRANSITION =
  "all .35s cubic-bezier(.22,1,.36,1)";


/*
 * Subtle elevation on hover.
 *
 * The card's actual shadow remains controlled by the
 * FINORA Theme Engine.
 */
export const DOOR_HOVER_TRANSFORM =
  "translateY(-4px) scale(1.01)";


export const DOOR_NORMAL_TRANSFORM =
  "translateY(0) scale(1)";


/* ===========================================================
   ICON
=========================================================== */

/*
 * Keep the icon movement noticeable but restrained.
 */
export const ICON_HOVER_TRANSFORM =
  "translateY(-3px) scale(1.06)";


export const ICON_NORMAL_TRANSFORM =
  "translateY(0) scale(1)";


/* ===========================================================
   STATUS INTERACTION
=========================================================== */

/*
 * IMPORTANT
 * -----------------------------------------------------------
 * The previous implementation used a hard-coded green glow:
 *
 *   rgba(34,197,94,.45)
 *
 * That caused the Ready badge to become green-glowing on
 * hover regardless of the active FINORA theme.
 *
 * For the enterprise 5-theme system, status badges do not
 * receive an independent hover glow.
 *
 * The status appearance itself remains theme-driven.
 *
 * This compatibility constant is retained temporarily because
 * DepartmentDoor.tsx currently consumes it.
 */
export const STATUS_HOVER_GLOW =
  "none";


/* ===========================================================
   END
=========================================================== */