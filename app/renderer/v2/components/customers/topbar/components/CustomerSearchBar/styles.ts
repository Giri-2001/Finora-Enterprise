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

  width: "340px",

  maxWidth: "100%",

  marginTop: "0px",

};


/* ===========================================================
   SEARCH ICON
=========================================================== */

export const iconStyle: CSSProperties = {

  position: "absolute",

  left: "16px",

  top: "50%",

  transform:
    "translateY(-50%)",

  color: "#8A6330",

  fontSize: "17px",

  pointerEvents: "none",

};


/* ===========================================================
   INPUT
=========================================================== */

export const inputStyle: CSSProperties = {

  width: "100%",

  height: "46px",

borderRadius: "24px",

border: "2px solid #C89A45",

background:
  "linear-gradient(180deg,#FFFDF8,#FFF4DE)",

paddingLeft: "44px",

paddingRight: "18px",

fontSize: "15px",

fontWeight: 600,

color: "#3D2518",

outline: "none",

boxSizing: "border-box",

boxShadow:
  "0 10px 26px rgba(0,0,0,.18), inset 0 1px 2px rgba(255,255,255,.80)",

transition: "all .25s ease",

};
