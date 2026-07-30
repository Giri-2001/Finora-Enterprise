import type { ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

type ToastProps = {
  message: string;

  type?: ToastType;

  icon?: ReactNode;

  onClose?: () => void;
};

export default function Toast({
  message,

  type = "success",

  icon,

  onClose,
}: ToastProps) {
  const theme = {
    success: {
      bg: "var(--success-soft)",

      color: "var(--success)",

      icon: "✓",
    },

    error: {
      bg: "var(--danger-soft)",

      color: "var(--danger)",

      icon: "!",
    },

    warning: {
      bg: "var(--warning-soft)",

      color: "var(--warning)",

      icon: "⚠",
    },

    info: {
      bg: "rgba(2,132,199,.15)",

      color: "var(--info)",

      icon: "i",
    },
  }[type];

  return (
    <div
      style={{
        position: "fixed",

        top: 24,

        right: 24,

        minWidth: 340,

        maxWidth: 450,

        padding: "18px 20px",

        display: "flex",

        alignItems: "center",

        gap: 14,

        background: "var(--surface)",

        color: "var(--text)",

        border: `1px solid ${theme.color}`,

        borderRadius: 18,

        boxShadow: "var(--popup-shadow)",

        zIndex: 6000,

        animation: "finoraToastIn .35s ease",

        backdropFilter: "blur(14px)",
      }}
    >
      <div
        style={{
          width: 42,

          height: 42,

          flexShrink: 0,

          display: "flex",

          alignItems: "center",

          justifyContent: "center",

          borderRadius: "50%",

          background: theme.bg,

          color: theme.color,

          fontSize: 20,

          fontWeight: 900,
        }}
      >
        {icon ?? theme.icon}
      </div>

      <div
        style={{
          flex: 1,

          fontWeight: 700,

          fontSize: 14,

          lineHeight: 1.5,
        }}
      >
        {message}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 32,

            height: 32,

            borderRadius: "50%",

            border: "none",

            background: "var(--surface-hover)",

            color: "var(--text-muted)",

            cursor: "pointer",

            fontSize: 20,

            fontWeight: 800,
          }}
        >
          ×
        </button>
      )}

      <style>
        {`

          @keyframes finoraToastIn {

            from {

              opacity:0;

              transform:
                translateY(-30px)
                scale(.95);

            }


            to {

              opacity:1;

              transform:
                translateY(0)
                scale(1);

            }

          }

        `}
      </style>
    </div>
  );
}
