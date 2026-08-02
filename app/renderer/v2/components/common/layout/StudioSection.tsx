/* ===========================================================
   FINORA ENTERPRISE V2
   STUDIO SECTION
--------------------------------------------------------------
Reusable Studio Section Container
=========================================================== */

import type {
  CSSProperties,
  ReactNode,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

interface StudioSectionProps {

  title?: string;

  subtitle?: string;

  children: ReactNode;

}

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  background: "#ffffff",

  border: "1px solid #e5e7eb",

  borderRadius: "18px",

  padding: "24px",

};

const titleStyle: CSSProperties = {

  margin: 0,

  fontSize: "22px",

  fontWeight: 700,

  color: "#111827",

};

const subtitleStyle: CSSProperties = {

  marginTop: "8px",

  marginBottom: "24px",

  color: "#6b7280",

  lineHeight: 1.6,

  fontSize: "14px",

};

const bodyStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "20px",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function StudioSection({

  title,

  subtitle,

  children,

}: StudioSectionProps) {

  return (

    <section style={wrapperStyle}>

      {title && (

        <h3 style={titleStyle}>

          {title}

        </h3>

      )}

      {subtitle && (

        <p style={subtitleStyle}>

          {subtitle}

        </p>

      )}

      <div style={bodyStyle}>

        {children}

      </div>

    </section>

  );

}
