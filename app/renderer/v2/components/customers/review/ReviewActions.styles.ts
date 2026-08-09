/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER REVIEW ACTIONS
   PRESENTATION STYLES

   RESPONSIBILITY:
   - Final review action layout
   - Save Customer
   - Edit Details
   - Cancel
   - Full-width vertical action presentation
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   WRAPPER

   FINAL STEP ACTION ORDER:

   Save Customer
   Edit Details
   Cancel

   Every button receives its own full-width row.
=========================================================== */

export const wrapperStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  display: "flex",

  flexDirection: "column",

  gap: "8px",

  marginTop: "8px",
};

/* ===========================================================
   BASE BUTTON
=========================================================== */

const baseButtonStyle: CSSProperties = {

  width: "100%",

  minWidth: 0,

  height: "46px",

  boxSizing: "border-box",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  borderRadius: "11px",

  padding: "0 16px",

  fontSize: "12px",

  lineHeight: 1,

  fontWeight: 750,

  letterSpacing: ".15px",

  cursor: "pointer",

  transition:
    "border-color .18s ease,background .18s ease,box-shadow .18s ease,opacity .18s ease",

  whiteSpace: "nowrap",

  overflow: "hidden",

  textOverflow: "ellipsis",
};

/* ===========================================================
   PRIMARY — SAVE CUSTOMER
=========================================================== */

export const primaryButtonStyle: CSSProperties = {

  ...baseButtonStyle,

  border:
    "1.5px solid rgba(214,176,106,.70)",

  background:
    "linear-gradient(145deg,#95633D,#6B4029)",

  color:
    "#FFFFFF",

  boxShadow:
    "0 6px 16px rgba(0,0,0,.18),inset 0 1px 1px rgba(255,255,255,.09)",
};

/* ===========================================================
   SECONDARY — EDIT DETAILS
=========================================================== */

export const secondaryButtonStyle: CSSProperties = {

  ...baseButtonStyle,

  border:
    "1.5px solid rgba(214,176,106,.40)",

  background:
    "rgba(255,255,255,.055)",

  color:
    "#F3E4C2",

  boxShadow:
    "0 5px 14px rgba(0,0,0,.12)",
};

/* ===========================================================
   DANGER — CANCEL
=========================================================== */

export const dangerButtonStyle: CSSProperties = {

  ...baseButtonStyle,

  border:
    "1.5px solid rgba(248,113,113,.32)",

  background:
    "rgba(248,113,113,.075)",

  color:
    "#FCA5A5",

  boxShadow:
    "0 5px 14px rgba(0,0,0,.10)",
};
