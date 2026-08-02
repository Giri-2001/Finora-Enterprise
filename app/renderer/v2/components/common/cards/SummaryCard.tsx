/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   SUMMARY CARD
=========================================================== */

import type {
  CSSProperties,
  ReactNode,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface SummaryCardProps {

  title: string;

  children: ReactNode;

  footer?: ReactNode;

}

/* ===========================================================
   STYLES
=========================================================== */

const cardStyle: CSSProperties = {

  background: "#ffffff",

  border: "1px solid #e5e7eb",

  borderRadius: "16px",

  padding: "20px",

};

const titleStyle: CSSProperties = {

  margin: 0,

  marginBottom: "16px",

  fontSize: "18px",

  fontWeight: 700,

  color: "#111827",

};

const contentStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "12px",

};

const footerStyle: CSSProperties = {

  marginTop: "20px",

  paddingTop: "16px",

  borderTop: "1px solid #e5e7eb",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function SummaryCard({

  title,

  children,

  footer,

}: SummaryCardProps) {

  return (

    <section style={cardStyle}>

      <h3 style={titleStyle}>

        {title}

      </h3>

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
