// ============================================================
// FINORA ENTERPRISE V2
// DESIGN SYSTEM
// SELECT INPUT
//
// RESPONSIBILITY:
// - Shared enterprise select input
// - FINORA dark navy visual language
// - Compact Step 4 compatible sizing
// - Preserve existing SelectInput API
//
// ============================================================

// ============================================================
// IMPORTS
// ============================================================

import type {
  CSSProperties,
  SelectHTMLAttributes,
} from "react";

// ============================================================
// TYPES
// ============================================================

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectInputProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

// ============================================================
// STYLES
// ============================================================

const selectStyle: CSSProperties = {
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

  cursor: "pointer",

  transition:
    "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",

  WebkitAppearance: "none",

  MozAppearance: "none",
};

// ============================================================
// COMPONENT
// ============================================================

export default function SelectInput({
  options,
  style,
  ...props
}: SelectInputProps) {
  return (
    <select
      {...props}
      style={{
        ...selectStyle,
        ...style,
      }}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          style={{
            background: "#0A1425",
            color: "#FFFFFF",
          }}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

// ============================================================
// END
// ============================================================
