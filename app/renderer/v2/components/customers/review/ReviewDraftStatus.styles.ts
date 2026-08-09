/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER REVIEW DRAFT STATUS
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Draft status card
   - Saved / pending badges
   - Status information
   - FINORA enterprise visual language
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

  alignItems: "flex-start",

  padding: "18px 14px",

  marginTop: "8px",

  borderRadius: "14px",

  border:
    "1.5px solid rgba(214,176,106,.26)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.014))",

  boxShadow:
    "0 7px 18px rgba(0,0,0,.10)",

  overflow: "hidden",
};

/* ===========================================================
   BADGE BASE
=========================================================== */

export const badgeStyle: CSSProperties = {

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  minHeight: "22px",

  boxSizing: "border-box",

  padding: "0 10px",

  borderRadius: "999px",

  fontSize: "12px",

  lineHeight: 1,

  fontWeight: 750,

  letterSpacing: ".15px",

  whiteSpace: "nowrap",
};

/* ===========================================================
   SAVED BADGE
=========================================================== */

export const savedBadgeStyle: CSSProperties = {

  border:
    "1px solid rgba(134,239,172,.30)",

  background:
    "rgba(34,197,94,.10)",

  color: "#86EFAC",
};

/* ===========================================================
   PENDING BADGE
=========================================================== */

export const pendingBadgeStyle: CSSProperties = {

  border:
    "1px solid rgba(214,176,106,.30)",

  background:
    "rgba(214,176,106,.08)",

  color: "#F0C75E",
};

/* ===========================================================
   INFORMATION
=========================================================== */

export const infoStyle: CSSProperties = {

  marginTop: "6px",

  color:
    "rgba(255,255,255,.40)",

  fontSize: "12px",

  lineHeight: 1.3,

  fontWeight: 550,
};

/* ===========================================================
   LAST SAVED
=========================================================== */

export const lastSavedStyle: CSSProperties = {

  marginTop: "6px",

  color:
    "rgba(255,255,255,.28)",

  fontSize: "7.5px",

  lineHeight: 1.2,

  fontWeight: 550,
};
