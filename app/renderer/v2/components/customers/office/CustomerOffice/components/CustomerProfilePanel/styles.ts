/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER PROFILE PANEL™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {

  width: "100%",

  height: "350px",

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

  textAlign: "center",

};

export const companyStyle: CSSProperties = {

  color: "#F8E7B2",

  fontWeight: 700,

  fontSize: "20px",

  letterSpacing: "1px",

};

export const subtitleStyle: CSSProperties = {

  marginTop: "4px",

  color: "#FFF7E3",

  fontSize: "10px",

  letterSpacing: ".8px",

};

/* ===========================================================
   BODY
=========================================================== */

export const bodyStyle: CSSProperties = {

  flex: 1,

  display: "flex",

  flexDirection: "column",

  justifyContent: "space-evenly",

  alignItems: "center",

  padding: "18px",

  gap: "14px",

};

/* ===========================================================
   IMAGE
=========================================================== */

export const imageStyle: CSSProperties = {

  width: "105px",

  height: "105px",

  borderRadius: "18px",

  border: "3px solid #D4AF37",

  background: "#FFFFFF",

};

/* ===========================================================
   NAME
=========================================================== */

export const nameStyle: CSSProperties = {

  fontSize: "24px",

  fontWeight: 700,

  lineHeight: "30px",

  color: "#1E293B",

  textAlign: "center",

};

/* ===========================================================
   CUSTOMER ID
=========================================================== */

export const idStyle: CSSProperties = {

  color: "#64748B",

  fontSize: "14px",

  fontWeight: 600,

};

/* ===========================================================
   STATUS
=========================================================== */

export const statusStyle: CSSProperties = {

  padding: "6px 16px",

  borderRadius: "999px",

  fontSize: "13px",

  fontWeight: 700,

};
