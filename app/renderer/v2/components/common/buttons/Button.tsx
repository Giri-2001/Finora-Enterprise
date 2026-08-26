/* ===========================================================
   FINORA ENTERPRISE OS™
   DESIGN SYSTEM
   BUTTON

   RESPONSIBILITY:
   - Shared FINORA button component
   - Preserve existing button geometry
   - Consume FINORA Theme Engine CSS variables
   - Support primary / secondary / success / danger variants
   - No local application colour palette
=========================================================== */

/* ===========================================================
   IMPORTS
=========================================================== */

import type { ButtonHTMLAttributes, CSSProperties } from "react";

/* ===========================================================
   TYPES
=========================================================== */

export type ButtonVariant = "primary" | "secondary" | "success" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/* ===========================================================
   FINORA THEME TOKENS
=========================================================== */

const THEME = {
  /* ---------------------------------------------------------
     BRAND
  --------------------------------------------------------- */

  primary: "var(--finora-theme-brand-primary, #2563EB)",

  primaryHover:
    "var(--finora-theme-brand-secondary, var(--finora-theme-brand-primary, #1D4ED8))",

  /* ---------------------------------------------------------
     SURFACE
  --------------------------------------------------------- */

  surfaceMuted:
    "var(--finora-theme-surface-muted, var(--finora-theme-background-surface-muted, #E5E7EB))",

  /* ---------------------------------------------------------
     TEXT
  --------------------------------------------------------- */

  textPrimary: "var(--finora-theme-text-primary, #111827)",

  textInverse: "var(--finora-theme-text-inverse, #FFFFFF)",

  /* ---------------------------------------------------------
     STATUS
  --------------------------------------------------------- */

  success: "var(--finora-theme-success, #16A34A)",

  danger: "var(--finora-theme-danger, #DC2626)",
} as const;

/* ===========================================================
   BASE STYLE
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

/* ===========================================================
   THEME VARIANTS
=========================================================== */

const variants: Record<ButtonVariant, CSSProperties> = {
  /* ---------------------------------------------------------
     PRIMARY
  --------------------------------------------------------- */

  primary: {
    background: THEME.primary,

    color: THEME.textInverse,
  },

  /* ---------------------------------------------------------
     SECONDARY
  --------------------------------------------------------- */

  secondary: {
    background: THEME.surfaceMuted,

    color: THEME.textPrimary,
  },

  /* ---------------------------------------------------------
     SUCCESS
  --------------------------------------------------------- */

  success: {
    background: THEME.success,

    color: THEME.textInverse,
  },

  /* ---------------------------------------------------------
     DANGER
  --------------------------------------------------------- */

  danger: {
    background: THEME.danger,

    color: THEME.textInverse,
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

/* ===========================================================
   END
=========================================================== */
