/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER SEARCH BAR

   STYLES

   RESPONSIBILITY:
   - Premium search presentation
   - Search icon geometry
   - Input presentation
   - Focus-friendly visual structure

   IMPORTANT:
   - Search behavior does not belong here.
   - Search filtering does not belong here.
   - Responsive breakpoint decisions do not belong here.
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "9px",

  width:
    "100%",

  maxWidth:
    "340px",

  minWidth:
    0,

  height:
    "38px",

  padding:
    "0 13px",

  background:
    "linear-gradient(180deg,#FFF9EA 0%,#F6E7C1 100%)",

  border:
    "1px solid rgba(199,154,82,0.72)",

  borderRadius:
    "999px",

  boxShadow:
    "0 5px 16px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.85)",

  boxSizing:
    "border-box",

  transition:
    "border-color .2s ease, box-shadow .2s ease",

};

/* ===========================================================
   ICON
=========================================================== */

export const iconStyle:
  CSSProperties = {

  width:
    "17px",

  height:
    "17px",

  minWidth:
    "17px",

  color:
    "#8A612B",

  flexShrink:
    0,

  userSelect:
    "none",

  pointerEvents:
    "none",

};

/* ===========================================================
   INPUT
=========================================================== */

export const inputStyle:
  CSSProperties = {

  flex:
    1,

  minWidth:
    0,

  width:
    "100%",

  border:
    "none",

  outline:
    "none",

  background:
    "transparent",

  fontFamily:
    "inherit",

  fontSize:
    "14px",

  fontWeight:
    500,

  color:
    "#0F172A",

  boxSizing:
    "border-box",

  lineHeight:
    1.2,

  padding:
    0,

};

/* ===========================================================
   END
=========================================================== */