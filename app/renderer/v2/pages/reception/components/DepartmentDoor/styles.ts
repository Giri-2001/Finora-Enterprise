/* ===========================================================
   FINORA ENTERPRISE OS™
   RECEPTION™

   DEPARTMENT DOOR™

   STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {

  DOOR_WIDTH,
  DOOR_HEIGHT,
  DOOR_RADIUS,
  DOOR_BACKGROUND,
  DOOR_BORDER,
  DOOR_SHADOW,

} from "./constants";


/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  width: DOOR_WIDTH,

  height: DOOR_HEIGHT,

  borderRadius: DOOR_RADIUS,

  background: DOOR_BACKGROUND,

  border: `2px solid ${DOOR_BORDER}`,

  boxShadow: DOOR_SHADOW,

  animation:
"doorBreath 4s ease-in-out infinite",

  display: "flex",

  flexDirection: "column",

  justifyContent: "space-between",

  alignItems: "center",

  padding: "28px",

  cursor: "pointer",

  transition:
"all .45s cubic-bezier(.22,1,.36,1)",

  userSelect: "none",

};

/* ===========================================================
   ICON
=========================================================== */

export const iconStyle: CSSProperties = {

  width: "46px",

  height: "46px",

  borderRadius: "14px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  fontSize: "34px",

  background:
    "rgba(255,255,255,.12)",

  border:
    "1px solid rgba(212,175,55,.6)",

};

/* ===========================================================
   CONTENT
=========================================================== */

export const contentStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  gap: "4px",

};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin: 0,

  color: "#FFFFFF",

  fontSize: "17px",

  letterSpacing: "0.5px",

  fontWeight: 700,

  textAlign: "center",

};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {

  margin: 0,

  color: "#F8FAFC",

  fontSize: "11px",

  lineHeight: "14px",

  textAlign: "center",

};

/* ===========================================================
   STATUS
=========================================================== */

export const statusStyle: CSSProperties = {

  padding: "4px 12px",

  borderRadius: "999px",

  background: "#FFFFFF",

  fontSize: "11px",

  fontWeight: 700,

};
