/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   EMPTY STATE
=========================================================== */

import type {
  CSSProperties,
  ReactNode,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface EmptyStateProps {

  title: string;

  description: string;

  action?: ReactNode;

}

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  justifyContent: "center",

  textAlign: "center",

  padding: "48px 24px",

  border: "1px dashed #d1d5db",

  borderRadius: "16px",

  background: "#ffffff",

};

const titleStyle: CSSProperties = {

  margin: "16px 0 8px",

  fontSize: "20px",

  fontWeight: 700,

  color: "#111827",

};

const descriptionStyle: CSSProperties = {

  maxWidth: "420px",

  color: "#6b7280",

  lineHeight: 1.6,

};

const iconStyle: CSSProperties = {

  fontSize: "48px",

};

const actionStyle: CSSProperties = {

  marginTop: "24px",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function EmptyState({

  title,

  description,

  action,

}: EmptyStateProps) {

  return (

    <section style={wrapperStyle}>

      <div style={iconStyle}>

        📂

      </div>

      <h2 style={titleStyle}>

        {title}

      </h2>

      <p style={descriptionStyle}>

        {description}

      </p>

      {action && (

        <div style={actionStyle}>

          {action}

        </div>

      )}

    </section>

  );

}
