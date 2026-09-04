// ============================================================
// FINORA ENTERPRISE V2
// DESIGN SYSTEM
// FORM FIELD
//
// RESPONSIBILITY:
// - Shared form field presentation
// - FINORA Enterprise Theme Engine labels
// - Required / help / error messaging
// - Preserve existing FormField API
//
// IMPORTANT:
// - No business logic
// - No state
// - No persistence
// - Existing props and behavior preserved
// - No local application colour palette
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


  labelTextStyle?: CSSProperties;

}

// ============================================================
// FINORA THEME TOKENS
//
// Values are resolved from the existing FINORA Theme Engine.
// ============================================================

const THEME = {

  textSecondary:
    "var(--finora-theme-text-secondary)",

  required:
    "var(--finora-theme-brand-primary)",

  help:
    "var(--finora-theme-text-muted)",

  error:
    "var(--finora-theme-status-danger)",

} as const;

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

  // FINORA Theme Engine
  // Secondary text is used for form labels.
  color: THEME.textSecondary,

  fontSize: "14px",

  lineHeight: 1.25,

};

const requiredStyle: CSSProperties = {

  color: THEME.required,

  marginLeft: "4px",

  fontSize: "14px",

  fontWeight: 700,

};

const helpStyle: CSSProperties = {

  fontSize: "12px",

  fontWeight: 500,

  color: THEME.help,

  lineHeight: 1.3,

};

const errorStyle: CSSProperties = {

  fontSize: "12px",

  color: THEME.error,

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


  labelTextStyle,

}: FormFieldProps) {

  return (

    <div
      style={wrapperStyle}
    >

      <label
        style={{ ...labelStyle, ...labelTextStyle }}
      >

        {label}

        {required && (

          <span
            style={{ ...requiredStyle, ...labelTextStyle }}
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
