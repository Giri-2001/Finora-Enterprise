import type { Loan } from "./types";

type LoanHistoryProps = {
  loan: Loan;
};

export default function LoanHistory({ loan }: LoanHistoryProps) {
  const history = [
    {
      title: "Loan Created",

      date: loan.createdAt,

      description: `Loan ${loan.finoraLoanId} created.`,
    },

    {
      title: "Collections",

      date: loan.lastCollectionDate ?? "-",

      description: `Total collected ₹${loan.totalCollectedAmount.toLocaleString(
        "en-IN",
      )}`,
    },

    {
      title: "Balance",

      date: loan.updatedAt,

      description: `Outstanding balance ₹${loan.outstandingAmount.toLocaleString(
        "en-IN",
      )}`,
    },

    {
      title: "Status",

      date: loan.updatedAt,

      description: `Loan status changed to ${loan.status}`,
    },
  ];

  return (
    <div
      style={{
        marginTop: 20,

        padding: 20,

        background: "#ffffff",

        borderRadius: 12,

        border: "1px solid #e2e8f0",
      }}
    >
      <h3>Loan Activity History</h3>

      <div>
        {history.map((item, index) => (
          <div
            key={index}
            style={{
              padding: 14,

              borderLeft: "3px solid #2563eb",

              marginBottom: 12,

              background: "#f8fafc",
            }}
          >
            <strong>{item.title}</strong>

            <p>{item.description}</p>

            <small>{item.date || "-"}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
