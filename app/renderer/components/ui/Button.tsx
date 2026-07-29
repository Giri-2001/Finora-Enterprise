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
    primary: "#2563eb",
    secondary: "#475569",
    success: "#16a34a",
    danger: "#dc2626",
  }[variant];

  const padding = {
    small: "8px 14px",
    medium: "10px 18px",
    large: "12px 24px",
  }[size];

  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        padding,
        width: fullWidth ? "100%" : undefined,
        border: "none",
        borderRadius: 8,
        background,
        color: "#ffffff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontWeight: 600,
        fontSize: 14,
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
