/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER HANGER™

   PRESENTATION STYLES
=========================================================== */

import type { CSSProperties } from "react";

import {
  HANGER_COLOR,
  HANGER_HEIGHT,
  HANGER_WIDTH,
  ROPE_COLOR,
} from "./constants";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  cursor: "pointer",

  userSelect: "none",

  position: "relative",

  overflow: "visible",

  transformOrigin: "top center",

  willChange: "transform",

  transition:
    "transform .45s cubic-bezier(.22,.61,.36,1)",

};

/* ===========================================================
   PIN
=========================================================== */

export const pinStyle: CSSProperties = {

  width:"8px",

  height:"8px",

  borderRadius:"50%",

  background:
    "#64748B",

  marginBottom:"0px",

};

/* ===========================================================
   ROPE
=========================================================== */

export const ropeStyle: CSSProperties = {

  width:"2px",

  height:"18px",

  background:
    "linear-gradient(180deg,#94A3B8,#475569)",

  marginTop:"0px",

};

/* ===========================================================
   HANGER
=========================================================== */

export const hangerStyle: CSSProperties = {

  width:"55px",

  height:"26px",

  border:
    "3px solid #64748B",

  borderTop:"0",

  borderRadius:
    "0 0 40px 40px",

};

/* ===========================================================
   CARD
=========================================================== */

export const cardContainerStyle: CSSProperties = {

  marginTop: "2px",

  transformOrigin: "top center",

  willChange: "transform",

  transition:
    "transform .30s ease",

  position: "relative",

  zIndex: 1,

  paddingBottom: "0px",

};
