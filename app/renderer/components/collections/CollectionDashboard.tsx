import type { CSSProperties } from "react";

import type { Collection } from "./types";

type CollectionDashboardProps = {
  collections: Collection[];
};

function safeNumber(value?: number): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function formatCurrency(value?: number): string {
  return `₹${safeNumber(value).toLocaleString("en-IN")}`;
}

export default function CollectionDashboard({
  collections,
}: CollectionDashboardProps) {
  const totalCollections = collections.length;

  const totalInterest = collections.reduce(
    (sum, item) => sum + safeNumber(item.interestAmount),
    0,
  );

  const totalPrincipal = collections.reduce(
    (sum, item) => sum + safeNumber(item.principalAmount),
    0,
  );

  const totalPenalty = collections.reduce(
    (sum, item) => sum + safeNumber(item.penaltyAmount),
    0,
  );

  const totalAmount = collections.reduce(
    (sum, item) => sum + safeNumber(item.totalAmount),
    0,
  );

  const averageCollection =
    totalCollections > 0 ? totalAmount / totalCollections : 0;

  const completedCollections = collections.filter(
    (item) => item.status === "COMPLETED",
  ).length;

  const cards = [
    {
      title: "Total Collections",
      value: totalCollections.toLocaleString("en-IN"),
      subtitle: "Recorded entries",
      color: "var(--finora-accent)",
      icon: "📑",
    },
    {
      title: "Interest",
      value: formatCurrency(totalInterest),
      subtitle: "Interest received",
      color: "var(--success)",
      icon: "💰",
    },
    {
      title: "Principal",
      value: formatCurrency(totalPrincipal),
      subtitle: "Principal collected",
      color: "var(--finora-accent)",
      icon: "🏦",
    },
    {
      title: "Penalty",
      value: formatCurrency(totalPenalty),
      subtitle: "Penalty charges",
      color: "var(--danger)",
      icon: "⚠️",
    },
    {
      title: "Total Amount",
      value: formatCurrency(totalAmount),
      subtitle: "Overall collections",
      color: "var(--warning)",
      icon: "💵",
    },
    {
      title: "Average",
      value: formatCurrency(averageCollection),
      subtitle: "Per collection",
      color: "var(--info, #3b82f6)",
      icon: "📊",
    },
    {
      title: "Completed",
      value: completedCollections.toLocaleString("en-IN"),
      subtitle: "Successful collections",
      color: "var(--success)",
      icon: "✅",
    },
  ];

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 18,
    marginBottom: 24,
  };

  const cardStyle: CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--surface-border)",
    borderRadius: 18,
    padding: 22,
    boxShadow: "var(--card-shadow)",
    transition: "all .25s ease",
    cursor: "default",
  };

  return (
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
              alignItems: "center",
              marginBottom: 18,
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
                  fontSize: 30,
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
                fontSize: 32,
                opacity: 0.9,
              }}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
