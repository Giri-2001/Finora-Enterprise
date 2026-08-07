/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER SMART WALL™

   PRESENTATION STYLES
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

export const containerStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  width: "100%",

  height: "100%",

  flex: 1,

  flexShrink: 1,

  minHeight: 0,

  gap: "8px",

  overflow: "hidden",

  padding:"16px 28px",

  background:
  `
  linear-gradient(
    rgba(18,12,8,.35),
    rgba(18,12,8,.35)
  ),

  linear-gradient(
    90deg,
    #3A2115 0%,
    #5B3420 25%,
    #402417 50%,
    #5B3420 75%,
    #321B12 100%
  )
  `,

};

/* ===========================================================
   UNUSED
=========================================================== */

export const headerStyle: CSSProperties = {

  display: "none",

};


export const titleStyle: CSSProperties = {

  display: "none",

};


export const subtitleStyle: CSSProperties = {

  display: "none",

};



/* ===========================================================
   PREMIUM RAIL WRAPPER
=========================================================== */

export const railWrapperStyle: CSSProperties = {

  width: "100%",

  marginTop: "0px",

  marginBottom: "6px",

};



/* ===========================================================
   PREMIUM WOOD / METAL RAIL
=========================================================== */

export const railStyle: CSSProperties = {

  width: "100%",

  height: "2px",

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

display:"flex",

flexDirection:"column",

width:"100%",

flex:1,

minHeight:0,

gap:"8px",

overflow:"hidden",

paddingBottom:"0",

};
