/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER CARD FLIP™

   PREMIUM CARD FLIP PRESENTATION
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  CARD_HEIGHT,
  CARD_RADIUS,
  CARD_WIDTH,
} from "./constants";

/* ===========================================================
   ROOT CONTAINER
=========================================================== */

export const containerStyle: CSSProperties = {

  position: "relative",

  width: `${CARD_WIDTH}px`,

  height: `${CARD_HEIGHT}px`,

  flexShrink: 0,

};

/* ===========================================================
   INNER FLIP SURFACE
=========================================================== */

export const innerStyle: CSSProperties = {

  position: "relative",

  width: "100%",

  height: "100%",

  transformStyle: "preserve-3d",

  WebkitTransformStyle:
    "preserve-3d",

};

/* ===========================================================
   SHARED CARD FACE
=========================================================== */

export const faceStyle: CSSProperties = {

  position: "absolute",

  inset: 0,

  width: `${CARD_WIDTH}px`,

  height: `${CARD_HEIGHT}px`,

  borderRadius:
    `${CARD_RADIUS}px`,

  overflow: "hidden",

  backfaceVisibility:
    "hidden",

  WebkitBackfaceVisibility:
    "hidden",

  transformStyle:
    "preserve-3d",

  WebkitTransformStyle:
    "preserve-3d",

  boxSizing: "border-box",

  boxShadow:
    "0 18px 42px rgba(0,0,0,.18)",

};

/* ===========================================================
   FRONT
=========================================================== */

export const frontStyle: CSSProperties = {

  ...faceStyle,

};

/* ===========================================================
   BACK
=========================================================== */

export const backStyle: CSSProperties = {

  ...faceStyle,

  transform:
    "rotateY(180deg)",

};
