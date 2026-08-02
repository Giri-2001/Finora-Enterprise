/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   SELECT INPUT
=========================================================== */

import type {
  CSSProperties,
  SelectHTMLAttributes,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface SelectOption {

  label: string;

  value: string;

}

export interface SelectInputProps
  extends SelectHTMLAttributes<HTMLSelectElement> {

  options: SelectOption[];

}

/* ===========================================================
   STYLES
=========================================================== */

const selectStyle: CSSProperties = {

  width: "100%",

  padding: "12px 14px",

  borderRadius: "12px",

  border: "1px solid #d1d5db",

  background: "#ffffff",

  color: "#111827",

  fontSize: "14px",

  outline: "none",

  boxSizing: "border-box",

};

/* ===========================================================
   COMPONENT
=========================================================== */

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

        >

          {option.label}

        </option>

      ))}

    </select>

  );

}
