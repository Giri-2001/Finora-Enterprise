/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER WORKSPACE™

   STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "340px minmax(0,1fr)",

  gap: "16px",

  width: "100%",

  height: "fit-content",

  minHeight: 0,

};
/* ===========================================================
   SIDEBAR
=========================================================== */

export const sidebarStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "18px",

};

/* ===========================================================
   CONTENT
=========================================================== */

export const contentStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  minWidth: 0,

  gap: "20px",

  height: "fit-content",

};
