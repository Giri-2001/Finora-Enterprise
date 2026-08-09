/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER IDENTITY HANGER™

   WIZARD PRESENTATION STYLES
   -----------------------------------------------------------
   Responsibility:
   - Premium hanging presentation
   - No card logic
   - No flip logic
   - No navigation logic
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle:
  CSSProperties = {

  width: "180px",

  minWidth: "180px",

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  justifyContent: "flex-start",

  position: "relative",

  overflow: "visible",

  boxSizing: "border-box",

  userSelect: "none",
};

/* ===========================================================
   PIN
=========================================================== */

export const pinStyle:
  CSSProperties = {

  width: "10px",

  height: "10px",

  flexShrink: 0,

  borderRadius: "50%",

  background:
    "linear-gradient(180deg,#D6B06A,#8A612B)",

  border:
    "1px solid #6B4B1D",

  boxShadow:
    "0 2px 4px rgba(0,0,0,.25)",

  zIndex: 3,
};

/* ===========================================================
   ROPE
=========================================================== */

export const ropeStyle:
  CSSProperties = {

  width: "2px",

  height: "14px",

  flexShrink: 0,

  background:
    "linear-gradient(180deg,#D5D9E0,#7B8798,#475569)",

  boxShadow:
    "0 0 2px rgba(255,255,255,.2)",
};

/* ===========================================================
   METAL CONNECTOR
=========================================================== */

export const connectorStyle:
  CSSProperties = {

  width: "8px",

  height: "8px",

  flexShrink: 0,

  borderRadius: "50%",

  background:
    "linear-gradient(180deg,#D6B06A,#8A612B)",

  border:
    "1px solid #6B4B1D",

  marginTop: "-2px",

  marginBottom: "2px",

  boxShadow:
    "0 1px 2px rgba(0,0,0,.25)",

  zIndex: 3,
};

/* ===========================================================
   HANGER
=========================================================== */

export const hangerStyle:
  CSSProperties = {

  width: "52px",

  height: "22px",

  flexShrink: 0,

  border:
    "3px solid #7C8798",

  borderTop: "0",

  borderRadius:
    "0 0 36px 36px",

  boxSizing: "border-box",

  filter:
    "drop-shadow(0 2px 2px rgba(0,0,0,.2))",
};

/* ===========================================================
   CARD HOLDER
=========================================================== */

export const cardHolderStyle:
  CSSProperties = {

  width: "180px",

  height: "350px",

  flexShrink: 0,

  marginTop: "3px",

  display: "flex",

  alignItems: "flex-start",

  justifyContent: "center",

  position: "relative",

  overflow: "visible",

  boxSizing: "border-box",

};

/* ===========================================================
   BOTTOM FINISHING RAIL
=========================================================== */

export const bottomRailStyle:
  CSSProperties = {

  width: "150px",

  height: "3px",

  flexShrink: 0,

  marginTop: "12px",

  borderRadius: "999px",

  background:
    "linear-gradient(90deg,transparent,#D4AF37,transparent)",

  boxShadow:
    "0 4px 12px rgba(212,175,55,.35)",
};
