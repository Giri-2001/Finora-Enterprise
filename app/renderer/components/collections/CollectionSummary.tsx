import type { CSSProperties } from "react";

import type { Loan } from "../loans/types";

type CollectionSummaryProps = {
  loan?: Loan | null;
  collectedAmount?: number;
};

function formatCurrency(value?: number): string {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`;
}

export default function CollectionSummary({
  loan,
  collectedAmount = 0,
}: CollectionSummaryProps) {
  if (!loan) {
    return (
      <div
        style={{
          marginTop: 20,
          marginBottom: 20,
          padding: 28,
          borderRadius: 18,
          border: "1px dashed var(--surface-border)",
          background: "var(--surface)",
          color: "var(--text-muted)",
          textAlign: "center",
          fontWeight: 600,
          boxShadow: "var(--card-shadow)",
        }}
      >
        Select a loan to view collection details.
      </div>
    );
  }

  const approvedAmount = loan.approvedLoanAmount ?? 0;
  const collected = collectedAmount ?? 0;
  const pendingAmount = Math.max(approvedAmount - collected, 0);

  const progress =
    approvedAmount > 0 ? Math.min((collected / approvedAmount) * 100, 100) : 0;

  const cards = [
    {
      title: "Loan Amount",
      value: formatCurrency(approvedAmount),
      subtitle: "Approved amount",
      color: "var(--finora-accent)",
      icon: "🏦",
    },
    {
      title: "Collected",
      value: formatCurrency(collected),
      subtitle: "Received so far",
      color: "var(--success)",
      icon: "💰",
    },
    {
      title: "Pending",
      value: formatCurrency(pendingAmount),
      subtitle: "Outstanding balance",
      color: "var(--danger)",
      icon: "⏳",
    },
    {
      title: "Collection Type",
      value: loan.collectionType,
      subtitle: "Interest configuration",
      color: "var(--warning)",
      icon: "📋",
    },
  ];

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 18,
    marginTop: 20,
    marginBottom: 20,
  };

  const cardStyle: CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--surface-border)",
    borderRadius: 18,
    padding: 22,
    boxShadow: "var(--card-shadow)",
    transition: "all .25s ease",
  };

  return (
    <>
      <div style={gridStyle}>
        {cards.map((card) => (
          <div
            key={card.title}
            style={cardStyle}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = "translateY(-4px)";
              event.currentTarget.style.boxShadow = "var(--popup-shadow)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "translateY(0)";
              event.currentTarget.style.boxShadow = "var(--card-shadow)";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                  }}
                >
                  {card.title}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 26,
                    fontWeight: 800,
                    color: card.color,
                  }}
                >
                  {card.value}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  {card.subtitle}
                </div>
              </div>

              <div
                style={{
                  fontSize: 30,
                }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
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
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          <span>Collection Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>

        <div
          style={{
            width: "100%",
            height: 10,
            background: "var(--surface-border)",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "var(--success)",
              borderRadius: 999,
              transition: "width .3s ease",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          {formatCurrency(collected)} collected out of{" "}
          {formatCurrency(approvedAmount)}.
        </div>
      </div>
    </>
  );
}
