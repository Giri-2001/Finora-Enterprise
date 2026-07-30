import Button from "../ui/Button";

import type { Loan } from "./types";

type LoanCloseModalProps = {
  loan: Loan;

  onClose: () => void;

  onConfirm: (loan: Loan) => void;
};

export default function LoanCloseModal({
  loan,

  onClose,

  onConfirm,
}: LoanCloseModalProps) {
  return (
    <div
      style={{
        position: "fixed",

        inset: 0,

        background: "rgba(0,0,0,0.5)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 420,

          background: "#ffffff",

          padding: 24,

          borderRadius: 12,
        }}
      >
        <h2>Close Loan</h2>

        <p>Are you sure you want to close this loan?</p>

        <div
          style={{
            marginTop: 20,

            padding: 16,

            background: "#f1f5f9",

            borderRadius: 8,
          }}
        >
          <p>
            <strong>FINORA ID:</strong> {loan.finoraLoanId}
          </p>

          <p>
            <strong>Customer:</strong> {loan.customerId}
          </p>

          <p>
            <strong>Outstanding:</strong> ₹
            {loan.outstandingAmount.toLocaleString("en-IN")}
          </p>
        </div>

        {loan.outstandingAmount > 0 && (
          <p
            style={{
              color: "#dc2626",

              marginTop: 16,
            }}
          >
            Warning: Outstanding balance exists.
          </p>
        )}

        <div
          style={{
            display: "flex",

            gap: 12,

            marginTop: 24,

            justifyContent: "flex-end",
          }}
        >
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button type="button" onClick={() => onConfirm(loan)}>
            Close Loan
          </Button>
        </div>
      </div>
    </div>
  );
}
