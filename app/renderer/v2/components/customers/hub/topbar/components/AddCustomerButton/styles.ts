/* ===========================================================
   FINORA ENTERPRISE OS™
   ADD CUSTOMER BUTTON

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   BUTTON
=========================================================== */

export const buttonStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  gap: "10px",

  height: "54px",

  padding: "0 22px",

  border: "none",

  borderRadius: "16px",

  cursor: "pointer",

  background: "#2563EB",

  color: "#FFFFFF",

  fontSize: "15px",

  fontWeight: 700,

  letterSpacing: "0.3px",

  transition: "all .25s ease",

  boxShadow:
    "0 10px 24px rgba(37,99,235,0.28)",

};

/* ===========================================================
   ICON
=========================================================== */

export const iconStyle: CSSProperties = {

  fontSize: "18px",

  lineHeight: 1,

};

/* ===========================================================
   LABEL
=========================================================== */

export const labelStyle: CSSProperties = {

  whiteSpace: "nowrap",

  userSelect: "none",

};
