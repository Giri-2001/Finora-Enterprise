/* ===========================================================
FINORA ENTERPRISE OS™

CUSTOMER HUB SUMMARY CARDS™

PREMIUM PRESENTATION STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";



/* ===========================================================
   CONTAINER
=========================================================== */

export const containerStyle: CSSProperties = {

  width:"100%",

  display:"grid",

  gridTemplateColumns:
    "repeat(5,160px)",

  justifyContent:"space-between",

  alignItems:"center",

  gap:"14px",

  padding:"0 34px",

  boxSizing:"border-box",

  transform:"translateY(-10px)",

};



/* ===========================================================
   NORMAL SUMMARY CARD
=========================================================== */

export const cardStyle: CSSProperties = {

  width:"150px",

  height:"100px",

  borderRadius:"18px",

  padding:"12px",

  display:"flex",

  flexDirection:"column",

  justifyContent:"center",

  alignItems:"center",

  cursor:"pointer",

  background:"transparent",

  border:
    "1px solid rgba(212,175,55,.55)",


  boxShadow:"none",


  transition:
    "transform .25s ease",


  overflow:"hidden",

};



/* ===========================================================
   ICON
=========================================================== */

export const iconStyle: CSSProperties = {

  display:"none",

};



/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  fontSize:"11px",

  fontWeight:500,

  letterSpacing:"1px",

  textTransform:"uppercase",

  color:"#D4AF37",

  textAlign:"center",

};



/* ===========================================================
   VALUE
=========================================================== */

export const valueStyle: CSSProperties = {

  marginTop:"6px",

  fontSize:"17px",

  fontWeight:500,

  color:"#FFFFFF",

  textAlign:"center",

};



/* ===========================================================
   DESCRIPTION
=========================================================== */

export const descriptionStyle: CSSProperties = {

  display:"none",

};


/* ===========================================================
   PAGINATION CARD
=========================================================== */

export const paginationCardStyle: CSSProperties = {

  width:"150px",

  height:"100px",

  borderRadius:"18px",

  display:"flex",

  justifyContent:"center",

  alignItems:"center",

  gap:"14px",

  background:"transparent",

  border:
    "1px solid rgba(212,175,55,.65)",

  boxShadow:
    "0 8px 20px rgba(0,0,0,.12)",

};



/* ===========================================================
   PAGINATION BUTTON
=========================================================== */

export const paginationButtonStyle: CSSProperties = {

  width:"34px",

  height:"34px",

  borderRadius:"50%",

  border:
    "1px solid rgba(212,175,55,.85)",

  background:"transparent",

  color:"#FFFFFF",

  cursor:"pointer",

  fontSize:"20px",

  fontWeight:300,

  display:"flex",

  justifyContent:"center",

  alignItems:"center",

  lineHeight:1,

};



/* ===========================================================
   ACTIVE DOT
=========================================================== */

export const paginationActiveDotStyle: CSSProperties = {

  width:"5px",

  height:"5px",

  borderRadius:"50%",

  background:"#D4AF37",

};



/* ===========================================================
   NORMAL DOT
=========================================================== */

export const paginationDotStyle: CSSProperties = {

  width:"5px",

  height:"5px",

  borderRadius:"50%",

  background:"#FFFFFF",

};



/* ===========================================================
   PAGINATION WRAPPER
=========================================================== */

export const paginationCenterStyle: CSSProperties = {

  display:"flex",

  alignItems:"center",

  justifyContent:"center",

  gap:"6px",

};
