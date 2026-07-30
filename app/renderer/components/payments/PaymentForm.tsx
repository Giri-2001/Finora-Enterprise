import { useState } from "react";

import Button from "../ui/Button";

import type { PaymentMode, PaymentType } from "./types";

type PaymentFormData = {
  loanId: string;

  customerId: string;

  paymentDate: string;

  paymentType: PaymentType;

  amount: number;

  paymentMode: PaymentMode;

  remarks: string;
};

type PaymentFormProps = {
  onSubmit: (payment: PaymentFormData) => void;
};

export default function PaymentForm({ onSubmit }: PaymentFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [loanId, setLoanId] = useState("");

  const [customerId, setCustomerId] = useState("");

  const [paymentDate, setPaymentDate] = useState(today);

  const [paymentType, setPaymentType] = useState<PaymentType>("REGULAR");

  const [amount, setAmount] = useState("");

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");

  const [remarks, setRemarks] = useState("");

  const [error, setError] = useState("");

  function clearForm() {
    setLoanId("");

    setCustomerId("");

    setPaymentDate(today);

    setPaymentType("REGULAR");

    setAmount("");

    setPaymentMode("CASH");

    setRemarks("");

    setError("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");

    const paymentAmount = Number(amount || 0);

    if (!loanId) {
      setError("Loan ID is required");

      return;
    }

    if (!customerId) {
      setError("Customer ID is required");

      return;
    }

    if (paymentAmount <= 0) {
      setError("Payment amount must be greater than zero");

      return;
    }

    onSubmit({
      loanId,

      customerId,

      paymentDate,

      paymentType,

      amount: paymentAmount,

      paymentMode,

      remarks,
    });

    clearForm();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",

        flexDirection: "column",

        gap: 12,

        maxWidth: 500,
      }}
    >
      <input
        placeholder="Loan ID"
        value={loanId}
        onChange={(e) => setLoanId(e.target.value)}
      />

      <input
        placeholder="Customer ID"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
      />

      <input
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
      />

      <select
        value={paymentType}
        onChange={(e) => setPaymentType(e.target.value as PaymentType)}
      >
        <option value="REGULAR">Regular</option>

        <option value="ADVANCE">Advance</option>

        <option value="EARLY_CLOSURE">Early Closure</option>
      </select>

      <input
        type="number"
        placeholder="Payment Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <select
        value={paymentMode}
        onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
      >
        <option value="CASH">Cash</option>

        <option value="UPI">UPI</option>

        <option value="BANK_TRANSFER">Bank Transfer</option>

        <option value="CHEQUE">Cheque</option>
      </select>

      <textarea
        placeholder="Remarks"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
      />

      {error && (
        <div
          style={{
            color: "#dc2626",
          }}
        >
          {error}
        </div>
      )}

      <Button type="submit">Save Payment</Button>
    </form>
  );
}
