/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   TEXT INPUT
=========================================================== */

import type { CSSProperties, InputHTMLAttributes } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface TextInputProps
  extends InputHTMLAttributes<HTMLInputElement> {}

/* ===========================================================
   STYLES
=========================================================== */

const inputStyle: CSSProperties = {

  width: "100%",

  padding: "12px 14px",

  borderRadius: "12px",

  border: "1px solid #d1d5db",

  background: "#ffffff",

  color: "#111827",

  fontSize: "14px",

  outline: "none",

  boxSizing: "border-box",

  transition: "all 0.2s ease",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function TextInput({

  style,

  ...props

}: TextInputProps) {

  return (

    <input

      {...props}

      style={{

        ...inputStyle,

        ...style,

      }}

    />

  );

}
