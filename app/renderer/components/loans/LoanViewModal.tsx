import type { Loan } from "./types";

import LoanDetails from "./LoanDetails";

import Button from "../ui/Button";

type LoanViewModalProps = {
  loan: Loan;

  onClose: () => void;
};

export default function LoanViewModal({
  loan,

  onClose,
}: LoanViewModalProps) {
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

        padding: 20,
      }}
    >
      <div
        style={{
          width: "90%",

          maxWidth: 900,

          maxHeight: "90vh",

          overflow: "auto",

          background: "#ffffff",

          borderRadius: 12,

          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            marginBottom: 20,
          }}
        >
          <h2>Loan Information</h2>

          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>

        <LoanDetails loan={loan} />
      </div>
    </div>
  );
}
