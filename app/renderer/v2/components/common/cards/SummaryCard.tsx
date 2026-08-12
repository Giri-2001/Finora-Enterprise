// ============================================================
// FINORA ENTERPRISE V2
// DESIGN SYSTEM
// SUMMARY CARD
// ============================================================

import type {
  CSSProperties,
  ReactNode,
} from "react";

// ============================================================
// TYPES
// ============================================================

export interface SummaryCardProps {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {
  panel: "#111C2E",
  panelSoft: "#142238",
  border: "rgba(148, 163, 184, 0.20)",
  primary: "#2563EB",
  text: "#FFFFFF",
  textSoft: "#CBD5E1",
  divider: "rgba(148, 163, 184, 0.18)",
};

// ============================================================
// STYLES
// ============================================================

const cardStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  boxSizing: "border-box",
  background:
    `linear-gradient(180deg, ${COLORS.panel}, ${COLORS.panelSoft})`,
  border:
    `1px solid ${COLORS.border}`,
  borderRadius: "16px",
  padding: "14px 18px",
  color: COLORS.text,
  boxShadow:
    "0 8px 24px rgba(0, 0, 0, 0.16)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  marginBottom: "12px",
  paddingLeft: "10px",
  borderLeft:
    `3px solid ${COLORS.primary}`,
  fontSize: "18px",
  fontWeight: 700,
  lineHeight: 1.25,
  color: COLORS.text,
};

const contentStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  width: "100%",
  minWidth: 0,
  minHeight: 0,
  color: COLORS.text,
};

const footerStyle: CSSProperties = {
  marginTop: "16px",
  paddingTop: "14px",
  borderTop:
    `1px solid ${COLORS.divider}`,
  color: COLORS.textSoft,
};

// ============================================================
// COMPONENT
// ============================================================

export default function SummaryCard({
  title,
  children,
  footer,
}: SummaryCardProps) {

  return (
    <section style={cardStyle}>

      {title && (
        <h3 style={titleStyle}>
          {title}
        </h3>
      )}

      <div style={contentStyle}>
        {children}
      </div>

      {footer && (
        <div style={footerStyle}>
          {footer}
        </div>
      )}

    </section>
  );
}

// ============================================================
// END
// ============================================================
