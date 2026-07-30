import type { ReactNode } from "react";

type ReportDashboardProps = {
  loanCount: number;

  collectionCount: number;

  paymentCount: number;

  customerCount: number;

  goldCount: number;

  lockerCount: number;

  children?: ReactNode;
};

export default function ReportDashboard({
  loanCount,

  collectionCount,

  paymentCount,

  customerCount,

  goldCount,

  lockerCount,

  children,
}: ReportDashboardProps) {
  const cards = [
    {
      title: "Loan Reports",

      value: loanCount,
    },

    {
      title: "Collection Reports",

      value: collectionCount,
    },

    {
      title: "Payment Reports",

      value: paymentCount,
    },

    {
      title: "Customer Reports",

      value: customerCount,
    },

    {
      title: "Gold Reports",

      value: goldCount,
    },

    {
      title: "Locker Reports",

      value: lockerCount,
    },
  ];

  return (
    <div>
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

      {children}
    </div>
  );
}
