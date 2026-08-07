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

  gap: "8px",

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

  gap: "4px",

};

/* ===========================================================
   STEEL RAIL
=========================================================== */

export const railStyle: CSSProperties = {

  width: "100%",

  height: "3px",

  borderRadius: "999px",

  background:
"linear-gradient(90deg, transparent, rgba(246,213,138,.95), transparent)",

  boxShadow:
"0 4px 14px rgba(212,175,55,.35)",

};

/* ===========================================================
   HANGER AREA
=========================================================== */

export const hangerAreaStyle: CSSProperties = {

  display: "flex",

  justifyContent: "center",

  alignItems: "flex-start",

  gap: "clamp(24px,4vw,70px)",

  width: "100%",

  maxWidth: "1400px",

  margin: "0 auto",

  overflow: "visible",

  padding: "0 16px",

  boxSizing: "border-box",

};
