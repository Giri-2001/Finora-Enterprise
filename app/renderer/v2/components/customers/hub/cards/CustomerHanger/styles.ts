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
  "transform .35s cubic-bezier(.22,.61,.36,1)",

paddingBottom: "10px",

};

/* ===========================================================
   PIN
=========================================================== */

export const pinStyle: CSSProperties = {

  width: "10px",

  height: "10px",

  borderRadius: "50%",

  background:
    "linear-gradient(180deg,#D6B06A,#8A612B)",

  border: "1px solid #6B4B1D",

  marginBottom: "0px",

  boxShadow:
    "0 2px 4px rgba(0,0,0,.25)",

};

/* ===========================================================
   ROPE
=========================================================== */

export const ropeStyle: CSSProperties = {

  width: "2px",

  height: "22px",

  background:
    "linear-gradient(180deg,#D5D9E0,#7B8798,#475569)",

  marginTop: "0px",

};

/* ===========================================================
   HANGER
=========================================================== */

export const hangerStyle: CSSProperties = {

  width:"58px",

  height:"28px",

  border:
  "3px solid #7C8798",

  borderTop:"0",

  borderRadius:
    "0 0 40px 40px",

};

/* ===========================================================
   CARD
=========================================================== */

export const cardContainerStyle: CSSProperties = {

  marginTop: "6px",

  transformOrigin: "top center",

  willChange: "transform",

  transition:
    "transform .30s ease",

  position: "relative",

  zIndex: 1,

  paddingBottom: "10px",

  filter:
    "drop-shadow(0 14px 26px rgba(0,0,0,.18))",

};
