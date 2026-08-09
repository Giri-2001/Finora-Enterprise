/* ===========================================================
   FINORA ENTERPRISE OS™
   KYC PREVIEW PRESENTATION STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   CARD
=========================================================== */

export const cardStyle: CSSProperties = {
  minHeight: 0,

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",

  padding: "14px 15px",

  borderRadius: "16px",

  border:
    "1.5px solid rgba(214,176,106,.38)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.018))",

  boxShadow:
    "0 10px 26px rgba(0,0,0,.16)",

  overflow: "hidden",
};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {
  margin: 0,

  color: "#F3E4C2",

  fontSize: "17px",

  fontWeight: 850,
};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {
  margin: "3px 0 9px",

  color:
    "rgba(255,255,255,.48)",

  fontSize: "9px",

  fontWeight: 600,
};

/* ===========================================================
   ROW
=========================================================== */

export const rowStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns:
    "78px minmax(0,1fr)",

  alignItems: "center",

  gap: "9px",

  padding: "8px 0",

  borderBottom:
    "1px solid rgba(214,176,106,.10)",
};

/* ===========================================================
   LABEL
=========================================================== */

export const labelStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.48)",

  fontSize: "9px",

  fontWeight: 750,

  textTransform: "uppercase",

  letterSpacing: ".35px",
};

/* ===========================================================
   VALUE
=========================================================== */

export const valueStyle: CSSProperties = {
  color: "#FFFFFF",

  fontSize: "11px",

  fontWeight: 750,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",
};

/* ===========================================================
   STATUS
=========================================================== */

export const statusStyle = (
  verified?: boolean,
): CSSProperties => ({
  color:
    verified
      ? "#86EFAC"
      : "#F0C75E",

  fontSize: "11px",

  fontWeight: 850,
});
