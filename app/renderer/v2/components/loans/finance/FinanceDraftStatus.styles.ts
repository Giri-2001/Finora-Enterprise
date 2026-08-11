// ============================================================
// FINORA ENTERPRISE V2
//
// FINANCE STUDIO
// FINANCE DRAFT STATUS STYLES
//
// RESPONSIBILITY:
// - FinanceDraftStatus presentation wrapper only
// - Finance-specific spacing and layout
// - FINORA Login-inspired dark navy compatibility
//
// DESIGN:
// - Primary Blue: #2563EB
// - No brown
// - No gold
// - Minimum font-size: 12px
// - Font weights: 500–750
//
// ============================================================

import type { CSSProperties } from "react";

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {
  background: "#0F172A",
  panel: "#111C2E",
  panelSoft: "#142238",
  border: "rgba(148, 163, 184, 0.20)",
  primary: "#2563EB",
  primarySoft: "rgba(37, 99, 235, 0.12)",
};

// ============================================================
// CARD WRAPPER
// ============================================================

export const cardStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

// ============================================================
// STATUS WRAPPER
// ============================================================

export const statusStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: "1px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "8px",
  background: `linear-gradient(
    135deg,
    ${COLORS.primarySoft},
    ${COLORS.panel},
    ${COLORS.panelSoft}
  )`,
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",
};

// ============================================================
// END
// ============================================================
