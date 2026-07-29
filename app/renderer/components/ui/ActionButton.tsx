import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionVariant = "primary" | "warning" | "danger" | "success";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ActionVariant;
  fullWidth?: boolean;
};

export default function ActionButton({
  children,
  variant = "primary",
  fullWidth = false,
  disabled = false,
  style,
  ...props
}: ActionButtonProps) {
  const background = {
    primary: "#2563eb",
    warning: "#d97706",
    danger: "#dc2626",
    success: "#16a34a",
  }[variant];

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      disabled={disabled}
      style={{
        padding: "8px 14px",
        width: fullWidth ? "100%" : undefined,
        border: "none",
        borderRadius: 6,
        background,
        color: "#ffffff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontWeight: 600,
        fontSize: 13,
        transition: "all 0.2s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
