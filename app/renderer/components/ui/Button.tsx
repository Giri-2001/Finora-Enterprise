import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "success" | "danger";

type ButtonSize = "small" | "medium" | "large";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export default function Button({
  children,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  style,
  ...props
}: ButtonProps) {
  const background = {
    primary:
      "linear-gradient(135deg,var(--finora-accent),var(--finora-accent-hover))",

    secondary: "var(--surface-hover)",

    success: "linear-gradient(135deg,var(--success),#15803d)",

    danger: "linear-gradient(135deg,var(--danger),#991b1b)",
  }[variant];

  const padding = {
    small: "8px 14px",
    medium: "11px 20px",
    large: "14px 28px",
  }[size];

  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        padding,

        width: fullWidth ? "100%" : undefined,

        border: "1px solid var(--surface-border)",

        borderRadius: "10px",

        background,

        color: variant === "secondary" ? "var(--text)" : "var(--button-text)",

        cursor: disabled ? "not-allowed" : "pointer",

        opacity: disabled ? 0.6 : 1,

        fontWeight: 700,

        fontSize: 14,

        letterSpacing: "0.2px",

        boxShadow: disabled ? "none" : "0 8px 20px rgba(37,99,235,0.20)",

        transform: "translateY(0)",

        transition: "all 0.25s ease",

        ...style,
      }}
      onMouseEnter={(event) => {
        if (!disabled) {
          event.currentTarget.style.transform = "translateY(-2px)";

          event.currentTarget.style.boxShadow =
            "0 12px 28px rgba(37,99,235,0.30)";
        }

        props.onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        if (!disabled) {
          event.currentTarget.style.transform = "translateY(0)";

          event.currentTarget.style.boxShadow =
            "0 8px 20px rgba(37,99,235,0.20)";
        }

        props.onMouseLeave?.(event);
      }}
    >
      {children}
    </button>
  );
}
