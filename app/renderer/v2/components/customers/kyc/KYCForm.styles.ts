/* ===========================================================
   FINORA ENTERPRISE OS™

   KYC FORM PRESENTATION STYLES

   RESPONSIBILITY:
   - Compact two-column KYC field layout
   - Vertically balance fields inside Identity Information
   - Keep labels and inputs comfortably spaced
   - Prevent clipping
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   FORM GRID
=========================================================== */

export const kycFormGridStyle: CSSProperties = {
  flex: "1 1 auto",

  minHeight: 0,
  minWidth: 0,

  width: "100%",

  display: "grid",

  gridTemplateColumns:
    "repeat(2,minmax(0,1fr))",

  columnGap: "12px",

  rowGap: "10px",

  /*
    Identity Information container now has enough height.
    Center the complete 2-row form vertically so there is
    no unnecessary empty space at the top or bottom.
  */

  alignContent: "center",

  overflow: "hidden",

  boxSizing: "border-box",
};

/* ===========================================================
   FIELD
=========================================================== */

export const fieldStyle: CSSProperties = {
  minWidth: 0,
  minHeight: 0,

  display: "flex",
  flexDirection: "column",

  /*
    Comfortable separation between field label
    and its input.
  */

  gap: "5px",

  boxSizing: "border-box",
};

/* ===========================================================
   LABEL
=========================================================== */

export const labelStyle: CSSProperties = {
  margin: 0,

  color: "#FFFFFF",

  fontSize: "9px",

  lineHeight: 1.1,

  fontWeight: 850,

  letterSpacing: ".35px",

  textTransform: "uppercase",

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};

/* ===========================================================
   INPUT
=========================================================== */

export const inputStyle: CSSProperties = {
  width: "100%",

  height: "40px",

  minHeight: "40px",

  boxSizing: "border-box",

  padding: "0 12px",

  borderRadius: "10px",

  border:
    "1.5px solid rgba(214,176,106,.48)",

  outline: "none",

  background:
    "linear-gradient(145deg,rgba(111,67,43,.68),rgba(77,43,29,.80))",

  color: "#FFFFFF",

  fontSize: "13px",

  fontWeight: 650,

  boxShadow:
    "inset 0 1px 2px rgba(0,0,0,.18),0 3px 8px rgba(0,0,0,.10)",
};
