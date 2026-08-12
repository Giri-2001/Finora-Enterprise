import type { CSSProperties } from "react";

// ============================================================
// FINORA ENTERPRISE V2
//
// LOAN STUDIO
// SHARED + GUARANTOR STUDIO LAYOUT STYLES
//
// RULE:
// - Existing Step 1–3 layouts remain unchanged
// - Step 4 gets dedicated responsive layout styles
// - Step 4 must fit inside one viewport
// - No brown / no gold
// - FINORA dark navy + primary blue
//
// ============================================================

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {
  background: "#0B1220",
  shell: "#0F172A",
  panel: "#111C2E",
  panelSoft: "#142238",
  input: "#0A1425",

  border: "rgba(148, 163, 184, 0.16)",
  borderStrong: "rgba(37, 99, 235, 0.42)",

  primary: "#2563EB",
  primaryHover: "#3B82F6",

  primarySoft: "rgba(37, 99, 235, 0.14)",
  primaryGlow: "rgba(37, 99, 235, 0.22)",

  text: "#FFFFFF",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",

  whiteSoft: "rgba(255,255,255,0.04)",
};

// ============================================================
// MAIN SHELL
// ============================================================

export const shellStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  maxWidth: "100%",
  flex: "1 1 auto",
  boxSizing: "border-box",
  padding: "10px 12px 8px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "12px",
  background: COLORS.background,
  color: COLORS.text,
  boxShadow: "0 12px 34px rgba(0, 0, 0, 0.24)",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  overflow: "hidden",
};

// ============================================================
// CONTENT
// ============================================================

export const contentStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  flex: "1 1 auto",
  boxSizing: "border-box",
  overflow: "auto",
};

// ============================================================
// FOOTER / WIZARD NAVIGATION
// ============================================================

export const footerStyle: CSSProperties = {
  position: "relative",
  zIndex: 50,
  width: "100%",
  minWidth: 0,
  flexShrink: 0,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "8px 10px",
  border: `1px solid ${COLORS.borderStrong}`,
  borderRadius: "10px",
  background: "rgba(15, 23, 42, 0.98)",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.26)",
};

// ============================================================
// STEP LIST
// ============================================================

export const stepListStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "3px",
  alignItems: "center",
};

// ============================================================
// STEP ITEM
// ============================================================

export const stepItemStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "7px",
  padding: "5px 4px",
  borderRadius: "7px",
  boxSizing: "border-box",
  cursor: "pointer",
  transition: "background 0.16s ease",
};

// ============================================================
// STEP NUMBER
// ============================================================

export const stepNumberStyle: CSSProperties = {
  width: "29px",
  height: "29px",
  flexShrink: 0,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  fontSize: "12px",
  fontWeight: 700,
};

// ============================================================
// STEP TEXT
// ============================================================

export const stepTextStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

// ============================================================
// STEP TITLE
// ============================================================

export const stepTitleStyle: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.2,
};

// ============================================================
// STEP SUBTITLE
// ============================================================

export const stepSubtitleStyle: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "11px",
  fontWeight: 500,
  lineHeight: 1.2,
  color: COLORS.textMuted,
};

// ============================================================
// ACTIVE STEP
// ============================================================

export const activeStepNumberStyle: CSSProperties = {
  ...stepNumberStyle,
  background: COLORS.primary,
  color: COLORS.text,
  border: `1px solid ${COLORS.primaryHover}`,
  boxShadow: `0 0 16px ${COLORS.primaryGlow}`,
};

export const activeStepTitleStyle: CSSProperties = {
  ...stepTitleStyle,
  color: COLORS.text,
};

// ============================================================
// COMPLETED STEP
// ============================================================

export const completedStepNumberStyle: CSSProperties = {
  ...stepNumberStyle,
  background: COLORS.primarySoft,
  border: `1px solid ${COLORS.borderStrong}`,
  color: "#93C5FD",
};

export const completedStepTitleStyle: CSSProperties = {
  ...stepTitleStyle,
  color: "#BFDBFE",
};

// ============================================================
// PENDING STEP
// ============================================================

export const pendingStepNumberStyle: CSSProperties = {
  ...stepNumberStyle,
  background: COLORS.whiteSoft,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textMuted,
};

export const pendingStepTitleStyle: CSSProperties = {
  ...stepTitleStyle,
  color: COLORS.textSecondary,
};

// ============================================================
// NAVIGATION
// ============================================================

export const navigationStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  flexShrink: 0,
};

export const navigationButtonStyle: CSSProperties = {
  minWidth: "92px",
  height: "35px",
  padding: "0 12px",
  boxSizing: "border-box",
  borderRadius: "7px",
  border: `1px solid ${COLORS.border}`,
  background: COLORS.input,
  color: COLORS.textSecondary,
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

export const disabledNavigationButtonStyle: CSSProperties = {
  ...navigationButtonStyle,
  opacity: 0.38,
  cursor: "not-allowed",
};

export const primaryNavigationButtonStyle: CSSProperties = {
  ...navigationButtonStyle,
  minWidth: "102px",
  borderColor: COLORS.primary,
  background: COLORS.primary,
  color: COLORS.text,
  boxShadow: "0 6px 16px rgba(37, 99, 235, 0.24)",
};

// ============================================================
// STEP 1 — EXISTING LAYOUT
// ============================================================

export const step1WorkspaceStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "grid",

  // FIX:
  // Do not reserve 25% height for the top section.
  // Header should use only its actual height.
  // Bottom content should move up immediately.
  gridTemplateRows: "auto minmax(0, 1fr)",

  gap: "8px",
  boxSizing: "border-box",
};

export const step1TopStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns:
    "minmax(260px, 30%) minmax(0, 70%)",
  gridTemplateRows: "minmax(0, 1fr)",
  gap: "8px",
  alignItems: "stretch",
  boxSizing: "border-box",
  overflow: "visible",
};

export const step1BottomStyle: CSSProperties = {
  width: "100%",
  height: "auto",
  minWidth: 0,
  minHeight: 0,

  display: "grid",

  gridTemplateColumns:
    "minmax(0, 70%) minmax(260px, 30%)",

  gridTemplateRows: "auto",

  gap: "8px",

  alignItems: "start",
  alignContent: "start",

  boxSizing: "border-box",
  overflow: "visible",
};

export const step1CustomerStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  alignSelf: "stretch",
  justifySelf: "stretch",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  overflow: "visible",
};

export const step1OverviewStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  alignSelf: "stretch",
  justifySelf: "stretch",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  overflow: "visible",
};

export const step1FormStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  alignSelf: "stretch",
  justifySelf: "stretch",
  boxSizing: "border-box",
  overflow: "hidden",
  scrollbarWidth: "thin",
};

export const step1PreviewStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  alignSelf: "stretch",
  justifySelf: "stretch",
  boxSizing: "border-box",
  overflow: "hidden",
  scrollbarWidth: "thin",
};

// ============================================================
// STEP 4 — GUARANTOR STUDIO
//
// IMPORTANT:
// Dedicated styles so Step 1–3 are NOT affected.
//
// Layout:
// ┌──────────────────────────────────────┬───────────────────┐
// │ Guarantor Form                       │ Preview           │
// │ Relationship                        │ Draft             │
// │ Verification                         │                   │
// └──────────────────────────────────────┴───────────────────┘
//
// Goal:
// - Single viewport
// - No page scroll
// - Compact enterprise spacing
// - Left 72% / right 28%
// ============================================================

// ============================================================
// STEP 4 WORKSPACE
// ============================================================

export const step4WorkspaceStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 0,

  display: "grid",

  gridTemplateColumns:
    "minmax(0, 72%) minmax(270px, 28%)",

  gap: "10px",

  alignItems: "start",

  boxSizing: "border-box",
  overflow: "visible",
};

// ============================================================
// STEP 4 LEFT COLUMN
// ============================================================

export const step4MainStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 0,

  display: "grid",

  gridTemplateRows:
    "auto auto auto",

  gap: "10px",

  alignContent: "start",

  boxSizing: "border-box",
  overflow: "visible",
};

// ============================================================
// STEP 4 RIGHT COLUMN
// ============================================================

export const step4AsideStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 0,

  display: "grid",

  gridTemplateRows:
    "auto auto",

  gap: "10px",

  alignContent: "start",

  boxSizing: "border-box",
  overflow: "visible",
};

// ============================================================
// STEP 4 FORM WRAPPER
// ============================================================

export const step4FormStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
  overflow: "hidden",
};

// ============================================================
// STEP 4 RELATIONSHIP WRAPPER
// ============================================================

export const step4RelationshipStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
  overflow: "hidden",
};

// ============================================================
// STEP 4 VERIFICATION WRAPPER
// ============================================================

export const step4VerificationStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
  overflow: "hidden",
};

// ============================================================
// STEP 4 PREVIEW WRAPPER
// ============================================================

export const step4PreviewStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
  overflow: "hidden",
};

// ============================================================
// STEP 4 DRAFT WRAPPER
// ============================================================

export const step4DraftStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
  overflow: "hidden",
};

// ============================================================
// STEP 4 RESPONSIVE BREAKPOINT
//
// Used when viewport becomes narrower.
// ============================================================

export const step4CompactWorkspaceStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "minmax(0, 68%) minmax(250px, 32%)",

  // GAP BETWEEN LEFT AND RIGHT
  gap: "10px",

  boxSizing: "border-box",
  overflow: "hidden",
};

// ============================================================
// END
// ============================================================
