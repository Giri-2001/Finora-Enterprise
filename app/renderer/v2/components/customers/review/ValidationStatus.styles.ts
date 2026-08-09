/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER VALIDATION STATUS
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Validation card layout
   - Status rows
   - Complete / pending states
   - FINORA enterprise visual language
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   CARD
=========================================================== */

export const cardStyle: CSSProperties = {

  minWidth: 0,

  minHeight: 0,

  width: "100%",

  boxSizing: "border-box",

  display: "flex",

  flexDirection: "column",

  padding: "13px 14px",

  borderRadius: "16px",

  border:
    "1.5px solid rgba(214,176,106,.30)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015))",

  boxShadow:
    "0 8px 22px rgba(0,0,0,.12)",

  overflow: "hidden",
};

/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {

  minWidth: 0,

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",
};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin: 0,

  color: "#F3E4C2",

  fontSize: "15px",

  lineHeight: 1.2,

  fontWeight: 750,

  letterSpacing: ".1px",
};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {

  margin: "3px 0 0",

  color:
    "rgba(255,255,255,.46)",

  fontSize: "12px",

  lineHeight: 1.3,

  fontWeight: 550,
};

/* ===========================================================
   DIVIDER
=========================================================== */

export const dividerStyle: CSSProperties = {

  width: "100%",

  height: "1px",

  flexShrink: 0,

  margin:
    "8px 0 3px",

  background:
    "rgba(214,176,106,.16)",
};

/* ===========================================================
   ROW
=========================================================== */

export const rowStyle: CSSProperties = {

  minWidth: 0,

  minHeight: "43px",

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "12px",

  borderBottom:
    "1px solid rgba(255,255,255,.065)",
};


/* ===========================================================
   LABEL
=========================================================== */

export const labelStyle: CSSProperties = {

  minWidth: 0,

  color: "#FFFFFF",

  fontSize: "12px",

  lineHeight: 1.2,

  fontWeight: 700,

  letterSpacing: ".15px",

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};

/* ===========================================================
   COMPLETE STATUS
=========================================================== */

export const statusCompleteStyle: CSSProperties = {

  flexShrink: 0,

  color: "#86EFAC",

  fontSize: "10px",

  lineHeight: 1,

  fontWeight: 750,

  letterSpacing: ".15px",

  whiteSpace: "nowrap",
};

/* ===========================================================
   PENDING STATUS
=========================================================== */

export const statusPendingStyle: CSSProperties = {

  flexShrink: 0,

  color: "#F0C75E",

  fontSize: "10px",

  lineHeight: 1,

  fontWeight: 750,

  letterSpacing: ".15px",

  whiteSpace: "nowrap",
};
