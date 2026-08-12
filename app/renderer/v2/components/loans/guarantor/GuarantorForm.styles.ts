// ============================================================
// FINORA ENTERPRISE V2
//
// GUARANTOR STUDIO
// GUARANTOR FORM STYLES
//
// RESPONSIBILITY:
// - GuarantorForm presentation only
// - Compact 4-column guarantor information layout
// - Equal-width fields
// - Proper FINORA Enterprise spacing
// - Single-viewport Step 4 compatibility
//
// LAYOUT:
// Guarantor Name | Mobile Number | Occupation | Address
//
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {
  panel: "#111C2E",
  panelSoft: "#142238",

  border: "rgba(148, 163, 184, 0.18)",

  primary: "#2563EB",
  primaryGlow: "rgba(37, 99, 235, 0.18)",

  text: "#FFFFFF",
};

// ============================================================
// WRAPPER
//
// Four fields always remain in ONE ROW.
//
// Guarantor Name | Mobile Number | Occupation | Address
//
// Equal columns + controlled spacing.
// ============================================================

export const wrapperStyle: CSSProperties = {
  display: "grid",

  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",

  columnGap: "9px",
  rowGap: "0px",

  width: "100%",
  minWidth: 0,

  marginBottom: "10px",

  boxSizing: "border-box",

  padding: "8px 10px 4px 10px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "9px",

  background:
    `linear-gradient(
      180deg,
      ${COLORS.panel},
      ${COLORS.panelSoft}
    )`,

  boxShadow:
    "0 4px 14px rgba(0, 0, 0, 0.12)",

  overflow: "hidden",
};

// ============================================================
// HEADER
// ============================================================

export const headerStyle: CSSProperties = {
  gridColumn: "1 / -1",

  display: "flex",

  alignItems: "center",

  gap: "6px",

  minHeight: "17px",

  margin: "0 0 10px 0",

  padding: 0,

  color: COLORS.text,

  fontSize: "13px",

  fontWeight: 750,

  lineHeight: 1.15,

  boxSizing: "border-box",
};

// ============================================================
// HEADER ACCENT
// ============================================================

export const accentStyle: CSSProperties = {
  width: "3px",

  height: "15px",

  flexShrink: 0,

  borderRadius: "3px",

  background: COLORS.primary,

  boxShadow:
    `0 0 8px ${COLORS.primaryGlow}`,
};

// ============================================================
// FIELD
//
// Important:
// FormField has its own marginBottom.
// We neutralize it here so the four fields
// stay visually aligned in one row.
// ============================================================

export const fieldStyle: CSSProperties = {
  minWidth: 0,

  width: "100%",

  boxSizing: "border-box",

  display: "flex",

  flexDirection: "column",

  overflow: "hidden",

  margin: 0,

  padding: 0,
};

// ============================================================
// FIELD CONTENT
// ============================================================

export const fieldContentStyle: CSSProperties = {
  width: "100%",

  minWidth: 0,

  boxSizing: "border-box",

  display: "flex",

  flexDirection: "column",

  margin: 0,

  padding: 0,

  overflow: "hidden",
};

// ============================================================
// FULL WIDTH FIELD
//
// Preserved for API compatibility.
// ============================================================

export const fullWidthFieldStyle: CSSProperties = {
  ...fieldStyle,

  gridColumn: "1 / -1",

  width: "100%",
};

// ============================================================
// END
// ============================================================
