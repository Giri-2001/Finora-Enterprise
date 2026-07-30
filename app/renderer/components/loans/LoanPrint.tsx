import type { Loan } from "./types";

type LoanPrintProps = {
  loan: Loan;
};

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function LoanPrint({ loan }: LoanPrintProps) {
  function printLoan() {
    window.print();
  }

  return (
    <div
      style={{
        padding: 20,

        background: "#ffffff",

        borderRadius: 12,

        border: "1px solid #e2e8f0",
      }}
    >
      <button
        type="button"
        onClick={printLoan}
        style={{
          marginBottom: 20,

          padding: "8px 16px",

          borderRadius: 6,

          border: "none",

          cursor: "pointer",
        }}
      >
        Print Loan
      </button>

      <h2>FINORA Loan Statement</h2>

      <hr />

      <p>
        <strong>FINORA Loan ID:</strong> {loan.finoraLoanId}
      </p>

      <p>
        <strong>Customer ID:</strong> {loan.customerId}
      </p>

      <p>
        <strong>Old Loan Number:</strong> {loan.oldLoanNumber || "-"}
      </p>

      <p>
        <strong>Approved Amount:</strong>{" "}
        {formatCurrency(loan.approvedLoanAmount)}
      </p>

      <p>
        <strong>Received Amount:</strong> {formatCurrency(loan.receivedAmount)}
      </p>

      <p>
        <strong>Total Collected:</strong>{" "}
        {formatCurrency(loan.totalCollectedAmount)}
      </p>

      <p>
        <strong>Outstanding:</strong> {formatCurrency(loan.outstandingAmount)}
      </p>

      <p>
        <strong>Interest:</strong> {loan.interestValue} {loan.interestType}
      </p>

      <p>
        <strong>Collection:</strong> {loan.collectionType}
      </p>

      <p>
        <strong>Status:</strong> {loan.status}
      </p>

      <p>
        <strong>Start Date:</strong> {loan.startDate}
      </p>

      <p>
        <strong>Remarks:</strong> {loan.remarks || "-"}
      </p>
    </div>
  );
}
