import type { Loan } from "../loans/types";

type CollectionSummaryProps = {
  loan?: Loan | null;

  collectedAmount?: number;
};

export default function CollectionSummary({
  loan,
  collectedAmount = 0,
}: CollectionSummaryProps) {
  if (!loan) {
    return (
      <div
        style={{
          marginTop: 20,
          padding: 20,
          background: "#1e293b",
          borderRadius: 12,
        }}
      >
        Select a loan to view details.
      </div>
    );
  }

  const pendingAmount = Math.max(loan.approvedLoanAmount - collectedAmount, 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        gap: 16,
        marginTop: 20,
      }}
    >
      <div style={cardStyle}>
        <h4>Loan Amount</h4>

        <p>₹{loan.approvedLoanAmount.toLocaleString("en-IN")}</p>
      </div>

      <div style={cardStyle}>
        <h4>Collected</h4>

        <p>₹{collectedAmount.toLocaleString("en-IN")}</p>
      </div>

      <div style={cardStyle}>
        <h4>Pending Balance</h4>

        <p>₹{pendingAmount.toLocaleString("en-IN")}</p>
      </div>

      <div style={cardStyle}>
        <h4>Collection Type</h4>

        <p>{loan.collectionType}</p>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#1e293b",
  padding: "16px",
  borderRadius: "10px",
};
