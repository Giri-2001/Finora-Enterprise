/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER NOMINEE SUMMARY
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Summary card layout
   - Nominee statistics presentation
   - Verification statistics presentation
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

  fontSize: "14px",

  lineHeight: 1.2,

  fontWeight: 850,
};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {
  margin: "3px 0 0",

  color:
    "rgba(255,255,255,.46)",

  fontSize: "8.5px",

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
    "8px 0 9px",

  background:
    "rgba(214,176,106,.16)",
};

/* ===========================================================
   STATS GRID
=========================================================== */

export const statsGridStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  display: "grid",

  gridTemplateColumns:
    "repeat(3,minmax(0,1fr))",

  gap: "8px",
};

/* ===========================================================
   STAT
=========================================================== */

export const statStyle: CSSProperties = {
  minWidth: 0,

  minHeight: "58px",

  boxSizing: "border-box",

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  justifyContent: "center",

  gap: "5px",

  padding: "7px 6px",

  borderRadius: "11px",

  border:
    "1px solid rgba(214,176,106,.18)",

  background:
    "rgba(0,0,0,.13)",

  overflow: "hidden",
};

/* ===========================================================
   STAT LABEL
=========================================================== */

export const statLabelStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.48)",

  fontSize: "7.5px",

  lineHeight: 1.2,

  fontWeight: 750,

  textTransform: "uppercase",

  letterSpacing: ".25px",

  textAlign: "center",
};

/* ===========================================================
   STAT VALUE
=========================================================== */

export const statValueStyle: CSSProperties = {
  color: "#F0C75E",

  fontSize: "15px",

  lineHeight: 1,

  fontWeight: 900,
};

/* ===========================================================
   FOOTER
=========================================================== */

export const footerStyle: CSSProperties = {
  marginTop: "8px",

  color:
    "rgba(255,255,255,.35)",

  fontSize: "7.5px",

  lineHeight: 1.3,

  fontWeight: 550,
};
