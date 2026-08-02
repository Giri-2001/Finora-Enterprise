/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   BUTTON
=========================================================== */

import type {
  ButtonHTMLAttributes,
  CSSProperties,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {

  variant?: ButtonVariant;

}

/* ===========================================================
   STYLES
=========================================================== */

const baseStyle: CSSProperties = {

  padding: "12px 18px",

  borderRadius: "12px",

  border: "none",

  cursor: "pointer",

  fontWeight: 600,

  fontSize: "14px",

  transition: "all 0.2s ease",

};

const variants: Record<ButtonVariant, CSSProperties> = {

  primary: {

    background: "#2563eb",

    color: "#ffffff",

  },

  secondary: {

    background: "#e5e7eb",

    color: "#111827",

  },

  success: {

    background: "#16a34a",

    color: "#ffffff",

  },

  danger: {

    background: "#dc2626",

    color: "#ffffff",

  },

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function Button({

  variant = "primary",

  style,

  children,

  ...props

}: ButtonProps) {

  return (

    <button

      {...props}

      style={{

        ...baseStyle,

        ...variants[variant],

        ...style,

      }}

    >

      {children}

    </button>

  );

}
