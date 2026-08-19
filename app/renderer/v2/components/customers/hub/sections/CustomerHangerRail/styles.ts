/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER RAIL™

   PREMIUM ENTERPRISE STYLES

   RESPONSIBILITY:
   - Hanger rail presentation only
   - Structural layout only
   - Responsive values are supplied by the
     Customer Responsive Engine
   - No device detection
   - No hard-coded responsive sizing decisions

   IMPORTANT:
   - Customer responsive spacing comes from
     customers.tokens.ts
   - Customer Responsive Engine resolves the
     correct viewport values before presentation
   - This style module must not decide mobile,
     tablet, laptop or desktop values independently
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import type {
  ResponsiveTokens,
} from "../../../../../utils/responsive/tokens";

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
    "linear-gradient(90deg, transparent, rgba(246,213,138,.95), transparent)",

  boxShadow:
    "0 4px 14px rgba(212,175,55,.35)",

};


/* ===========================================================
   HANGER AREA
=========================================================== */

/*
 * IMPORTANT:
 *
 * Do not place values such as:
 *
 *   gap: "clamp(...)"
 *   maxWidth: "1400px"
 *   padding: "0 16px"
 *
 * here.
 *
 * Those are responsive presentation decisions.
 *
 * CustomerHangerRail receives the resolved
 * Customer Responsive Engine tokens and applies
 * them through getHangerAreaStyle().
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