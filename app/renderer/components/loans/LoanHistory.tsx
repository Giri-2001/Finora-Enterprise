import type { Loan } from "./types";

type LoanHistoryProps = {
  loan: Loan;
};

function safeNumber(value?: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value?: number): string {
  return `₹${safeNumber(value).toLocaleString("en-IN")}`;
}

export default function LoanHistory({ loan }: LoanHistoryProps) {
  const history = [
    {
      title: "Loan Created",
      date: loan.createdAt || "-",
      description: `Loan ${loan.finoraLoanId} was created.`,
      color: "var(--finora-accent)",
    },
    {
      title: "Collections",
      date: loan.lastCollectionDate || "-",
      description: `Total collected ${formatCurrency(
        loan.totalCollectedAmount,
      )}`,
      color: "var(--success)",
    },
    {
      title: "Outstanding Balance",
      date: loan.updatedAt || "-",
      description: `Outstanding balance ${formatCurrency(
        loan.outstandingAmount,
      )}`,
      color: "var(--warning)",
    },
    {
      title: "Loan Status",
      date: loan.updatedAt || "-",
      description: `Current status: ${loan.status}`,
      color: "var(--danger)",
    },
  ];

  return (
    <div
      style={{
        marginTop: 24,
        padding: 24,
        borderRadius: 18,
        background: "var(--surface)",
        border: "1px solid var(--surface-border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: 24,
          color: "var(--text)",
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        Loan Activity History
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {history.map((item) => (
          <div
            key={item.title}
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                marginTop: 6,
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />

            <div
              style={{
                flex: 1,
                padding: 18,
                borderRadius: 16,
                background: "var(--surface-hover)",
                border: "1px solid var(--surface-border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <strong
                  style={{
                    color: "var(--text)",
                  }}
                >
                  {item.title}
                </strong>

                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  {item.date}
                </span>
              </div>

              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
