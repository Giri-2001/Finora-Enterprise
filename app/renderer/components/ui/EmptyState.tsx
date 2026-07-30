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
        marginTop: 24,

        padding: "56px 30px",

        border: "1px dashed var(--surface-border)",

        borderRadius: 20,

        background: "var(--surface)",

        color: "var(--text)",

        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        justifyContent: "center",

        textAlign: "center",

        boxShadow: "var(--card-shadow)",

        transition: "all .25s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {icon && (
        <div
          style={{
            width: 72,

            height: 72,

            borderRadius: "50%",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            background: "rgba(37,99,235,0.12)",

            color: "var(--finora-accent)",

            fontSize: 34,

            marginBottom: 22,
          }}
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          margin: 0,

          color: "var(--text)",

          fontSize: 24,

          fontWeight: 900,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          marginTop: 12,

          marginBottom: action ? 26 : 0,

          maxWidth: 450,

          color: "var(--text-muted)",

          lineHeight: 1.7,

          fontSize: 15,
        }}
      >
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
}
