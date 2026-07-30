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
    primary:
      "linear-gradient(135deg,var(--finora-accent),var(--finora-accent-hover))",

    warning: "linear-gradient(135deg,var(--warning),#a16207)",

    danger: "linear-gradient(135deg,var(--danger),#991b1b)",

    success: "linear-gradient(135deg,var(--success),#15803d)",
  }[variant];

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      disabled={disabled}
      style={{
        width: fullWidth ? "100%" : undefined,

        padding: "10px 18px",

        border: "none",

        borderRadius: 10,

        background,

        color: "var(--button-text)",

        cursor: disabled ? "not-allowed" : "pointer",

        opacity: disabled ? 0.55 : 1,

        fontWeight: 800,

        fontSize: 13,

        letterSpacing: "0.3px",

        boxShadow: disabled ? "none" : "0 8px 22px rgba(37,99,235,0.22)",

        transition: "all .25s ease",

        transform: "translateY(0)",

        ...style,
      }}
      onMouseEnter={(event) => {
        if (!disabled) {
          event.currentTarget.style.transform = "translateY(-3px)";

          event.currentTarget.style.boxShadow =
            "0 16px 35px rgba(37,99,235,0.35)";
        }

        props.onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        if (!disabled) {
          event.currentTarget.style.transform = "translateY(0)";

          event.currentTarget.style.boxShadow =
            "0 8px 22px rgba(37,99,235,0.22)";
        }

        props.onMouseLeave?.(event);
      }}
    >
      {children}
    </button>
  );
}
