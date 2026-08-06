/* ===========================================================
   FINORA ENTERPRISE OS™
   ACTION NEEDED PREVIEW CARD™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  width: "100%",

  height: "230px",

  background: "#FFFDF9",

  border: "1px solid #D8C7A4",

  borderRadius: "22px",

  overflow: "hidden",

  display: "flex",

  flexDirection: "column",

  boxShadow:
    "0 12px 28px rgba(15,23,42,.08)",

};

/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {

  background:
    "linear-gradient(180deg,#6F4A23,#8A6135)",

  padding: "12px",

  display: "flex",

  justifyContent: "center",

  alignItems: "center",

};

export const titleStyle: CSSProperties = {

  color: "#F8E7B2",

  fontSize: "18px",

  fontWeight: 700,

};

/* ===========================================================
   BODY
=========================================================== */

export const bodyStyle: CSSProperties = {

  flex: 1,

  padding: "18px",

  display: "flex",

  flexDirection: "column",

  justifyContent: "flex-start",

  gap: "18px",

};

/* ===========================================================
   SECTION
=========================================================== */

export const sectionStyle: CSSProperties = {};

export const labelStyle: CSSProperties = {

  fontWeight: 700,

  fontSize: "14px",

};

export const valueStyle: CSSProperties = {

  marginTop: "4px",

  color: "#475569",

  fontSize: "13px",

};

/* ===========================================================
   LABEL COLORS
=========================================================== */

export const outstandingLabelStyle: CSSProperties = {

  ...labelStyle,

  color: "#DC2626",

};

export const statusLabelStyle: CSSProperties = {

  ...labelStyle,

  color: "#CA8A04",

};

export const collectionLabelStyle: CSSProperties = {

  ...labelStyle,

  color: "#2563EB",

};

/* ===========================================================
   FOOTER
=========================================================== */

export const footerStyle: CSSProperties = {

  borderTop: "1px solid #E8D8B6",

  paddingTop: "10px",

  display: "flex",

  justifyContent: "space-between",

  alignItems: "center",

};

export const footerLabelStyle: CSSProperties = {

  color: "#8A6135",

  fontSize: "13px",

  fontWeight: 600,

};

export const footerArrowStyle: CSSProperties = {

  color: "#8A6135",

  fontSize: "18px",

  fontWeight: 700,

  cursor: "pointer",

};
