import { useState } from "react";

import type { Loan } from "./types";

import Button from "../ui/Button";

type LoanEditModalProps = {
  loan: Loan;

  onClose: () => void;

  onSave: (loan: Loan) => void;
};

export default function LoanEditModal({
  loan,

  onClose,

  onSave,
}: LoanEditModalProps) {
  const [approvedAmount, setApprovedAmount] = useState(
    String(loan.approvedLoanAmount),
  );

  const [deductionAmount, setDeductionAmount] = useState(
    String(loan.deductionAmount),
  );

  const [discountAmount, setDiscountAmount] = useState(
    String(loan.discountAmount),
  );

  const [status, setStatus] = useState(loan.status);

  const [remarks, setRemarks] = useState(loan.remarks);

  function handleSave() {
    const updatedLoan: Loan = {
      ...loan,

      approvedLoanAmount: Number(approvedAmount),

      deductionAmount: Number(deductionAmount),

      discountAmount: Number(discountAmount),

      outstandingAmount: Math.max(
        Number(approvedAmount) -
          loan.totalCollectedAmount -
          Number(discountAmount),

        0,
      ),

      status,

      remarks,

      updatedAt: new Date().toISOString(),
    };

    onSave(updatedLoan);
  }

  return (
    <div
      style={{
        position: "fixed",

        inset: 0,

        background: "rgba(0,0,0,0.5)",

        display: "flex",

        justifyContent: "center",

        alignItems: "center",

        zIndex: 1000,

        padding: 20,
      }}
    >
      <div
        style={{
          width: 500,

          background: "#ffffff",

          padding: 24,

          borderRadius: 12,
        }}
      >
        <h2>Edit Loan</h2>

        <p>FINORA ID: {loan.finoraLoanId}</p>

        <input
          value={approvedAmount}
          onChange={(e) => setApprovedAmount(e.target.value)}
          placeholder="Approved Amount"
        />

        <input
          value={deductionAmount}
          onChange={(e) => setDeductionAmount(e.target.value)}
          placeholder="Deduction Amount"
        />

        <input
          value={discountAmount}
          onChange={(e) => setDiscountAmount(e.target.value)}
          placeholder="Discount Amount"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Loan["status"])}
        >
          <option value="Active">Active</option>

          <option value="Pending">Pending</option>

          <option value="Default">Default</option>

          <option value="Closed">Closed</option>
        </select>

        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Remarks"
        />

        <div
          style={{
            display: "flex",

            gap: 10,

            marginTop: 20,
          }}
        >
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
