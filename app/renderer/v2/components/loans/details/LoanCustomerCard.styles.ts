/* ===========================================================
FINORA ENTERPRISE V2
LOAN DETAILS STUDIO
LOAN CUSTOMER CARD STYLES
=========================================================== */


import type {
  CSSProperties,
} from "react";


/* ===========================================================
CARD
=========================================================== */


export const cardStyle:
  CSSProperties = {

  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

};


/* ===========================================================
CONTENT
=========================================================== */


export const contentStyle:
  CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "10px",

};


/* ===========================================================
CUSTOMER SELECTOR
=========================================================== */


export const selectorWrapperStyle:
  CSSProperties = {

  position: "relative",

  width: "100%",

  minWidth: 0,

  zIndex: 20,

};


export const selectorButtonStyle:
  CSSProperties = {

  width: "100%",

  minHeight: "42px",

  display: "flex",

  alignItems: "center",

  justifyContent: "space-between",

  gap: "12px",

  padding: "10px 12px",

  boxSizing: "border-box",

  borderRadius: "10px",

  border: "1px solid #2563EB",

  background: "#0F1B31",

  color: "#F8FAFC",

  cursor: "pointer",

  textAlign: "left",

  fontSize: "13px",

  fontWeight: 650,

  outline: "none",

};


export const selectorButtonTextStyle:
  CSSProperties = {

  minWidth: 0,

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

};


export const selectorArrowStyle:
  CSSProperties = {

  flexShrink: 0,

  color: "#60A5FA",

  fontSize: "10px",

};


/* ===========================================================
DROPDOWN
=========================================================== */


export const dropdownStyle:
  CSSProperties = {

  position: "absolute",

  top: "calc(100% + 6px)",

  left: 0,

  right: 0,

  maxHeight: "300px",

  overflowY: "auto",

  boxSizing: "border-box",

  padding: "8px",

  borderRadius: "12px",

  border: "1px solid #334155",

  background: "#0B1426",

  boxShadow:
    "0 18px 40px rgba(0, 0, 0, 0.42)",

};


export const searchInputStyle:
  CSSProperties = {

  width: "100%",

  minHeight: "38px",

  boxSizing: "border-box",

  marginBottom: "7px",

  padding: "9px 11px",

  borderRadius: "9px",

  border: "1px solid #334155",

  background: "#111D33",

  color: "#F8FAFC",

  fontSize: "12px",

  outline: "none",

};


/* ===========================================================
CUSTOMER OPTIONS
=========================================================== */


export const customerOptionStyle:
  CSSProperties = {

  width: "100%",

  display: "flex",

  flexDirection: "column",

  alignItems: "flex-start",

  gap: "4px",

  padding: "9px 10px",

  margin: 0,

  boxSizing: "border-box",

  border: "1px solid transparent",

  borderRadius: "8px",

  background: "transparent",

  color: "#E2E8F0",

  cursor: "pointer",

  textAlign: "left",

};


export const customerOptionActiveStyle:
  CSSProperties = {

  ...customerOptionStyle,

  border:
    "1px solid #2563EB",

  background:
    "#14264A",

};


export const customerOptionNameStyle:
  CSSProperties = {

  width: "100%",

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color: "#F8FAFC",

  fontSize: "13px",

  fontWeight: 700,

};


export const customerOptionMetaStyle:
  CSSProperties = {

  width: "100%",

  overflow: "hidden",

  textOverflow: "ellipsis",

  whiteSpace: "nowrap",

  color: "#94A3B8",

  fontSize: "11px",

  fontWeight: 500,

};


/* ===========================================================
SELECTED DETAILS
=========================================================== */


export const customerNameStyle:
  CSSProperties = {

  fontSize: "14px",

  fontWeight: 700,

  color: "#F8FAFC",

};


export const detailStyle:
  CSSProperties = {

  fontSize: "12px",

  fontWeight: 500,

  color: "#CBD5E1",

};


/* ===========================================================
EMPTY STATE
=========================================================== */


export const emptyStateStyle:
  CSSProperties = {

  padding: "14px 10px",

  color: "#94A3B8",

  fontSize: "12px",

  fontWeight: 500,

  textAlign: "center",

};


/* ===========================================================
END
=========================================================== */
