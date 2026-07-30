import type { GoldBag, GoldLoan, GoldLocker, GoldOrnament } from "./types";

type GoldLoanDashboardProps = {
  lockers: GoldLocker[];

  bags: GoldBag[];

  goldLoans: GoldLoan[];

  ornaments: GoldOrnament[];
};

export default function GoldLoanDashboard({
  lockers,

  bags,

  goldLoans,

  ornaments,
}: GoldLoanDashboardProps) {
  const totalLockers = lockers.length;

  const occupiedLockers = lockers.filter(
    (locker) => locker.status === "OCCUPIED",
  ).length;

  const totalBags = bags.length;

  const activeLoans = goldLoans.filter(
    (loan) => loan.status === "ACTIVE",
  ).length;

  const releasedLoans = goldLoans.filter(
    (loan) => loan.status === "RELEASED",
  ).length;

  const cards = [
    {
      title: "Total Lockers",

      value: totalLockers,
    },

    {
      title: "Occupied Lockers",

      value: occupiedLockers,
    },

    {
      title: "Total Bags",

      value: totalBags,
    },

    {
      title: "Active Gold Loans",

      value: activeLoans,
    },

    {
      title: "Released Loans",

      value: releasedLoans,
    },

    {
      title: "Ornaments",

      value: ornaments.length,
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
