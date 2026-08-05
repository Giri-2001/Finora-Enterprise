/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HANGER RAIL™

   PREMIUM ENTERPRISE STYLES
=========================================================== */

import type { CSSProperties } from "react";

import {
  RAIL_HEIGHT,
} from "./constants";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  width: "100%",

  gap: "4px",

  margin: 0,

  overflow: "visible",

};

/* ===========================================================
   UNUSED (Compatibility)
=========================================================== */

export const headerStyle: CSSProperties = {

  display: "none",

};

export const titleStyle: CSSProperties = {

  display: "none",

};

export const countStyle: CSSProperties = {

  display: "none",

};

/* ===========================================================
   TOP RAIL
=========================================================== */

export const railWrapperStyle: CSSProperties = {

  width: "100%",

  display: "flex",

  flexDirection: "column",

  gap: "1px",

};

/* ===========================================================
   STEEL RAIL
=========================================================== */

export const railStyle: CSSProperties = {

  width: "100%",

  height: `${RAIL_HEIGHT}px`,

  borderRadius: "999px",

  background:
    "linear-gradient(180deg,#CBD5E1,#94A3B8,#CBD5E1)",

  boxShadow:
  "0 6px 18px rgba(15,23,42,.18)",

};

/* ===========================================================
   HANGER AREA
=========================================================== */

export const hangerAreaStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "repeat(7, minmax(0,1fr))",

  alignItems: "start",

  justifyItems: "center",

  columnGap: "10px",

  width: "100%",

  overflow: "hidden",

  padding: "0 0 0 18px",   // 👈 Moves the whole rail right

  boxSizing: "border-box",

};
