/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER RELATIONSHIP SELECTOR
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Relationship selector layout
   - FINORA enterprise visual language
   - Select presentation
   - Relationship helper text
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   WRAPPER
=========================================================== */

export const wrapperStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",

  gap: "5px",

  padding:
    "11px 14px",

  borderRadius: "14px",

  border:
    "1.5px solid rgba(214,176,106,.30)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015))",

  boxShadow:
    "0 7px 18px rgba(0,0,0,.12)",

  overflow: "hidden",
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
   SELECT
=========================================================== */

export const selectStyle: CSSProperties = {
  width: "100%",

  height: "40px",

  boxSizing: "border-box",

  padding:
    "0 12px",

  borderRadius: "10px",

  border:
    "1.5px solid rgba(214,176,106,.46)",

  outline: "none",

  background:
    "linear-gradient(145deg,rgba(111,67,43,.68),rgba(77,43,29,.80))",

  color: "#FFFFFF",

  fontSize: "12px",

  fontWeight: 650,

  cursor: "pointer",

  boxShadow:
    "inset 0 1px 2px rgba(0,0,0,.18),0 3px 8px rgba(0,0,0,.10)",
};

/* ===========================================================
   OPTION
=========================================================== */

export const optionStyle: CSSProperties = {
  background: "#402417",

  color: "#FFFFFF",

  fontSize: "12px",

  fontWeight: 600,
};

/* ===========================================================
   HELPER
=========================================================== */

export const helperStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.38)",

  fontSize: "8px",

  lineHeight: 1.3,

  fontWeight: 550,

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};
