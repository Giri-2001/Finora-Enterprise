import type { ReactNode } from "react";

import Button from "../ui/Button";

type LoanDialogsProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
};

export default function LoanDialogs({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: LoanDialogsProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: "var(--surface)",
          border: "1px solid var(--surface-border)",
          borderRadius: 20,
          boxShadow: "var(--card-shadow)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--surface-border)",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "var(--text)",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {title}
          </h2>
        </div>

        <div
          style={{
            padding: 24,
            color: "var(--text)",
          }}
        >
          {children}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            padding: 20,
            borderTop: "1px solid var(--surface-border)",
          }}
        >
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>

          {onConfirm && (
            <Button type="button" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
