/* ===========================================================
   FINORA ENTERPRISE OS™
   VERIFICATION STATUS PRESENTATION STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   CARD
=========================================================== */

export const cardStyle: CSSProperties = {
  minHeight: 0,

  display: "grid",

  gridTemplateColumns:
    "1.2fr 1fr 1fr",

  alignItems: "center",

  columnGap: "12px",

  padding: "10px 14px",

  boxSizing: "border-box",

  borderRadius: "14px",

  border:
    "1px solid rgba(214,176,106,.30)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015))",

  boxShadow:
    "0 7px 18px rgba(0,0,0,.12)",

  overflow: "hidden",
};

/* ===========================================================
   HEADING
=========================================================== */

export const headingStyle: CSSProperties = {
  margin: 0,

  color: "#F3E4C2",

  fontSize: "12px",

  fontWeight: 850,
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

  fontWeight: 800,

  whiteSpace: "nowrap",
});

/* ===========================================================
   INFO
=========================================================== */

export const infoStyle: CSSProperties = {
  color:
    "rgba(255,255,255,.48)",

  fontSize: "9px",

  fontWeight: 600,

  whiteSpace: "nowrap",
};
