// ============================================================
// FINORA ENTERPRISE V2
// DESIGN SYSTEM
// SELECT INPUT
//
// RESPONSIBILITY:
// - Shared enterprise select input
// - FINORA dark navy visual language
// - Compact Step 4 / Step 6 compatible sizing
// - Visible enterprise dropdown arrow
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

const wrapperStyle: CSSProperties = {
  position: "relative",

  width: "100%",
  minWidth: 0,

  boxSizing: "border-box",
};

const selectStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,

  height: "38px",

  padding:
    "8px 34px 8px 11px",

  borderRadius: "8px",

  border:
    "1px solid rgba(148, 163, 184, 0.18)",

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

  appearance: "none",
};

const arrowStyle: CSSProperties = {
  position: "absolute",

  top: "50%",
  right: "12px",

  width: "0",
  height: "0",

  transform:
    "translateY(-25%)",

  borderLeft:
    "5px solid transparent",

  borderRight:
    "5px solid transparent",

  borderTop:
    "6px solid #CBD5E1",

  pointerEvents: "none",

  zIndex: 2,
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
    <div
      style={
        wrapperStyle
      }
    >

      <select
        {...props}
        style={{
          ...selectStyle,
          ...style,
        }}
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
              style={{
                background:
                  "#0A1425",

                color:
                  "#FFFFFF",
              }}
            >
              {
                option.label
              }
            </option>
          ),
        )}
      </select>

      {/* =====================================================
          ENTERPRISE DROPDOWN ARROW

          Native arrow is disabled intentionally so that
          FINORA theme remains consistent across browsers.
      ===================================================== */}

      <span
        aria-hidden="true"
        style={
          arrowStyle
        }
      />

    </div>
  );
}

// ============================================================
// END
// ============================================================
