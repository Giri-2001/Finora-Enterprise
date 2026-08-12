// ============================================================
// FINORA ENTERPRISE V2
// DESIGN SYSTEM
// TEXT INPUT
//
// RESPONSIBILITY:
// - Shared enterprise text input
// - FINORA dark navy visual language
// - Compact Step 4 compatible sizing
// - Preserve native input API
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
  InputHTMLAttributes,
} from "react";

// ============================================================
// TYPES
// ============================================================

export interface TextInputProps
  extends InputHTMLAttributes<HTMLInputElement> {}

// ============================================================
// STYLES
// ============================================================

const inputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  height: "38px",

  padding: "8px 11px",

  borderRadius: "8px",

  border: "1px solid rgba(148, 163, 184, 0.18)",

  background: "#0A1425",

  color: "#FFFFFF",

  fontSize: "12px",

  fontWeight: 500,

  lineHeight: 1.2,

  outline: "none",

  boxSizing: "border-box",

  transition:
    "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",

  WebkitAppearance: "none",

  MozAppearance: "textfield",
};

// ============================================================
// COMPONENT
// ============================================================

export default function TextInput({
  type,
  style,
  ...props
}: TextInputProps) {
  return (
    <input
      {...props}
      type={type}
      style={{
        ...inputStyle,

        ...(type === "number"
          ? {
              WebkitAppearance: "none",
              MozAppearance: "textfield",
            }
          : {}),

        ...style,
      }}
    />
  );
}

// ============================================================
// END
// ============================================================
