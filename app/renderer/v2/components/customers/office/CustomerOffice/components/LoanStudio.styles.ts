// ============================================================
// FINORA ENTERPRISE OS™
//
// V2 LOAN STUDIO
// PREMIUM LUXURY SHELL STYLES
//
// RESPONSIBILITY:
//
// - Loan Studio shell presentation
// - Fill the complete remaining application viewport
// - Premium dark finance workspace
// - Six-step wizard footer
// - Zero unnecessary outer whitespace
// - Stable top-to-bottom layout
//
// DESIGN:
//
// - Deep Navy
// - FINORA Primary Blue
// - White / Slate typography
// - No brown
// - No gold
// - No unnecessary gradients
// - Enterprise / Luxury Finance aesthetic
//
// IMPORTANT:
//
// AppShell owns the 100vh viewport.
// StudioLayout owns the remaining height after GlobalHeader.
// LoanStudio must therefore fill its parent exactly.
//
// ============================================================

import type {
  CSSProperties,
} from "react";

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {

  background:
    "#0B1220",

  shell:
    "#0F172A",

  panel:
    "#111C2E",

  panelSoft:
    "#142238",

  input:
    "#0A1425",

  border:
    "rgba(148, 163, 184, 0.16)",

  borderStrong:
    "rgba(37, 99, 235, 0.42)",

  primary:
    "#2563EB",

  primaryHover:
    "#3B82F6",

  primarySoft:
    "rgba(37, 99, 235, 0.14)",

  primaryGlow:
    "rgba(37, 99, 235, 0.22)",

  text:
    "#FFFFFF",

  textSecondary:
    "#CBD5E1",

  textMuted:
    "#94A3B8",

  disabled:
    "#64748B",

  whiteSoft:
    "rgba(255,255,255,0.04)",
};

// ============================================================
// LOAN STUDIO SHELL
//
// IMPORTANT:
//
// Do NOT use calc(100vh - ...).
//
// The parent layout already gives LoanStudio the exact
// remaining viewport height.
//
// Therefore:
// - width 100%
// - height 100%
// - minHeight 0
// - flex 1
//
// This removes the unwanted brown area below the Studio.
// ============================================================

export const shellStyle: CSSProperties = {

  width:
    "100%",

  height:
    "100%",

  minHeight:
    0,

  minWidth:
    0,

  maxWidth:
    "100%",

  flex:
    "1 1 auto",

  boxSizing:
    "border-box",

  padding:
    "14px 16px 10px",

  border:
    `1px solid ${COLORS.border}`,

  borderRadius:
    "14px",

  background:
    COLORS.background,

  color:
    COLORS.text,

  boxShadow:
    "0 14px 40px rgba(0, 0, 0, 0.28)",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "12px",

  overflow:
    "hidden",
};

// ============================================================
// CONTENT AREA
//
// Content occupies all available space above the wizard
// footer without creating an additional page-level gap.
// ============================================================

export const contentStyle: CSSProperties = {

  width:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  flex:
    "1 1 auto",

  boxSizing:
    "border-box",

  overflow:
    "hidden",
};

// ============================================================
// WIZARD FOOTER
//
// Footer remains inside the Loan Studio shell and is pushed
// to the bottom by the shell flex layout.
//
// No sticky positioning is required here because the shell
// itself is the viewport-height workspace.
// ============================================================

export const footerStyle: CSSProperties = {

  position:
    "relative",

  zIndex:
    50,

  width:
    "100%",

  minWidth:
    0,

  flexShrink:
    0,

  boxSizing:
    "border-box",

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "18px",

  padding:
    "10px 12px",

  border:
    `1px solid ${COLORS.borderStrong}`,

  borderRadius:
    "12px",

  background:
    "rgba(15, 23, 42, 0.98)",

  boxShadow:
    "0 10px 28px rgba(0, 0, 0, 0.30)",

  backdropFilter:
    "blur(14px)",
};

// ============================================================
// STEP LIST
// ============================================================

export const stepListStyle: CSSProperties = {

  flex:
    "1 1 auto",

  minWidth:
    0,

  display:
    "grid",

  gridTemplateColumns:
    "repeat(6, minmax(0, 1fr))",

  gap:
    "4px",

  alignItems:
    "center",
};

// ============================================================
// STEP ITEM
// ============================================================

export const stepItemStyle: CSSProperties = {

  minWidth:
    0,

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "8px",

  padding:
    "6px 5px",

  borderRadius:
    "8px",

  boxSizing:
    "border-box",

  cursor:
    "pointer",

  transition:
    "background 0.16s ease, transform 0.16s ease",
};

// ============================================================
// STEP NUMBER
// ============================================================

export const stepNumberStyle: CSSProperties = {

  width:
    "30px",

  height:
    "30px",

  flexShrink:
    0,

  borderRadius:
    "50%",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  boxSizing:
    "border-box",

  fontSize:
    "12px",

  fontWeight:
    700,

  lineHeight:
    1,

  transition:
    "all 0.16s ease",
};

// ============================================================
// STEP TEXT
// ============================================================

export const stepTextStyle: CSSProperties = {

  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "2px",
};

// ============================================================
// STEP TITLE
// ============================================================

export const stepTitleStyle: CSSProperties = {

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace:
    "nowrap",

  fontSize:
    "12px",

  fontWeight:
    700,

  lineHeight:
    1.2,

  letterSpacing:
    "0.01em",
};

// ============================================================
// STEP SUBTITLE
// ============================================================

export const stepSubtitleStyle: CSSProperties = {

  overflow:
    "hidden",

  textOverflow:
    "ellipsis",

  whiteSpace:
    "nowrap",

  fontSize:
    "12px",

  fontWeight:
    500,

  lineHeight:
    1.2,

  color:
    COLORS.textMuted,
};

// ============================================================
// ACTIVE STEP NUMBER
// ============================================================

export const activeStepNumberStyle:
  CSSProperties = {

  ...stepNumberStyle,

  background:
    COLORS.primary,

  color:
    COLORS.text,

  border:
    `1px solid ${COLORS.primaryHover}`,

  boxShadow:
    `0 0 18px ${COLORS.primaryGlow}`,
};

// ============================================================
// ACTIVE STEP TITLE
// ============================================================

export const activeStepTitleStyle:
  CSSProperties = {

  ...stepTitleStyle,

  color:
    COLORS.text,
};

// ============================================================
// COMPLETED STEP NUMBER
// ============================================================

export const completedStepNumberStyle:
  CSSProperties = {

  ...stepNumberStyle,

  background:
    COLORS.primarySoft,

  border:
    `1px solid ${COLORS.borderStrong}`,

  color:
    "#93C5FD",
};

// ============================================================
// COMPLETED STEP TITLE
// ============================================================

export const completedStepTitleStyle:
  CSSProperties = {

  ...stepTitleStyle,

  color:
    "#BFDBFE",
};

// ============================================================
// PENDING STEP NUMBER
// ============================================================

export const pendingStepNumberStyle:
  CSSProperties = {

  ...stepNumberStyle,

  background:
    COLORS.whiteSoft,

  border:
    `1px solid ${COLORS.border}`,

  color:
    COLORS.textMuted,
};

// ============================================================
// PENDING STEP TITLE
// ============================================================

export const pendingStepTitleStyle:
  CSSProperties = {

  ...stepTitleStyle,

  color:
    COLORS.textSecondary,
};

// ============================================================
// NAVIGATION GROUP
// ============================================================

export const navigationStyle:
  CSSProperties = {

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "8px",

  flexShrink:
    0,
};

// ============================================================
// NAVIGATION BUTTON
// ============================================================

export const navigationButtonStyle:
  CSSProperties = {

  minWidth:
    "94px",

  height:
    "36px",

  padding:
    "0 13px",

  boxSizing:
    "border-box",

  borderRadius:
    "8px",

  border:
    `1px solid ${COLORS.border}`,

  background:
    COLORS.input,

  color:
    COLORS.textSecondary,

  fontSize:
    "12px",

  fontWeight:
    600,

  cursor:
    "pointer",

  transition:
    "all 0.16s ease",
};

// ============================================================
// DISABLED NAVIGATION
// ============================================================

export const disabledNavigationButtonStyle:
  CSSProperties = {

  ...navigationButtonStyle,

  opacity:
    0.38,

  cursor:
    "not-allowed",
};

// ============================================================
// PRIMARY NAVIGATION
// ============================================================

export const primaryNavigationButtonStyle:
  CSSProperties = {

  ...navigationButtonStyle,

  minWidth:
    "104px",

  borderColor:
    COLORS.primary,

  background:
    COLORS.primary,

  color:
    COLORS.text,

  boxShadow:
    "0 7px 18px rgba(37, 99, 235, 0.25)",
};

// ============================================================
// END
// ============================================================
