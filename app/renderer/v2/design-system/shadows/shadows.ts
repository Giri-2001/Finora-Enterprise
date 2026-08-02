/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   SHADOWS
--------------------------------------------------------------
Single Source of Truth for Elevation
=========================================================== */

export const shadows = {

  none: "none",

  xs: "0 1px 2px rgba(0,0,0,0.05)",

  sm: "0 2px 4px rgba(0,0,0,0.08)",

  md: "0 6px 12px rgba(0,0,0,0.10)",

  lg: "0 10px 20px rgba(0,0,0,0.12)",

  xl: "0 16px 32px rgba(0,0,0,0.14)",

} as const;

export type FinoraShadows = typeof shadows;
