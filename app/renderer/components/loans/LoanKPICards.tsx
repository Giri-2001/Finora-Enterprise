import type { ReactNode } from "react";

type LoanKPI = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: string;
};

type LoanKPICardsProps = {
  items: LoanKPI[];
};

export default function LoanKPICards({ items }: LoanKPICardsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
        gap: 18,
        marginBottom: 24,
      }}
    >
      {items.map((item) => (
        <div
          key={item.title}
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
            transition: "transform .2s ease, box-shadow .2s ease",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                color: item.color ?? "var(--finora-accent)",
                fontSize: 30,
                fontWeight: 900,
                lineHeight: 1.2,
              }}
            >
              {typeof item.value === "number"
                ? item.value.toLocaleString("en-IN")
                : item.value}
            </div>

            {item.subtitle && (
              <div
                style={{
                  marginTop: 8,
                  color: "var(--text-muted)",
                  fontSize: 12,
                }}
              >
                {item.subtitle}
              </div>
            )}
          </div>

          {item.icon && (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--surface-hover)",
                color: item.color ?? "var(--finora-accent)",
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
