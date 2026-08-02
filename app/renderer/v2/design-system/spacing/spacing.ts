/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   SPACING
--------------------------------------------------------------
Single Source of Truth for Spacing
=========================================================== */

export const spacing = {

  none: 0,

  xs: 4,

  sm: 8,

  md: 12,

  lg: 16,

  xl: 24,

  "2xl": 32,

  "3xl": 40,

  "4xl": 48,

  "5xl": 64,

} as const;

export type FinoraSpacing = typeof spacing;
