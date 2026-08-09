/* ===========================================================
   FINORA ENTERPRISE OS™

   KYC DRAFT STATUS PRESENTATION STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   WRAPPER
=========================================================== */

export const wrapperStyle: CSSProperties = {
  width: "100%",
  minHeight: 0,
  boxSizing: "border-box",

  padding: "14px 16px",

  borderRadius: "15px",

  border:
    "1px solid rgba(214,176,106,.32)",

  background:
    "linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.018))",

  boxShadow:
    "0 8px 22px rgba(0,0,0,.18)",

  overflow: "hidden",
};

/* ===========================================================
   BADGE BASE
=========================================================== */

export const badgeStyle: CSSProperties = {
  display: "inline-flex",

  alignItems: "center",
  justifyContent: "center",

  padding: "7px 12px",

  borderRadius: "999px",

  fontSize: "12px",

  lineHeight: 1.2,

  fontWeight: 800,

  letterSpacing: ".1px",

  whiteSpace: "nowrap",
};

/* ===========================================================
   SAVED
=========================================================== */

export const savedStyle: CSSProperties = {
  ...badgeStyle,

  background:
    "rgba(34,197,94,.12)",

  border:
    "1px solid rgba(134,239,172,.42)",

  color:
    "#86EFAC",
};

/* ===========================================================
   PENDING
=========================================================== */

export const pendingStyle: CSSProperties = {
  ...badgeStyle,

  background:
    "rgba(240,199,94,.11)",

  border:
    "1px solid rgba(240,199,94,.40)",

  color:
    "#F0C75E",
};

/* ===========================================================
   INFORMATION
=========================================================== */

export const infoStyle: CSSProperties = {
  marginTop: "7px",

  color:
    "rgba(255,255,255,.68)",

  fontSize: "12px",

  lineHeight: 1.45,

  fontWeight: 500,
};
