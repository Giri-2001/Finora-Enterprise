import type { CSSProperties } from "react";

const COLORS = {
  background: "#0B1220",
  shell: "#0F172A",
  panel: "#111C2E",
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

export const contentStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  flex: "1 1 auto",
  boxSizing: "border-box",
  overflow: "auto",
};

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

export const stepListStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: "3px",
  alignItems: "center",
};

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

export const stepTextStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "2px",
};

export const stepTitleStyle: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.2,
};

export const stepSubtitleStyle: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "11px",
  fontWeight: 500,
  lineHeight: 1.2,
  color: COLORS.textMuted,
};

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

export const step1WorkspaceStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "grid",
  gridTemplateRows: "25% minmax(0, 75%)",
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
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 70%) minmax(260px, 30%)",
  gridTemplateRows: "minmax(0, 1fr)",
  gap: "8px",
  alignItems: "stretch",
  boxSizing: "border-box",
  overflow: "hidden",
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
