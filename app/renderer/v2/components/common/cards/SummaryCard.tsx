// ============================================================
// FINORA ENTERPRISE V2
// DESIGN SYSTEM
// SUMMARY CARD
//
// THEME:
// - Visual colours come from FINORA Theme Engine CSS variables.
// - No local colour palette.
// - Layout / dimensions unchanged.
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
// FINORA THEME TOKENS
// ============================================================

const THEME = {

  panel:
    "var(--finora-theme-surface, var(--finora-theme-background-surface, #111C2E))",

  panelSoft:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #142238))",

  border:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.20))",

  primary:
    "var(--finora-theme-brand-primary, #2563EB)",

  text:
    "var(--finora-theme-text-primary, #FFFFFF)",

  textSoft:
    "var(--finora-theme-text-secondary, #CBD5E1)",

  divider:
    "var(--finora-theme-border-default, rgba(148, 163, 184, 0.18))",

  shadow:
    "var(--finora-theme-overlay-shadow, rgba(0, 0, 0, 0.16))",

};

// ============================================================
// STYLES
// ============================================================

const cardStyle: CSSProperties = {

  width:
    "100%",

  height:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  boxSizing:
    "border-box",

  background:
    `linear-gradient(
      180deg,
      ${THEME.panel},
      ${THEME.panelSoft}
    )`,

  border:
    `1px solid ${THEME.border}`,

  borderRadius:
    "16px",

  padding:
    "14px 18px",

  color:
    THEME.text,

  boxShadow:
    `0 8px 24px ${THEME.shadow}`,

};

const titleStyle: CSSProperties = {

  margin:
    0,

  marginBottom:
    "12px",

  paddingLeft:
    "10px",

  borderLeft:
    `3px solid ${THEME.primary}`,

  fontSize:
    "18px",

  fontWeight:
    700,

  lineHeight:
    1.25,

  color:
    THEME.text,

};

const contentStyle: CSSProperties = {

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "10px",

  width:
    "100%",

  minWidth:
    0,

  minHeight:
    0,

  color:
    THEME.text,

};

const footerStyle: CSSProperties = {

  marginTop:
    "16px",

  paddingTop:
    "14px",

  borderTop:
    `1px solid ${THEME.divider}`,

  color:
    THEME.textSoft,

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