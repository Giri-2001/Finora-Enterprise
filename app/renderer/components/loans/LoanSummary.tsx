import type { Loan } from "./types";

type LoanSummaryProps = {
  loans: Loan[];
};

function safeNumber(value?: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value?: number): string {
  return `₹${safeNumber(value).toLocaleString("en-IN")}`;
}

export default function LoanSummary({ loans }: LoanSummaryProps) {
  const totalLoans = loans.length;

  const activeLoans = loans.filter((loan) => loan.status === "Active").length;

  const closedLoans = loans.filter((loan) => loan.status === "Closed").length;

  const pendingLoans = loans.filter((loan) => loan.status === "Pending").length;

  const defaultLoans = loans.filter((loan) => loan.status === "Default").length;

  const totalApproved = loans.reduce(
    (sum, loan) => sum + safeNumber(loan.approvedLoanAmount),
    0,
  );

  const totalCollected = loans.reduce(
    (sum, loan) => sum + safeNumber(loan.totalCollectedAmount),
    0,
  );

  const totalOutstanding = loans.reduce(
    (sum, loan) => sum + safeNumber(loan.outstandingAmount),
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
    <div className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      {cards.map((card) => (
        <div
          key={card.title}
          className="
            rounded-2xl
            border
            p-6
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-xl
          "
          style={{
            background: "var(--surface)",
            borderColor: "var(--surface-border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <p
            className="text-sm font-bold"
            style={{
              color: "var(--text-muted)",
            }}
          >
            {card.title}
          </p>

          <h2
            className="mt-3 text-3xl font-black"
            style={{
              color: "var(--finora-accent)",
            }}
          >
            {typeof card.value === "number"
              ? card.value.toLocaleString("en-IN")
              : card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}
