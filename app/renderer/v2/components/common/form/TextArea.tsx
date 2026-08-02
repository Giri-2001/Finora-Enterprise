/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   TEXT AREA
=========================================================== */

import type {
  CSSProperties,
  TextareaHTMLAttributes,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

/* ===========================================================
   STYLES
=========================================================== */

const textAreaStyle: CSSProperties = {

  width: "100%",

  minHeight: "120px",

  padding: "12px 14px",

  borderRadius: "12px",

  border: "1px solid #d1d5db",

  background: "#ffffff",

  color: "#111827",

  fontSize: "14px",

  resize: "vertical",

  outline: "none",

  boxSizing: "border-box",

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function TextArea({

  style,

  ...props

}: TextAreaProps) {

  return (

    <textarea

      {...props}

      style={{

        ...textAreaStyle,

        ...style,

      }}

    />

  );

}
