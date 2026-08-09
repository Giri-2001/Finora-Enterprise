/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER NOMINEE PREVIEW
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Preview card layout
   - Nominee data rows
   - Linked customer status
   - Preview typography
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

  fontSize: "15px",

  lineHeight: 1.2,

  fontWeight: 850,
};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {
  margin: "3px 0 0",

  color:
    "rgba(255,255,255,.48)",

  fontSize: "9px",

  lineHeight: 1.3,

  fontWeight: 550,
};

/* ===========================================================
   LINKED BADGE
=========================================================== */

export const linkedBadgeStyle: CSSProperties = {
  flexShrink: 0,

  display: "inline-flex",

  alignItems: "center",

  padding: "5px 9px",

  borderRadius: "999px",

  border:
    "1px solid rgba(134,239,172,.34)",

  background:
    "rgba(34,197,94,.10)",

  color: "#86EFAC",

  fontSize: "8px",

  fontWeight: 850,

  letterSpacing: ".2px",
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
    "82px minmax(0,1fr)",

  alignItems: "center",

  gap: "8px",

  minHeight: "30px",

  borderBottom:
    "1px solid rgba(255,255,255,.055)",
};

/* ===========================================================
   LABEL
=========================================================== */

export const labelStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.45)",

  fontSize: "8px",

  lineHeight: 1.2,

  fontWeight: 750,

  textTransform: "uppercase",

  letterSpacing: ".3px",
};

/* ===========================================================
   VALUE
=========================================================== */

export const valueStyle: CSSProperties = {
  minWidth: 0,

  color: "#FFFFFF",

  fontSize: "10.5px",

  lineHeight: 1.2,

  fontWeight: 750,

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};

/* ===========================================================
   EMPTY VALUE
=========================================================== */

export const emptyValueStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.32)",

  fontSize: "10px",

  fontWeight: 650,
};

/* ===========================================================
   FOOTER
=========================================================== */

export const footerStyle: CSSProperties = {
  marginTop: "8px",

  color:
    "rgba(255,255,255,.38)",

  fontSize: "8px",

  lineHeight: 1.35,

  fontWeight: 550,
};
