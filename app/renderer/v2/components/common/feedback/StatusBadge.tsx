/* ===========================================================
   FINORA ENTERPRISE V2
   DESIGN SYSTEM
   STATUS BADGE
=========================================================== */

import type {
  CSSProperties,
  ReactNode,
} from "react";

/* ===========================================================
   TYPES
=========================================================== */

export type StatusVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export interface StatusBadgeProps {

  variant?: StatusVariant;

  children: ReactNode;

}

/* ===========================================================
   STYLES
=========================================================== */

const baseStyle: CSSProperties = {

  display: "inline-flex",

  alignItems: "center",

  justifyContent: "center",

  padding: "6px 12px",

  borderRadius: "999px",

  fontSize: "12px",

  fontWeight: 600,

};

const variants: Record<StatusVariant, CSSProperties> = {

  success: {

    background: "#dcfce7",

    color: "#166534",

  },

  warning: {

    background: "#fef3c7",

    color: "#92400e",

  },

  danger: {

    background: "#fee2e2",

    color: "#991b1b",

  },

  info: {

    background: "#dbeafe",

    color: "#1d4ed8",

  },

  neutral: {

    background: "#e5e7eb",

    color: "#374151",

  },

};

/* ===========================================================
   COMPONENT
=========================================================== */

export default function StatusBadge({

  variant = "neutral",

  children,

}: StatusBadgeProps) {

  return (

    <span

      style={{

        ...baseStyle,

        ...variants[variant],

      }}

    >

      {children}

    </span>

  );

}
