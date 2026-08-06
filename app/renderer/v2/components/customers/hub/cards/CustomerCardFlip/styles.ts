/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER CARD FLIP
   -----------------------------------------------------------
   Module  : Customer Hub
   Layer   : Cards
   Version : 2.0
   Status  : Production
=========================================================== */

import type { CSSProperties } from "react";

import {
  CARD_HEIGHT,
  CARD_RADIUS,
  CARD_WIDTH,
} from "./constants";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  position: "relative",

  width: "170px",

  height: "290px",

};

/* ===========================================================
   INNER
=========================================================== */

export const innerStyle: CSSProperties = {

  position: "relative",

  width: "100%",

  height: "100%",

  transformStyle: "preserve-3d",

  WebkitTransformStyle: "preserve-3d",

  transition:
  "transform .45s cubic-bezier(.22,.61,.36,1)",

};

/* ===========================================================
   SHARED FACE
=========================================================== */

export const faceStyle: CSSProperties = {

  position: "absolute",

  inset: 0,

  backfaceVisibility:
    "hidden",

  WebkitBackfaceVisibility:
    "hidden",

  width: "100%",

  height: "100%",

  borderRadius: `${CARD_RADIUS}px`,

  overflow: "hidden",

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
