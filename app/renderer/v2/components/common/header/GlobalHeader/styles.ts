/* ===========================================================
   FINORA ENTERPRISE OS™
   GLOBAL HEADER™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  position: "sticky",

  top: 0,

  zIndex: 1000,

  width: "100%",

  height: "56px",

  display: "grid",

  gridTemplateColumns: "320px 1fr 260px",

  alignItems: "center",

  padding: "0 24px",

  background: "#FFFFFF",

  borderBottom: "1px solid #E2E8F0",

  boxSizing: "border-box",

  boxShadow:
    "0 4px 12px rgba(15,23,42,.06)",

};

/* ===========================================================
   LEFT
=========================================================== */

export const leftStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  gap: "12px",

  cursor: "pointer",

};

/* ===========================================================
   LOGO
=========================================================== */

export const logoStyle: CSSProperties = {

  fontSize: "22px",

  fontWeight: 800,

  color: "#0F172A",

  letterSpacing: ".5px",

  userSelect: "none",

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
   DEPARTMENT
=========================================================== */

export const departmentStyle: CSSProperties = {

  fontSize: "18px",

  fontWeight: 700,

  color: "#334155",

  whiteSpace: "nowrap",

};

/* ===========================================================
   RIGHT
=========================================================== */

export const rightStyle: CSSProperties = {

  display: "flex",

  justifyContent: "flex-end",

  alignItems: "center",

  gap: "18px",

};

/* ===========================================================
   ICON
=========================================================== */

export const actionStyle: CSSProperties = {

  cursor: "pointer",

  fontSize: "18px",

  userSelect: "none",

};
