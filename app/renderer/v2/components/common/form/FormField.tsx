// ============================================================
// FINORA ENTERPRISE V2
// DESIGN SYSTEM
// FORM FIELD
//
// RESPONSIBILITY:
// - Shared form field presentation
// - Premium FINORA dark-navy labels
// - Required / help / error messaging
// - Preserve existing FormField API
//
// IMPORTANT:
// - No business logic
// - No state
// - No persistence
// - Existing props and behavior preserved
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

export interface FormFieldProps {

  label: string;

  children: ReactNode;

  required?: boolean;

  helpText?: string;

  error?: string;

}

// ============================================================
// COLOR TOKENS
// ============================================================

const COLORS = {

  text: "#E2E8F0",

  required: "#60A5FA",

  help: "#94A3B8",

  error: "#FCA5A5",

};

// ============================================================
// STYLES
// ============================================================

const wrapperStyle: CSSProperties = {

  display: "flex",

  flexDirection: "column",

  gap: "8px",

  marginBottom: "20px",

  minWidth: 0,

};

const labelStyle: CSSProperties = {

  display: "flex",

  alignItems: "center",

  minWidth: 0,

  fontWeight: 600,

  color: COLORS.text,

  fontSize: "14px",

  lineHeight: 1.25,

};

const requiredStyle: CSSProperties = {

  color: COLORS.required,

  marginLeft: "4px",

  fontSize: "14px",

  fontWeight: 700,

};

const helpStyle: CSSProperties = {

  fontSize: "12px",

  fontWeight: 500,

  color: COLORS.help,

  lineHeight: 1.3,

};

const errorStyle: CSSProperties = {

  fontSize: "12px",

  color: COLORS.error,

  fontWeight: 600,

  lineHeight: 1.3,

};

// ============================================================
// COMPONENT
// ============================================================

export default function FormField({

  label,

  children,

  required = false,

  helpText,

  error,

}: FormFieldProps) {

  return (

    <div
      style={wrapperStyle}
    >

      <label
        style={labelStyle}
      >

        {label}

        {required && (

          <span
            style={requiredStyle}
          >

            *

          </span>

        )}

      </label>

      {children}

      {helpText && (

        <div
          style={helpStyle}
        >

          {helpText}

        </div>

      )}

      {error && (

        <div
          style={errorStyle}
        >

          {error}

        </div>

      )}

    </div>

  );

}

// ============================================================
// END
// ============================================================
