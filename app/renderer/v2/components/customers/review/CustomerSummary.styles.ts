/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER REVIEW SUMMARY
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Summary card layout
   - Customer information rows
   - KYC status presentation
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

  padding: "14px 15px",

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

  minWidth: 0,

  display: "flex",

  alignItems: "flex-start",

  justifyContent: "space-between",

  gap: "10px",
};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin: 0,

  color: "#F3E4C2",

  fontSize: "16px",

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
    "rgba(255,255,255,.48)",

  fontSize: "12px",

  lineHeight: 1.3,

  fontWeight: 550,
};

/* ===========================================================
   STATUS
=========================================================== */

export const statusStyle: CSSProperties = {

  flexShrink: 0,

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  minHeight: "22px",

  padding: "0 9px",

  boxSizing: "border-box",

  borderRadius: "999px",

  border:
    "1px solid rgba(214,176,106,.28)",

  background:
    "rgba(214,176,106,.08)",

  color: "#F3E4C2",

  fontSize: "12px",

  lineHeight: 1,

  fontWeight: 750,

  letterSpacing: ".15px",

  whiteSpace: "nowrap",
};

/* ===========================================================
   DIVIDER
=========================================================== */

export const dividerStyle: CSSProperties = {

  width: "100%",

  height: "1px",

  flexShrink: 0,

  margin:
    "9px 0 4px",

  background:
    "rgba(214,176,106,.17)",
};

/* ===========================================================
   ROW
=========================================================== */

export const rowStyle: CSSProperties = {

  minWidth: 0,

  display: "grid",

  gridTemplateColumns:
    "110px minmax(0,1fr)",

  alignItems: "center",

  gap: "10px",

  minHeight: "43px",

  borderBottom:
    "1px solid rgba(255,255,255,.065)",
};

/* ===========================================================
   LABEL
=========================================================== */

export const labelStyle: CSSProperties = {

  color: "#FFFFFF",

  fontSize: "11px",

  lineHeight: 1.2,

  fontWeight: 700,

  textTransform: "uppercase",

  letterSpacing: ".35px",
};

/* ===========================================================
   VALUE
=========================================================== */

export const valueStyle: CSSProperties = {

  minWidth: 0,

  color: "#FFFFFF",

  fontSize: "12px",

  lineHeight: 1.25,

  fontWeight: 700,

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};

/* ===========================================================
   EMPTY VALUE
=========================================================== */

export const emptyValueStyle: CSSProperties = {

  color:
    "rgba(255,255,255,.34)",

  fontSize: "11px",

  fontWeight: 700,
};
