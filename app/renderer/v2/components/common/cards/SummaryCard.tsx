// ============================================================
// FINORA ENTERPRISE V2
// DESIGN SYSTEM
// SUMMARY CARD
//
// RESPONSIBILITY:
// - Shared premium summary/card container
// - FINORA dark-navy presentation
// - Preserve existing title / children / footer API
// - Presentation only
//
// IMPORTANT:
// - No business logic
// - No state
// - No persistence
// - Existing consumers remain compatible
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
  ReactNode,
} from "react";

// ============================================================
// TYPES
// ============================================================

export interface SummaryCardProps {

  title: string;

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

  borderStrong: "rgba(37, 99, 235, 0.42)",

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

  minWidth: 0,

  boxSizing: "border-box",

  background:
    `linear-gradient(180deg, ${COLORS.panel}, ${COLORS.panelSoft})`,

  border:
    `1px solid ${COLORS.border}`,

  borderRadius: "16px",

  padding: "20px",

  color: COLORS.text,

  boxShadow:
    "0 8px 24px rgba(0, 0, 0, 0.16)",

};

const titleStyle: CSSProperties = {

  margin: 0,

  marginBottom: "16px",

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

  gap: "12px",

  width: "100%",

  minWidth: 0,

  color: COLORS.text,

};

const footerStyle: CSSProperties = {

  marginTop: "20px",

  paddingTop: "16px",

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

    <section
      style={cardStyle}
    >

      <h3
        style={titleStyle}
      >

        {title}

      </h3>

      <div
        style={contentStyle}
      >

        {children}

      </div>

      {footer && (

        <div
          style={footerStyle}
        >

          {footer}

        </div>

      )}

    </section>

  );

}

// ============================================================
// END
// ============================================================
