import type { Collection } from "./types";

type CollectionDashboardProps = {
  collections: Collection[];
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function CollectionDashboard({
  collections,
}: CollectionDashboardProps) {
  const totalCollections = collections.length;

  const totalInterest = collections.reduce(
    (sum, item) => sum + item.interestAmount,

    0,
  );

  const totalPrincipal = collections.reduce(
    (sum, item) => sum + item.principalAmount,

    0,
  );

  const totalPenalty = collections.reduce(
    (sum, item) => sum + item.penaltyAmount,

    0,
  );

  const totalAmount = collections.reduce(
    (sum, item) => sum + item.totalAmount,

    0,
  );

  const cards = [
    {
      title: "Total Collections",

      value: totalCollections,
    },

    {
      title: "Interest Collected",

      value: formatCurrency(totalInterest),
    },

    {
      title: "Principal Collected",

      value: formatCurrency(totalPrincipal),
    },

    {
      title: "Penalty Collected",

      value: formatCurrency(totalPenalty),
    },

    {
      title: "Total Amount",

      value: formatCurrency(totalAmount),
    },
  ];

  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",

        gap: 16,

        marginBottom: 24,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            background: "#ffffff",

            padding: 20,

            borderRadius: 12,

            border: "1px solid #e2e8f0",
          }}
        >
          <h4>{card.title}</h4>

          <h2>{card.value}</h2>
        </div>
      ))}
    </div>
  );
}
