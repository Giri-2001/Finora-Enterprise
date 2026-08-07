/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER OFFICE LAYOUT™

   STYLES
=========================================================== */


import type {
  CSSProperties,
} from "react";



/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  width: "100%",

  height: "100%",

  minHeight: 0,

  overflow: "hidden",

  gap: "12px",

};



/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {

  flex: "0 0 auto",

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  justifyContent: "center",

  gap: "4px",

};



/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin: 0,

  fontSize: "30px",

  fontWeight: 800,

  color: "#2B1B12",

  letterSpacing: "1px",

};



/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {

  margin: 0,

  fontSize: "14px",

  color: "#64748B",

};



/* ===========================================================
   BODY
=========================================================== */

export const bodyStyle: CSSProperties = {

  flex: 1,

  display: "flex",

  flexDirection: "column",

  width: "100%",

  minHeight: 0,

  overflow: "hidden",

  gap: "12px",

};
