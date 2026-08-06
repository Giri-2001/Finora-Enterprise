/* ===========================================================
   FINORA ENTERPRISE OS™
   COLLECTION STUDIO™

   STYLES
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   ROOT
=========================================================== */

export const containerStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "20px",
  padding: "28px",
  minHeight: "720px",
  boxShadow: "0 8px 24px rgba(15,23,42,.06)",
  display: "flex",
  flexDirection: "column",
  gap: "28px",
};

/* ===========================================================
   STUDIO SECTION
=========================================================== */

export const studioSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

/* ===========================================================
   CONTENT GRID
=========================================================== */

export const contentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: "24px",
  alignItems: "start",
};

/* ===========================================================
   MAIN COLUMN
=========================================================== */

export const mainColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

/* ===========================================================
   SIDEBAR
=========================================================== */

export const sidebarStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

/* ===========================================================
   LOAN SELECTOR
=========================================================== */

export const loanSelectorStyle: CSSProperties = {
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  borderRadius: "12px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

export const loanSelectorLabelStyle: CSSProperties = {
  fontWeight: 600,
  color: "#0F172A",
};

export const loanSelectorInputStyle: CSSProperties = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #CBD5E1",
};
