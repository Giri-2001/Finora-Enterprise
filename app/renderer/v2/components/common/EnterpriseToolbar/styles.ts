/* ===========================================================
   FINORA ENTERPRISE OS™
   ENTERPRISE TOOLBAR™

   STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

import {

  TOOLBAR_HEIGHT,
  TOOLBAR_GAP,
  LEFT_SECTION_WIDTH,
  RIGHT_SECTION_WIDTH,
  ACTION_BUTTON_HEIGHT,
  ACTION_BUTTON_RADIUS,
  COUNTER_RADIUS,

} from "./constants";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns:
    `${LEFT_SECTION_WIDTH}px minmax(0,1fr) ${RIGHT_SECTION_WIDTH}px`,

  alignItems: "center",

  columnGap: `${TOOLBAR_GAP}px`,

  width: "100%",

  minHeight: `${TOOLBAR_HEIGHT}px`,

};

/* ===========================================================
   LEFT
=========================================================== */

export const leftStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

};

/* ===========================================================
   CENTER
=========================================================== */

export const centerStyle: CSSProperties = {

  display: "flex",

  justifyContent: "center",

  alignItems: "center",

};

/* ===========================================================
   RIGHT
=========================================================== */

export const rightStyle: CSSProperties = {

  display: "flex",

  justifyContent: "flex-end",

  alignItems: "center",

};

/* ===========================================================
   ACTION BUTTON
=========================================================== */

export const actionButtonStyle: CSSProperties = {

  height: `${ACTION_BUTTON_HEIGHT}px`,

  padding: "0 22px",

  border: "none",

  borderRadius: `${ACTION_BUTTON_RADIUS}px`,

  cursor: "pointer",

  color: "#FFFFFF",

  fontWeight: 700,

  fontSize: "14px",

  background:
    "linear-gradient(180deg,#B78A3C,#8B642B)",

  boxShadow:
    "0 8px 20px rgba(183,138,60,.25)",

  transition:
    "all .25s ease",

};

/* ===========================================================
   COUNTER
=========================================================== */

export const counterStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  minHeight: "46px",

  padding: "0 18px",

  borderRadius: `${COUNTER_RADIUS}px`,

  background:
    "rgba(255,255,255,.08)",

  border:
    "1px solid rgba(212,175,55,.35)",

  color: "#F6D58A",

  fontWeight: 700,

  whiteSpace: "nowrap",

};
