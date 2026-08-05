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

  gap: "10px",

  width: "100%",

  whiteSpace: "nowrap",

    transform: "translateY(-6px)",

};

/* ===========================================================
   BUTTON
=========================================================== */

export const buttonStyle: CSSProperties = {

  width: "28px",

  height: "28px",

  borderRadius: "999px",

  border: "1px solid #CBD5E1",

  background: "#FFFFFF",

  color: "#0F172A",

  cursor: "pointer",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  fontSize: "12px",

  fontWeight: 700,

  transition: "all .2s ease",

  boxShadow:
    "0 2px 6px rgba(15,23,42,.08)",

  flexShrink: 0,

};

/* ===========================================================
   INFO
=========================================================== */

export const infoStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  minWidth: "120px",

  flexShrink: 0,

};

/* ===========================================================
   TOTAL
=========================================================== */

export const totalStyle: CSSProperties = {

  fontSize: "16px",

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
