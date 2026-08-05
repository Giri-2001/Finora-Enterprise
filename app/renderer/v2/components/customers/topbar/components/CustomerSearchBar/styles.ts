/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER SEARCH BAR™

   PREMIUM STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  position: "relative",

  width: "300px",

  maxWidth: "100%",

  marginTop: "0px",

};


/* ===========================================================
   SEARCH ICON
=========================================================== */

export const iconStyle: CSSProperties = {

  position: "absolute",

  left: "14px",

  top: "50%",

  transform:
    "translateY(-50%)",

  color: "#8B5E34",

  fontSize: "16px",

  pointerEvents: "none",

};


/* ===========================================================
   INPUT
=========================================================== */

export const inputStyle: CSSProperties = {

  width: "100%",

  height: "40px",

borderRadius: "999px",

border: "2px solid #C89A45",

background:
  "linear-gradient(180deg,#FFFDF8,#FFF4DE)",

paddingLeft: "38px",

paddingRight: "14px",

fontSize: "14px",

fontWeight: 500,

color: "#3D2518",

outline: "none",

boxSizing: "border-box",

boxShadow:
  "0 8px 22px rgba(0,0,0,.14), inset 0 1px 2px rgba(255,255,255,.75)",

transition: "all .25s ease",

};
