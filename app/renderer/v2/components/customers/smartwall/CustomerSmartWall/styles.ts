/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER SMART WALL™

   PRESENTATION STYLES

   THEME CONTRACT:
   - No hard-coded Smart Wall background colors
   - Active theme surface is supplied by the component
   - ThemeProvider ownership remains outside this styles file

   RESPONSIBILITY:
   - Smart Wall presentation geometry
   - Smart Wall spacing
   - Rail presentation
   - Content layout

   NOT RESPONSIBLE FOR:
   - Theme selection
   - Viewport detection
   - Responsive breakpoint logic
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  RAIL_HEIGHT,
  RAIL_RADIUS,
} from "./constants";


/* ===========================================================
   ROOT
=========================================================== */

/*
 * IMPORTANT:
 *
 * The Smart Wall background is now supplied by the
 * FINORA Theme Engine.
 *
 * CustomerSmartWall.tsx will resolve the active theme through
 * ThemeProvider and pass the resolved page/surface background
 * into this style builder.
 *
 * This prevents the Smart Wall from overriding the global
 * application theme with a local hard-coded gradient.
 */

export function buildContainerStyle(
  background: string,
): CSSProperties {

  return {

    display:
      "flex",

    flexDirection:
      "column",

    width:
      "100%",

    height:
      "100%",

    flex:
      1,

    flexShrink:
      1,

    minHeight:
      0,

    gap:
      "8px",

    overflow:
      "hidden",

    padding:
      "16px 28px",

    /*
     * FINORA THEME ENGINE
     *
     * No local Smart Wall color.
     */

    background:
  background,

  color:
    "var(--finora-theme-text-primary, inherit)",

  };

}


/* ===========================================================
   UNUSED
=========================================================== */

export const headerStyle: CSSProperties = {

  display:
    "none",

};


export const titleStyle: CSSProperties = {

  display:
    "none",

};


export const subtitleStyle: CSSProperties = {

  display:
    "none",

};


/* ===========================================================
   PREMIUM RAIL WRAPPER
=========================================================== */

export const railWrapperStyle: CSSProperties = {

  width:
    "100%",

  marginTop:
    "0px",

  marginBottom:
    "6px",

};


/* ===========================================================
   PREMIUM WOOD / METAL RAIL
=========================================================== */

export const railStyle: CSSProperties = {

  width:
    "100%",

  height:
    "2px",

  borderRadius:
    RAIL_RADIUS,

  background:
    "transparent",

  border:
    "none",

  boxShadow:
    "none",

};


/* ===========================================================
   CONTENT
=========================================================== */

export const hangerAreaStyle: CSSProperties = {

  display:
    "flex",

  flexDirection:
    "column",

  width:
    "100%",

  flex:
    1,

  minHeight:
    0,

  gap:
    "8px",

  overflow:
    "hidden",

  paddingBottom:
    "0",

};


/* ===========================================================
   END
=========================================================== */