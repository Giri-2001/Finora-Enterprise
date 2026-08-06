/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER ACTIONS PANEL™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   CONTAINER
=========================================================== */

export const containerStyle: CSSProperties = {
  background: "#FFFDF9",
  border: "1px solid #D8C7A4",
  borderRadius: "22px",
  padding: "18px",
  boxShadow: "0 12px 28px rgba(15,23,42,.08)",
};

/* ===========================================================
   HEADER
=========================================================== */

export const headerStyle: CSSProperties = {
  color: "#6F4A23",
  fontSize: "18px",
  fontWeight: 700,
  marginBottom: "18px",
};

/* ===========================================================
   GRID
=========================================================== */

export const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

/* ===========================================================
   BUTTON
=========================================================== */

export const buttonStyle: CSSProperties = {
  height: "52px",
  borderRadius: "14px",
  border: "1px solid #D8C7A4",
  background: "linear-gradient(180deg,#8A6135,#6F4A23)",
  color: "#FFF7E3",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: ".25s",
};
