/* ===========================================================
   FINORA ENTERPRISE OS™
   TODAY COLLECTIONS PREVIEW CARD™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  width: "100%",

  height: "190px",

  background: "#FFFDF9",

  border: "1px solid #D8C7A4",

  borderRadius: "22px",

  overflow: "hidden",

  display: "flex",

  flexDirection: "column",

  boxShadow:
    "0 10px 24px rgba(15,23,42,.08)",

};

/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {

  background:
    "linear-gradient(180deg,#6F4A23,#8A6135)",

  padding: "10px 14px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

};

export const titleStyle: CSSProperties = {

  color: "#F8E7B2",

  fontSize: "17px",

  fontWeight: 700,

};

/* ===========================================================
   BODY
=========================================================== */

export const bodyStyle: CSSProperties = {

  flex: 1,

  padding: "12px",

  display: "flex",

  flexDirection: "column",

};

export const gridStyle: CSSProperties = {

  display: "grid",

  gridTemplateColumns: "1fr 1fr",

  gap: "10px",

  flex: 1,

};

/* ===========================================================
   STAT CARDS
=========================================================== */

export const dueCardStyle: CSSProperties = {

  background: "#FFF8EA",

  border: "1px solid #D9B66C",

  borderRadius: "14px",

  padding: "10px",

  textAlign: "center",

};

export const collectedCardStyle: CSSProperties = {

  ...dueCardStyle,

};

export const pendingCardStyle: CSSProperties = {

  ...dueCardStyle,

};

export const targetCardStyle: CSSProperties = {

  ...dueCardStyle,

};

export const statLabelStyle: CSSProperties = {

  fontSize: "12px",

  fontWeight: 600,

  color: "#8B5E34",

};

export const dueValueStyle: CSSProperties = {

  marginTop: "6px",

  fontSize: "20px",

  fontWeight: 700,

  color: "#B45309",

};

export const collectedValueStyle: CSSProperties = {

  ...dueValueStyle,

  color: "#15803D",

};

export const pendingValueStyle: CSSProperties = {

  ...dueValueStyle,

  color: "#DC2626",

};

export const targetValueStyle: CSSProperties = {

  ...dueValueStyle,

  color: "#8A612B",

};

/* ===========================================================
   FOOTER
=========================================================== */

export const footerStyle: CSSProperties = {

  borderTop: "1px solid #E7D6B3",

  background: "#FFFCF6",

  padding: "10px 14px",

  display: "flex",

  justifyContent: "space-between",

  alignItems: "center",

};

export const footerLabelStyle: CSSProperties = {

  color: "#7C5A2C",

  fontSize: "13px",

  fontWeight: 600,

};

export const footerArrowStyle: CSSProperties = {

  color: "#8A6135",

  fontSize: "18px",

  fontWeight: 700,

  cursor: "pointer",

};
