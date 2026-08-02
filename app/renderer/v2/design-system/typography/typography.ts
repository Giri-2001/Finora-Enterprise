/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   TYPOGRAPHY
--------------------------------------------------------------
Single Source of Truth for Typography
=========================================================== */

export const typography = {

  display: {

    fontSize: 40,

    fontWeight: 700,

    lineHeight: 48,

  },

  h1: {

    fontSize: 32,

    fontWeight: 700,

    lineHeight: 40,

  },

  h2: {

    fontSize: 28,

    fontWeight: 700,

    lineHeight: 36,

  },

  h3: {

    fontSize: 22,

    fontWeight: 700,

    lineHeight: 30,

  },

  title: {

    fontSize: 18,

    fontWeight: 600,

    lineHeight: 26,

  },

  subtitle: {

    fontSize: 16,

    fontWeight: 500,

    lineHeight: 24,

  },

  body: {

    fontSize: 15,

    fontWeight: 400,

    lineHeight: 24,

  },

  bodySmall: {

    fontSize: 14,

    fontWeight: 400,

    lineHeight: 22,

  },

  caption: {

    fontSize: 12,

    fontWeight: 400,

    lineHeight: 18,

  },

  label: {

    fontSize: 13,

    fontWeight: 600,

    lineHeight: 20,

  },

  button: {

    fontSize: 15,

    fontWeight: 600,

    lineHeight: 20,

  },

} as const;

export type FinoraTypography = typeof typography;
