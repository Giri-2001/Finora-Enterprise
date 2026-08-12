import type { CSSProperties } from "react";

const COLORS = {
  panel: "#111C2E",
  panelSoft: "#142238",
  border: "rgba(148, 163, 184, 0.16)",
  borderStrong: "rgba(37, 99, 235, 0.48)",
  primarySoft: "rgba(37, 99, 235, 0.14)",
  text: "#FFFFFF",
  textMuted: "#94A3B8",
};

export const cardStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  padding: "7px 9px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "10px",
  background: COLORS.panel,
  color: COLORS.text,
  boxShadow:
    "0 6px 18px rgba(0, 0, 0, 0.14)",
  overflow: "hidden",
};

export const statisticsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: "7px",
  width: "100%",
  height: "108px",
  minWidth: 0,
  minHeight: "108px",
  boxSizing: "border-box",
};

export const statisticItemStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "10px",
  width: "100%",
  height: "108px",
  minWidth: 0,
  minHeight: "108px",
  padding: "12px 13px",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "9px",
  background: COLORS.panelSoft,
  overflow: "hidden",
};

export const statisticLabelStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  color: COLORS.textMuted,
  fontSize: "15px",
  fontWeight: 650,
  lineHeight: "15px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const statisticValueStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  color: COLORS.text,
  fontSize: "25px",
  fontWeight: 750,
  lineHeight: "27px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const primaryStatisticItemStyle: CSSProperties = {
  ...statisticItemStyle,
  border:
    `1px solid ${COLORS.borderStrong}`,
  background:
    `linear-gradient(
      135deg,
      ${COLORS.primarySoft},
      ${COLORS.panelSoft}
    )`,
};

export const primaryValueStyle: CSSProperties = {
  ...statisticValueStyle,
  color: COLORS.text,
};
