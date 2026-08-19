/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER™

   PRESENTATION STYLES

   RESPONSIBILITY:
   - Customer Hanger presentation only
   - Decorative hanger geometry
   - Card wrapper presentation
   - No responsive card dimensions

   IMPORTANT:
   - Customer card width / height are resolved by the
     Customer Responsive Engine in CustomerHanger.tsx.
   - This file must NOT independently decide responsive
     customer-card dimensions.
   - Decorative hanger dimensions continue to use the
     Customer Hanger constants.
=========================================================== */


/* ===========================================================
   IMPORTS
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {
  HANGER_HEIGHT,
  HANGER_WIDTH,
  ROPE_HEIGHT,
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

  alignItems:
    "center",

  alignSelf:
    "start",

  height:
    "auto",

  cursor:
    "pointer",

  userSelect:
    "none",

  position:
    "relative",

  overflow:
    "visible",

  transformOrigin:
    "top center",

  willChange:
    "transform",

  transition:
    "transform .35s cubic-bezier(.22,.61,.36,1)",

  paddingBottom:
    "10px",

};


/* ===========================================================
   PIN
=========================================================== */

export const pinStyle:
  CSSProperties = {

  width:
    "10px",

  height:
    "10px",

  borderRadius:
    "50%",

  background:
    "linear-gradient(180deg,#D6B06A,#8A612B)",

  border:
    "1px solid #6B4B1D",

  marginBottom:
    "0px",

  boxShadow:
    "0 2px 4px rgba(0,0,0,.25)",

};


/* ===========================================================
   ROPE
=========================================================== */

export const ropeStyle:
  CSSProperties = {

  width:
    "2px",

  height:
    `${ROPE_HEIGHT}px`,

  background:
    "linear-gradient(180deg,#D5D9E0,#7B8798,#475569)",

  marginTop:
    "0px",

};


/* ===========================================================
   HANGER
=========================================================== */

export const hangerStyle:
  CSSProperties = {

  width:
    `${HANGER_WIDTH}px`,

  height:
    `${HANGER_HEIGHT}px`,

  border:
    "3px solid #7C8798",

  borderTop:
    "0",

  borderRadius:
    "0 0 36px 36px",

};


/* ===========================================================
   CARD WRAPPER
=========================================================== */

/*
 * IMPORTANT:
 *
 * Do NOT place a customer-card width or height here.
 *
 * CustomerHanger.tsx resolves:
 *
 *   Customer Responsive Engine
 *          ↓
 *   customerTokens.customerCards
 *          ↓
 *   resolvedCardContainerStyle
 *
 * This wrapper only owns presentation behavior.
 */

export const cardContainerStyle:
  CSSProperties = {

  width:
    "100%",

  maxWidth:
    "100%",

  marginTop:
    "2px",

  transformOrigin:
    "top center",

  willChange:
    "transform",

  transition:
    "transform .30s ease",

  position:
    "relative",

  zIndex:
    1,

  paddingBottom:
    "4px",


};


/* ===========================================================
   CARD FINISHING RAIL
=========================================================== */

/* ===========================================================
   CARD FINISHING RAIL
=========================================================== */

/* ===========================================================
   CARD FINISHING RAIL
=========================================================== */

export const bottomRailStyle:
  CSSProperties = {

  width:
    "100%",

  height:
    "3px",

  marginTop:
    "12px",

  borderRadius:
    "999px",

  background:
    "linear-gradient(90deg,transparent,#D4AF37,transparent)",

  boxShadow:
    "0 4px 12px rgba(212,175,55,.35)",

  position:
    "relative",

  zIndex:
    1,

  flexShrink:
    0,

};


/* ===========================================================
   END
=========================================================== */