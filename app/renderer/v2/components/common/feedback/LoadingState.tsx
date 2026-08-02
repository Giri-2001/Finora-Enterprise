/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   LOADING STATE
=========================================================== */

import type { CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface LoadingStateProps {

  message?: string;

}

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  alignItems: "center",

  justifyContent: "center",

  padding: "48px 24px",

  gap: "16px",

};

const spinnerStyle: CSSProperties = {

  width: "42px",

  height: "42px",

  border: "4px solid #e5e7eb",

  borderTop: "4px solid #2563eb",

  borderRadius: "50%",

};

const textStyle: CSSProperties = {

  color: "#6b7280",

  fontSize: "14px",

  fontWeight: 500,

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function LoadingState({

  message = "Loading...",

}: LoadingStateProps) {

  return (

    <section style={wrapperStyle}>

      <div style={spinnerStyle} />

      <div style={textStyle}>

        {message}

      </div>

    </section>

  );

}
