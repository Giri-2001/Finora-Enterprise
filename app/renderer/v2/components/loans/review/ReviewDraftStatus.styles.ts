// ============================================================
// FINORA ENTERPRISE V2
//
// REVIEW STUDIO
// REVIEW DRAFT STATUS STYLES
//
// RESPONSIBILITY:
// - ReviewDraftStatus presentation wrapper only
// - Review-specific spacing and layout
// - FINORA dark navy compatibility
//
// IMPORTANT:
// - Review Draft must render as ONE visible card.
// - The parent LoanStudio controls the gap between
//   Final Loan Preview and Review Draft.
// - This wrapper must NOT create a second border/card.
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
  border: "rgba(148, 163, 184, 0.20)",
  primarySoft: "rgba(37, 99, 235, 0.12)",
  panel: "#111C2E",
  panelSoft: "#142238",
};

// ============================================================
// CARD WRAPPER
//
// Kept intentionally neutral. The actual Review Draft card
// owns its visible border/background so there is no double card.
// ============================================================

export const cardStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

// ============================================================
// STATUS WRAPPER
//
// IMPORTANT:
// No border / background / shadow here.
// This prevents the outer wrapper from creating the second
// visible card around the actual Review Draft card.
// ============================================================

export const statusStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  padding: 0,
  margin: 0,
  border: "none",
  borderRadius: 0,
  background: "transparent",
  boxShadow: "none",
};

// ============================================================
// END
// ============================================================
