import type { ReactNode } from "react";

type LoanStatsProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
};

export default function LoanStats({
  title,
  value,
  subtitle,
  icon,
}: LoanStatsProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--surface-border)",
        borderRadius: 18,
        padding: 20,
        boxShadow: "var(--card-shadow)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        transition: "all .25s ease",
      }}
    >
      <div>
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "var(--finora-accent)",
            fontSize: 30,
            fontWeight: 900,
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>

        {subtitle && (
          <div
            style={{
              marginTop: 8,
              color: "var(--text-muted)",
              fontSize: 12,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {icon && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 48,
            minHeight: 48,
            borderRadius: 12,
            background: "var(--surface-hover)",
            color: "var(--finora-accent)",
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
}
