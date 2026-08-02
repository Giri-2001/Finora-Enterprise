/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   FORM FIELD
=========================================================== */

import type { CSSProperties, ReactNode } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface FormFieldProps {

  label: string;

  children: ReactNode;

  required?: boolean;

  helpText?: string;

  error?: string;

}

/* ===========================================================
   STYLES
=========================================================== */

const wrapperStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "8px",

  marginBottom: "20px",

};

const labelStyle: CSSProperties = {

  fontWeight: 600,

  color: "#111827",

  fontSize: "14px",

};

const requiredStyle: CSSProperties = {

  color: "#dc2626",

  marginLeft: "4px",

};

const helpStyle: CSSProperties = {

  fontSize: "12px",

  color: "#6b7280",

};

const errorStyle: CSSProperties = {

  fontSize: "12px",

  color: "#dc2626",

  fontWeight: 500,

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function FormField({

  label,

  children,

  required = false,

  helpText,

  error,

}: FormFieldProps) {

  return (

    <div style={wrapperStyle}>

      <label style={labelStyle}>

        {label}

        {required && (

          <span style={requiredStyle}>

            *

          </span>

        )}

      </label>

      {children}

      {helpText && (

        <div style={helpStyle}>

          {helpText}

        </div>

      )}

      {error && (

        <div style={errorStyle}>

          {error}

        </div>

      )}

    </div>

  );

}
