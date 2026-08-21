/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER HANGER™

   PRESENTATION STYLES

   RESPONSIVE MIGRATION
   -----------------------------------------------------------
   RESPONSIBILITY:
   - Customer Hanger presentation only
   - Decorative hanger geometry
   - Card wrapper presentation
   - Bottom finishing rail presentation

   IMPORTANT:
   - Customer card width / height are resolved by the
     Customer Responsive Engine in CustomerHanger.tsx.
   - This file must NOT independently decide responsive
     customer-card dimensions.
   - Decorative hanger dimensions continue to use the
     Customer Hanger constants.
   - Theme visual values are supplied by CustomerHanger.tsx.
   - No breakpoint logic exists in this file.
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
    "0px",

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

  /*
   * Theme visual fallback.
   *
   * Final theme values are supplied by
   * CustomerHanger.tsx through the FINORA Theme Engine.
   */

  background:
    "var(--finora-theme-brand-primary, #D6B06A)",

  border:
    "1px solid var(--finora-theme-border-strong, #6B4B1D)",

  marginBottom:
    "0px",

  boxShadow:
    "0 2px 4px var(--finora-theme-overlay-shadow, rgba(0,0,0,.25))",

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

  /*
   * Theme visual fallback.
   *
   * Final theme value is supplied by
   * CustomerHanger.tsx.
   */

  background:
    "var(--finora-theme-border-strong, #7B8798)",

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
    "3px solid var(--finora-theme-border-strong, #7C8798)",

  borderTop:
    "0px solid transparent",

  borderRadius:
    "0 0 36px 36px",

};


/* ===========================================================
   CARD WRAPPER
=========================================================== */

/*
 * IMPORTANT:
 *
 * Do NOT place customer-card width or height here.
 *
 * CustomerHanger.tsx resolves:
 *
 *   Customer Responsive Engine
 *          ↓
 *   customerTokens.customerCards
 *          ↓
 *   resolvedCardContainerStyle
 *
 * This wrapper owns presentation behavior only.
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
    "0px",

};


/* ===========================================================
   CARD FINISHING RAIL
=========================================================== */

/*
 * IMPORTANT:
 *
 * This rail belongs directly beneath the customer card.
 *
 * Responsive card geometry remains owned by
 * CustomerHanger.tsx.
 *
 * The rail itself intentionally uses relative presentation
 * geometry only.
 *
 * 8px margin keeps the finishing line visually close to the
 * card and prevents the previous excessive outer gap.
 */

export const bottomRailStyle:
  CSSProperties = {

  width:
    "100%",

  height:
    "4px",

  marginTop:
    "12px",

  borderRadius:
    "999px",

  /*
   * Theme fallback.
   *
   * CustomerHanger.tsx replaces this background using the
   * active FINORA Theme Engine.
   */

  background:
    "linear-gradient(90deg, transparent, #FFD86B, #D4AF37, #FFD86B, transparent)",

  boxShadow:
    "0 6px 16px var(--finora-theme-overlay-shadow, rgba(212,175,55,.45))",

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