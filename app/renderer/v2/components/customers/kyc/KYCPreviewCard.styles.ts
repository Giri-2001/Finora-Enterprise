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
    "1px solid var(--finora-theme-border-default, #D9DEE7)",

  background:
    "var(--finora-theme-surface-elevated, #111C2E)",

  boxShadow:
    "none",

  overflow: "hidden",

};

/* ===========================================================
   TITLE
=========================================================== */

export const titleStyle: CSSProperties = {

  margin: 0,

  color:
    "var(--finora-theme-text-primary, #FFFFFF)",

  fontSize: "17px",

  fontWeight: 850,

};

/* ===========================================================
   SUBTITLE
=========================================================== */

export const subtitleStyle: CSSProperties = {

  margin: "3px 0 9px",

  color:
    "var(--finora-theme-text-secondary, #AAB7C8)",

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
    "1px solid var(--finora-theme-border-default, #D9DEE7)",

};

/* ===========================================================
   LABEL
=========================================================== */

export const labelStyle: CSSProperties = {

  color:
    "var(--finora-theme-text-secondary, #AAB7C8)",

  fontSize: "9px",

  fontWeight: 750,

  textTransform: "uppercase",

  letterSpacing: ".35px",

};

/* ===========================================================
   VALUE
=========================================================== */

export const valueStyle: CSSProperties = {

  boxSizing: "border-box",

  width: "100%",

  minHeight: "45px",

  display: "flex",

  alignItems: "center",

  padding: "0 14px",

  borderRadius: "10px",

  border:
    "1px solid var(--finora-theme-border-default, #D9DEE7)",

  background:
    "var(--finora-theme-surface-input, #1B2B43)",

  color:
    "var(--finora-theme-text-primary, #FFFFFF)",

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
      ? "var(--finora-theme-status-success, #86EFAC)"
      : "var(--finora-theme-brand-accent, #4D82E6)",

  fontSize: "11px",

  fontWeight: 850,
  

});