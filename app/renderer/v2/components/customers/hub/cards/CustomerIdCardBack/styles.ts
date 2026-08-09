/* ===========================================================
FINORA ENTERPRISE OS™

CUSTOMER ID CARD BACK™

PREMIUM BACK PRESENTATION STYLES
=========================================================== */

import type {
  CSSProperties,
} from "react";

/* ===========================================================
ROOT
=========================================================== */

export const cardStyle: CSSProperties = {
  width: "175px",

  height: "285px",

  maxHeight: "285px",

  overflow: "hidden",

  borderRadius: "18px",

  background:
    "linear-gradient(180deg,#FFFFFF,#F8FAFC)",

  color: "#1F2937",

  padding: "16px",

  display: "flex",

  flexDirection: "column",

  justifyContent: "flex-start",

  boxSizing: "border-box",

  border:
    "1px solid rgba(180,145,82,.35)",

  boxShadow:
    "0 12px 25px rgba(0,0,0,.18)",
};

/* ===========================================================
HEADER
=========================================================== */

export const headerStyle: CSSProperties = {
  marginTop: "-8px",

  fontSize: "11px",

  fontWeight: 600,

  whiteSpace: "nowrap",

  color: "#111827",
};

/* ===========================================================
DETAILS
=========================================================== */

export const detailRowStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  width: "100%",

  marginTop: "5px",

  fontSize: "10px",

  lineHeight: 1.25,
};

export const detailLabelStyle: CSSProperties = {
  width: "55px",

  flexShrink: 0,

  fontWeight: 700,

  textTransform: "uppercase",
};

export const detailValueStyle: CSSProperties = {
  marginLeft: "6px",

  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color: "#374151",
};

/* ===========================================================
DIVIDER
=========================================================== */

export const dividerStyle: CSSProperties = {
  marginTop: "8px",

  borderTop:
    "1px solid #E5E7EB",

  width: "100%",
};

/* ===========================================================
LOAN SECTION
=========================================================== */

export const loanTitleStyle: CSSProperties = {
  marginTop: "8px",

  fontSize: "10px",

  fontWeight: 700,

  color: "#111827",
};

export const loanRowStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  width: "100%",

  marginTop: "5px",

  fontSize: "10px",

  lineHeight: 1.2,
};

export const loanLabelStyle: CSSProperties = {
  width: "70px",

  flexShrink: 0,

  fontWeight: 700,

  color: "#374151",
};

export const loanValueStyle: CSSProperties = {
  marginLeft: "6px",

  fontWeight: 600,

  color: "#111827",
};

/* ===========================================================
OUTSTANDING
=========================================================== */

export const outstandingStyle: CSSProperties = {
  display: "flex",

  alignItems: "center",

  width: "100%",

  marginTop: "6px",

  fontSize: "11px",

  fontWeight: 700,
};

/* ===========================================================
FULL DETAILS BUTTON
=========================================================== */

export const detailsButtonStyle: CSSProperties = {
  marginTop: "10px",

  height: "30px",

  borderRadius: "8px",

  border:
    "1px solid #C9A45C",

  background: "#8A612B",

  color: "#FFFFFF",

  fontSize: "10px",

  fontWeight: 700,

  cursor: "pointer",

  letterSpacing: ".2px",

  boxShadow:
    "0 4px 10px rgba(138,97,43,.20)",
};
