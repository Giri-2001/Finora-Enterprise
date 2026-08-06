/* ===========================================================
   FINORA ENTERPRISE OS™
   SMART WALL PAGINATION™

   PREMIUM ENTERPRISE STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  justifyContent: "flex-end",

  gap: "14px",

  width: "100%",

  whiteSpace: "nowrap",

  transform: "translateY(-4px)",

};

/* ===========================================================
   BUTTON
=========================================================== */

export const buttonStyle: CSSProperties = {

  width: "34px",

  height: "34px",

  borderRadius: "12px",


border: "1px solid rgba(246,213,138,.35)",

  background:
  "linear-gradient(180deg,#FFFDF8,#F8E7BE)",

  color: "#5A3B16",

  cursor: "pointer",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

 fontSize: "13px",


  fontWeight: 700,

  transition: "all .2s ease",

  boxShadow:
  "0 8px 18px rgba(0,0,0,.18)",

  flexShrink: 0,

};

/* ===========================================================
   INFO
=========================================================== */

export const infoStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  minWidth: "140px",

  flexShrink: 0,

};

/* ===========================================================
   TOTAL
=========================================================== */

export const totalStyle: CSSProperties = {

  fontSize: "17px",

  fontWeight: 700,

  color: "#F6D58A",

  whiteSpace: "nowrap",

  fontVariantNumeric: "tabular-nums",

};

/* ===========================================================
   UNUSED (Compatibility)
=========================================================== */

export const rangeStyle: CSSProperties = {

  display: "none",

};

export const buttonHoverStyle: CSSProperties = {

  background: "#0F172A",

  color: "#FFFFFF",

  transform: "scale(1.05)",

};
