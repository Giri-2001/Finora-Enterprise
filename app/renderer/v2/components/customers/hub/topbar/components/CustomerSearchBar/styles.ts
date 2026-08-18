/* ===========================================================

   FINORA ENTERPRISE OS™

   CUSTOMER SEARCH BAR

   STYLES

=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  gap: "8px",

  width: "100%",

  maxWidth: "260px",

  padding: "0 12px",

  height: "30px",

  background: "#F6E7C1",

  border: "1px solid #C79A52",

  borderRadius: "999px",

  boxShadow:
    "0 4px 12px rgba(0,0,0,.12)",

  boxSizing: "border-box",

};

/* ===========================================================
   ICON
=========================================================== */

export const iconStyle: CSSProperties = {

  fontSize: "18px",

  color: "#64748B",

  userSelect: "none",

};

/* ===========================================================
   INPUT
=========================================================== */

export const inputStyle: CSSProperties = {

  flex: 1,

  minWidth: 0,

  border: "none",

  outline: "none",

  background: "transparent",

  fontSize: "15px",

  fontWeight: 500,

  color: "#0F172A",

  boxSizing: "border-box",

};

/* ===========================================================
   END
=========================================================== */