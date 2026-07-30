import type { ReactNode } from "react";

type ModalProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  width?: number;
};

export default function Modal({
  title,
  children,
  footer,
  onClose,
  width = 520,
}: ModalProps) {
  return (
    <div
      style={{
        position: "fixed",

        inset: 0,

        background: "var(--overlay)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        zIndex: 2000,

        padding: 20,

        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",

          maxWidth: width,

          background: "var(--surface)",

          color: "var(--text)",

          border: "1px solid var(--surface-border)",

          borderRadius: 18,

          boxShadow: "var(--popup-shadow)",

          overflow: "hidden",

          animation: "finoraModalIn 0.25s ease",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <header
          style={{
            padding: "18px 22px",

            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            borderBottom: "1px solid var(--surface-border)",
          }}
        >
          <h2
            style={{
              margin: 0,

              fontSize: 20,

              fontWeight: 800,

              color: "var(--text)",
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 34,

              height: 34,

              borderRadius: "50%",

              border: "none",

              background: "var(--surface-hover)",

              color: "var(--text)",

              cursor: "pointer",

              fontSize: 18,

              fontWeight: 700,
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            padding: 22,
          }}
        >
          {children}
        </div>

        {footer && (
          <footer
            style={{
              padding: "16px 22px",

              borderTop: "1px solid var(--surface-border)",

              display: "flex",

              justifyContent: "flex-end",

              gap: 12,
            }}
          >
            {footer}
          </footer>
        )}
      </div>

      <style>
        {`
          @keyframes finoraModalIn {
            from {
              opacity:0;
              transform:translateY(20px) scale(0.96);
            }

            to {
              opacity:1;
              transform:translateY(0) scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}
