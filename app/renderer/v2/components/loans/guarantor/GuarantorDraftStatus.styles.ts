// ============================================================
// FINORA ENTERPRISE V2
//
// GUARANTOR STUDIO
// GUARANTOR DRAFT STATUS STYLES
//
// RESPONSIBILITY:
// - GuarantorDraftStatus presentation wrapper only
// - Guarantor-specific spacing and layout
// - FINORA Enterprise dark navy compatibility
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

  primarySoft: "rgba(37, 99, 235, 0.08)",
};

// ============================================================
// CARD WRAPPER
// ============================================================

export const cardStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",

  overflow: "hidden",
};

// ============================================================
// STATUS WRAPPER
//
// IMPORTANT:
// - No border
// - No radius
// - No shadow
//
// The inner Draft Status card already provides the visual
// card surface. Keeping this wrapper neutral prevents the
// appearance of two nested cards.
// ============================================================

export const statusStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",

  padding: 0,

  border: "none",
  borderRadius: 0,

  background: "transparent",

  boxShadow: "none",

  overflow: "hidden",
};

// ============================================================
// END
// ============================================================
