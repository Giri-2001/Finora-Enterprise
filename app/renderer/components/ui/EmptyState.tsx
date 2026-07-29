import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        marginTop: 20,
        padding: "48px 24px",
        border: "1px dashed #cbd5e1",
        borderRadius: 12,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: 42,
            marginBottom: 16,
          }}
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          margin: 0,
          color: "#0f172a",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          marginTop: 10,
          marginBottom: action ? 20 : 0,
          maxWidth: 420,
          color: "#64748b",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {action}
    </div>
  );
}
