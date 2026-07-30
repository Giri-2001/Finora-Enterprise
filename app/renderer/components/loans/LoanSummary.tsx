import type { Loan } from "./types";

type LoanSummaryProps = {
  loans: Loan[];
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function LoanSummary({ loans }: LoanSummaryProps) {
  const totalLoans = loans.length;

  const activeLoans = loans.filter((loan) => loan.status === "Active").length;

  const closedLoans = loans.filter((loan) => loan.status === "Closed").length;

  const pendingLoans = loans.filter((loan) => loan.status === "Pending").length;

  const defaultLoans = loans.filter((loan) => loan.status === "Default").length;

  const totalApproved = loans.reduce(
    (sum, loan) => sum + loan.approvedLoanAmount,

    0,
  );

  const totalCollected = loans.reduce(
    (sum, loan) => sum + loan.totalCollectedAmount,

    0,
  );

  const totalOutstanding = loans.reduce(
    (sum, loan) => sum + loan.outstandingAmount,

    0,
  );

  const cards = [
    {
      title: "Total Loans",

      value: totalLoans,
    },

    {
      title: "Active Loans",

      value: activeLoans,
    },

    {
      title: "Closed Loans",

      value: closedLoans,
    },

    {
      title: "Pending Loans",

      value: pendingLoans,
    },

    {
      title: "Default Loans",

      value: defaultLoans,
    },

    {
      title: "Approved Amount",

      value: formatCurrency(totalApproved),
    },

    {
      title: "Collected Amount",

      value: formatCurrency(totalCollected),
    },

    {
      title: "Outstanding Amount",

      value: formatCurrency(totalOutstanding),
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
            padding: 20,

            borderRadius: 12,

            background: "#ffffff",

            border: "1px solid #e2e8f0",

            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <p
            style={{
              margin: 0,

              color: "#64748b",
            }}
          >
            {card.title}
          </p>

          <h2>{card.value}</h2>
        </div>
      ))}
    </div>
  );
}
