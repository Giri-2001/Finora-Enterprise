/* ===========================================================
   FINORA ENTERPRISE OS™

   DOCUMENT UPLOADER PRESENTATION STYLES

   RESPONSIBILITY:
   - Fit upload content completely inside its parent panel
   - Maintain FINORA Smart Wall visual language
   - Prevent internal content clipping
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   CARD
=========================================================== */

export const cardStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: "58px",

  boxSizing: "border-box",

  display: "flex",
  flexDirection: "column",

  justifyContent: "center",

  gap: "3px",

  padding: "8px 12px",

  borderRadius: "13px",

  border:
    "1.5px dashed rgba(214,176,106,.48)",

  background:
    "linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.015))",

  boxShadow:
    "0 6px 16px rgba(0,0,0,.12)",

  overflow: "hidden",
};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {
  margin: 0,

  color: "#F3E4C2",

  fontSize: "11px",

  lineHeight: 1.2,

  fontWeight: 850,

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};

/* ===========================================================
   STATUS
=========================================================== */

export const statusStyle: CSSProperties = {
  margin: 0,

  color: "#F0C75E",

  fontSize: "10.5px",

  lineHeight: 1.25,

  fontWeight: 750,

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};

/* ===========================================================
   TEXT
=========================================================== */

export const textStyle: CSSProperties = {
  margin: 0,

  color:
    "rgba(255,255,255,.54)",

  fontSize: "9px",

  lineHeight: 1.25,

  fontWeight: 550,

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};
