/* ===========================================================
   FINORA ENTERPRISE OS™
   CUSTOMER LOAN PANEL™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   CONTAINER
=========================================================== */

export const containerStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "20px",
  padding: "24px",
  minHeight: "520px",
  boxShadow: "0 8px 24px rgba(15,23,42,.06)",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

/* ===========================================================
   HEADER
=========================================================== */

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 700,
  color: "#0F172A",
};

export const subtitleStyle: CSSProperties = {
  marginTop: "6px",
  color: "#64748B",
  fontSize: "14px",
};

/* ===========================================================
   STATISTICS
=========================================================== */

export const statisticsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4,1fr)",
  gap: "14px",
};

export const statisticCardStyle: CSSProperties = {
  borderRadius: "18px",
  border: "1px solid #D6B36A",
  background: "linear-gradient(180deg,#FFFDF8,#FFF6E6)",
  padding: "18px",
};

export const statisticLabelStyle: CSSProperties = {
  color: "#7C5A2C",
  fontSize: "13px",
  fontWeight: 600,
};

export const runningValueStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "28px",
  fontWeight: 700,
  color: "#15803D",
};

export const closedValueStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "28px",
  fontWeight: 700,
  color: "#B91C1C",
};

export const amountValueStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "22px",
  fontWeight: 700,
  color: "#8B5E34",
};

/* ===========================================================
   LOANS
=========================================================== */

export const loansSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  marginTop: "4px",
};
