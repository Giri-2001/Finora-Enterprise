/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER SMART WALL™

   PRESENTATION STYLES
=========================================================== */

import type { CSSProperties } from "react";

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

  gap: "12px",

  overflow: "visible",

  padding: "16px 28px 18px",

 borderRadius: "32px",

  background:
    `
    linear-gradient(
      rgba(18,12,8,.18),
      rgba(18,12,8,.18)
    ),
    linear-gradient(
      90deg,
      #4B2E1E 0%,
      #5B3924 18%,
      #3D2518 36%,
      #5D3923 55%,
      #3A2418 72%,
      #5C3923 100%
    )
    `,

  boxShadow:
  "0 26px 70px rgba(0,0,0,.34)",

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

  borderRadius: "999px",

  background: "transparent",

  border: "none",

  boxShadow: "none",

};

/* ===========================================================
   CONTENT
=========================================================== */

export const hangerAreaStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  width: "100%",

  gap: "10px",

  overflow: "visible",

 paddingBottom: "8px",

};
