import Card from "../ui/Card";

export type LoanStatisticItem = {
  id: string;
  label: string;
  value: string | number;
  color?: string;
};

type LoanStatisticsProps = {
  title?: string;
  subtitle?: string;
  items: LoanStatisticItem[];
};

export default function LoanStatistics({
  title = "Loan Statistics",
  subtitle = "Key loan performance metrics",
  items,
}: LoanStatisticsProps) {
  return (
    <Card title={title} subtitle={subtitle}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 18,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 20,
              borderRadius: 16,
              background: "var(--surface)",
              border: "1px solid var(--surface-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {item.label}
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
          </div>
        ))}
      </div>
    </Card>
  );
}
