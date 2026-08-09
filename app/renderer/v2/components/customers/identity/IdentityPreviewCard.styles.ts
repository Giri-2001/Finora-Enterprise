/* ===========================================================
   FINORA ENTERPRISE OS™

   CUSTOMER IDENTITY PREVIEW CARD™

   PRESENTATION STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
   ROOT CARD
=========================================================== */

export const cardStyle:
  CSSProperties = {

  width: "100%",

  maxWidth: "250px",

  height: "100%",

  maxHeight: "480px",

  borderRadius: "22px",

  background:
    "linear-gradient(135deg,#0f172a,#1e293b)",

  color: "#ffffff",

  padding: "20px",

  boxSizing: "border-box",

  boxShadow:
    "0 18px 40px rgba(15,23,42,.35)",

  overflow: "hidden",

};

/* ===========================================================
   BRAND
=========================================================== */

export const logoStyle:
  CSSProperties = {

  fontSize: "11px",

  letterSpacing: "2px",

  opacity: 0.8,

  marginBottom: "14px",
};

/* ===========================================================
   PHOTO
=========================================================== */

export const photoStyle:
  CSSProperties = {

  width: "92px",

  height: "92px",

  borderRadius: "18px",

  background: "#334155",

  display: "flex",

  justifyContent: "center",

  alignItems: "center",

  overflow: "hidden",

  marginBottom: "16px",
};

/* ===========================================================
   PHOTO IMAGE
=========================================================== */

export const imageStyle:
  CSSProperties = {

  width: "100%",

  height: "100%",

  objectFit: "cover",
};

/* ===========================================================
   CUSTOMER NAME
=========================================================== */

export const nameStyle:
  CSSProperties = {

  margin: 0,

  fontSize: "20px",

  fontWeight: 700,

};

/* ===========================================================
   CUSTOMER ID
=========================================================== */

export const idStyle:
  CSSProperties = {

  marginTop: "8px",

  color: "#cbd5e1",

  fontSize: "12px",

  wordBreak: "break-word",
};

/* ===========================================================
   INFORMATION LABEL
=========================================================== */

export const infoLabelStyle:
  CSSProperties = {

  marginTop: "16px",

  fontSize: "10px",

  textTransform: "uppercase",

  opacity: 0.75,
};

/* ===========================================================
   INFORMATION VALUE
=========================================================== */

export const infoValueStyle:
  CSSProperties = {

  marginTop: "3px",

  fontSize: "14px",

  fontWeight: 600,
};

/* ===========================================================
   QR SECTION
=========================================================== */

export const qrSectionStyle:
  CSSProperties = {

  marginTop: "18px",

  padding: "13px",

  borderRadius: "14px",

  background:
    "rgba(255,255,255,0.08)",
};

/* ===========================================================
   QR TITLE
=========================================================== */

export const qrTitleStyle:
  CSSProperties = {

  fontWeight: 700,

  fontSize: "13px",

  marginBottom: "7px",
};

/* ===========================================================
   QR DESCRIPTION
=========================================================== */

export const qrDescriptionStyle:
  CSSProperties = {

  fontSize: "11px",

  opacity: 0.75,

  lineHeight: 1.5,
};

/* ===========================================================
   STATUS
=========================================================== */

export const statusStyle:
  CSSProperties = {

  marginTop: "18px",

  display: "inline-flex",

  alignItems: "center",

  gap: "7px",

  padding: "7px 12px",

  borderRadius: "999px",

  background:
    "rgba(34,197,94,.15)",

  color: "#86efac",

  fontSize: "12px",

  fontWeight: 600,
};

/* ===========================================================
   FOOTER NOTE
=========================================================== */

export const footerStyle:
  CSSProperties = {

  marginTop: "16px",

  paddingTop: "12px",

  borderTop:
    "1px solid rgba(255,255,255,.12)",

  fontSize: "9px",

  opacity: 0.6,

  lineHeight: 1.6,
};
