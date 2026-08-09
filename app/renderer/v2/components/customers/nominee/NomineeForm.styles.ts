/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER NOMINEE FORM
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Nominee form layout
   - FINORA enterprise visual language
   - Input presentation
   - Typography
   - Compact studio spacing
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   WRAPPER
=========================================================== */

export const wrapperStyle: CSSProperties = {

  minWidth: 0,

  minHeight: 0,

  width: "100%",

  boxSizing: "border-box",

  display: "flex",

  flexDirection: "column",

  padding: "13px 15px",

  borderRadius: "16px",

  border:
    "1.5px solid rgba(214,176,106,.34)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018))",

  boxShadow:
    "0 10px 28px rgba(0,0,0,.14)",

  overflow: "hidden",
};

/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {

  flexShrink: 0,

  display: "flex",

  alignItems: "center",

  minHeight: "32px",
};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin: 0,

  color: "#F3E4C2",

  fontSize: "15px",

  lineHeight: 1.2,

  fontWeight: 850,

  letterSpacing: ".1px",
};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {

  margin: "3px 0 0",

  color:
    "rgba(255,255,255,.52)",

  fontSize: "9px",

  lineHeight: 1.3,

  fontWeight: 550,
};

/* ===========================================================
   DIVIDER
=========================================================== */

export const sectionDividerStyle: CSSProperties = {

  width: "100%",

  height: "1px",

  flexShrink: 0,

  margin:
    "7px 0 10px",

  background:
    "rgba(214,176,106,.17)",
};

/* ===========================================================
   FORM GRID
=========================================================== */

export const gridStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  minHeight: 0,

  display: "grid",

  gridTemplateColumns:
    "repeat(2,minmax(0,1fr))",

  columnGap: "12px",

  rowGap: "9px",

  alignContent: "start",

  overflow: "hidden",
};

/* ===========================================================
   FIELD
=========================================================== */

export const fieldStyle: CSSProperties = {

  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  gap: "4px",
};

/* ===========================================================
   LABEL
=========================================================== */

export const labelStyle: CSSProperties = {

  color: "#FFFFFF",

  fontSize: "9.5px",

  lineHeight: 1.1,

  fontWeight: 850,

  letterSpacing: ".35px",

  textTransform: "uppercase",
};

/* ===========================================================
   INPUT
=========================================================== */

export const inputStyle: CSSProperties = {

  width: "100%",

  height: "39px",

  boxSizing: "border-box",

  padding: "0 12px",

  borderRadius: "10px",

  border:
    "1.5px solid rgba(214,176,106,.46)",

  outline: "none",

  background:
    "linear-gradient(145deg,rgba(111,67,43,.68),rgba(77,43,29,.80))",

  color: "#FFFFFF",

  fontSize: "12px",

  fontWeight: 650,

  boxShadow:
    "inset 0 1px 2px rgba(0,0,0,.18),0 3px 8px rgba(0,0,0,.10)",

  transition:
    "border-color .18s ease,box-shadow .18s ease",
};

/* ===========================================================
   READONLY INPUT
=========================================================== */

export const readonlyInputStyle: CSSProperties = {

  ...inputStyle,

  background:
    "linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.035))",

  border:
    "1.5px solid rgba(134,239,172,.28)",

  color: "#FFFFFF",

  cursor: "default",

  boxShadow:
    "inset 0 1px 2px rgba(0,0,0,.12)",
};

/* ===========================================================
   HELPER
=========================================================== */

export const helperStyle: CSSProperties = {

  marginTop: "0",

  color:
    "rgba(255,255,255,.36)",

  fontSize: "7.5px",

  lineHeight: 1.2,

  fontWeight: 550,

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};
