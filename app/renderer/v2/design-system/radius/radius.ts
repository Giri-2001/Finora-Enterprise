/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   RADIUS
--------------------------------------------------------------
Single Source of Truth for Border Radius
=========================================================== */

export const radius = {

  none: 0,

  xs: 4,

  sm: 8,

  md: 12,

  lg: 16,

  xl: 18,

  "2xl": 24,

  full: 9999,

} as const;

export type FinoraRadius = typeof radius;
