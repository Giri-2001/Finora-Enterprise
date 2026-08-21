/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER RAIL™

   PREMIUM ENTERPRISE STYLES

   RESPONSIBILITY:
   - Hanger rail presentation only
   - Structural layout only
   - Responsive values are supplied by the
     Customer Responsive Engine
   - Theme values remain owned by the
     FINORA Theme Engine

   IMPORTANT:
   - Customer responsive spacing comes from
     customers.tokens.ts
   - Customer Responsive Engine resolves the
     correct viewport values before presentation
   - This style module must not decide mobile,
     tablet, laptop or desktop values independently
   - No device detection
   - No local responsive sizing decisions
   - No hard-coded theme colors
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";


import type {
  ResponsiveTokens,
} from "../../../../../utils/responsive/customers/customers.tokens";


import {
  RAIL_HEIGHT,
} from "./constants";


/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle:
  CSSProperties = {

  display:
    "flex",

  flexDirection:
    "column",

  width:
    "100%",

  margin:
    0,

  overflow:
    "visible",

  boxSizing:
    "border-box",

};


/* ===========================================================
   UNUSED
   Compatibility exports
=========================================================== */

export const headerStyle:
  CSSProperties = {

  display:
    "none",

};


export const titleStyle:
  CSSProperties = {

  display:
    "none",

};


export const countStyle:
  CSSProperties = {

  display:
    "none",

};


/* ===========================================================
   TOP RAIL WRAPPER
=========================================================== */

export const railWrapperStyle:
  CSSProperties = {

  width:
    "100%",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    4,

  boxSizing:
    "border-box",

};


/* ===========================================================
   STEEL RAIL
=========================================================== */

/*
 * IMPORTANT:
 *
 * This file does NOT own theme colors.
 *
 * CustomerHangerRail.tsx will inject the active
 * FINORA Theme Engine colors.
 *
 * CSS variables:
 *
 * --finora-theme-brand-accent
 * --finora-theme-border-subtle
 *
 * Therefore:
 *
 * ThemeProvider
 *      ↓
 * useTheme()
 *      ↓
 * CustomerHangerRail.tsx
 *      ↓
 * CSS variables
 *      ↓
 * railStyle
 */

export const railStyle:
  CSSProperties = {

  width:
    "100%",

  height:
    RAIL_HEIGHT,

  flexShrink:
    0,

  borderRadius:
    "999px",

  background:
    "linear-gradient(" +
    "90deg," +
    "transparent," +
    "var(--finora-theme-brand-accent, currentColor)," +
    "transparent" +
    ")",

};


/* ===========================================================
   HANGER AREA
=========================================================== */

/*
 * IMPORTANT:
 *
 * Responsive geometry is NOT decided here.
 *
 * CustomerHangerRail receives the resolved
 * Customer Responsive Engine tokens and applies
 * the resolved card gap through this function.
 *
 * Therefore:
 *
 * Customer Responsive Engine
 *          ↓
 * customerTokens.card.gap
 *          ↓
 * getHangerAreaStyle()
 *
 * Theme Engine remains completely separate from
 * responsive geometry.
 */

export function getHangerAreaStyle(
  tokens:
    ResponsiveTokens,
): CSSProperties {

  return {

    display:
      "flex",

    justifyContent:
      "center",

    alignItems:
      "flex-start",

    gap:
      tokens.card.gap,

    width:
      "100%",

    maxWidth:
      "none",

    margin:
      0,

    overflow:
      "visible",

    padding:
      0,

    boxSizing:
      "border-box",

  };

}


/* ===========================================================
   END
=========================================================== */