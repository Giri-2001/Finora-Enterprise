/* ===========================================================
   FINORA ENTERPRISE OS™
   ENTERPRISE CARD GRID™

   STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  GRID_WIDTH,
  GRID_ALIGNMENT,
} from "./constants";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "grid",

  width: GRID_WIDTH,

  gridTemplateColumns:
    "repeat(5, minmax(180px, 220px))",

  justifyContent: "center",

  alignItems: GRID_ALIGNMENT,

  justifyItems: "center",

  columnGap: "32px",

  boxSizing: "border-box",

};

/* ===========================================================
   ITEM
=========================================================== */

export const itemStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

};
