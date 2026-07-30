import Card from "../ui/Card";

type LoanAnalyticsProps = {
  totalLoans: number;
  activeLoans: number;
  closedLoans: number;
  totalApprovedAmount: number;
  totalCollectedAmount: number;
  outstandingAmount: number;
};

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function LoanAnalytics({
  totalLoans,
  activeLoans,
  closedLoans,
  totalApprovedAmount,
  totalCollectedAmount,
  outstandingAmount,
}: LoanAnalyticsProps) {
  const collectionPercentage =
    totalApprovedAmount > 0
      ? (totalCollectedAmount / totalApprovedAmount) * 100
      : 0;

  const cards = [
    {
      title: "Total Loans",
      value: totalLoans.toLocaleString("en-IN"),
    },
    {
      title: "Active Loans",
      value: activeLoans.toLocaleString("en-IN"),
    },
    {
      title: "Closed Loans",
      value: closedLoans.toLocaleString("en-IN"),
    },
    {
      title: "Approved Amount",
      value: formatCurrency(totalApprovedAmount),
    },
    {
      title: "Collected Amount",
      value: formatCurrency(totalCollectedAmount),
    },
    {
      title: "Outstanding",
      value: formatCurrency(outstandingAmount),
    },
    {
      title: "Collection Rate",
      value: `${collectionPercentage.toFixed(1)}%`,
    },
  ];

  return (
    <Card title="Loan Analytics" subtitle="Portfolio performance overview">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 18,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface-border)",
              borderRadius: 18,
              padding: 20,
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
              {card.title}
            </div>

            <div
              style={{
                color: "var(--finora-accent)",
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
