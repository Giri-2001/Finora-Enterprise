import type { InterestHistory as InterestHistoryType } from "./types";

type InterestHistoryProps = {
  history: InterestHistoryType[];
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function InterestHistory({ history }: InterestHistoryProps) {
  if (history.length === 0) {
    return (
      <div
        style={{
          padding: 20,

          background: "#f8fafc",

          borderRadius: 10,

          textAlign: "center",
        }}
      >
        No interest history available.
      </div>
    );
  }

  return (
    <div>
      <h2>Interest History</h2>

      <div
        style={{
          display: "grid",

          gap: 12,
        }}
      >
        {history.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 16,

              background: "#ffffff",

              border: "1px solid #e2e8f0",

              borderRadius: 10,
            }}
          >
            <p>
              <strong>Loan ID:</strong> {item.loanId}
            </p>

            <p>
              <strong>Interest:</strong> {item.interestValue}{" "}
              {item.interestType}
            </p>

            <p>
              <strong>Principal:</strong> {formatCurrency(item.principalAmount)}
            </p>

            <p>
              <strong>Interest Amount:</strong>{" "}
              {formatCurrency(item.interestAmount)}
            </p>

            <p>
              <strong>Total Payable:</strong>{" "}
              {formatCurrency(item.totalPayableAmount)}
            </p>

            <p>
              <strong>Duration:</strong> {item.duration}
            </p>

            <small>{item.createdAt}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
