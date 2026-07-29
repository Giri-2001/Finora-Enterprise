import { useState } from "react";

import Button from "../ui/Button";

import type { CollectionType, PaymentMode } from "./types";

type CollectionFormData = {
  loanId: string;
  customerId: string;

  collectionDate: string;

  collectionType: CollectionType;

  interestAmount: number;
  principalAmount: number;
  penaltyAmount: number;

  totalAmount: number;

  paymentMode: PaymentMode;

  remarks: string;
};

type CollectionFormProps = {
  onSubmit: (collection: CollectionFormData) => void;
};

export default function CollectionForm({ onSubmit }: CollectionFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [loanId, setLoanId] = useState("");

  const [customerId, setCustomerId] = useState("");

  const [collectionDate, setCollectionDate] = useState(today);

  const [collectionType, setCollectionType] = useState<CollectionType>("BOTH");

  const [interestAmount, setInterestAmount] = useState("");

  const [principalAmount, setPrincipalAmount] = useState("");

  const [penaltyAmount, setPenaltyAmount] = useState("");

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");

  const [remarks, setRemarks] = useState("");

  const [error, setError] = useState("");

  function clearForm() {
    setLoanId("");
    setCustomerId("");

    setCollectionDate(today);

    setCollectionType("BOTH");

    setInterestAmount("");
    setPrincipalAmount("");
    setPenaltyAmount("");

    setPaymentMode("CASH");

    setRemarks("");

    setError("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");

    const totalAmount =
      Number(interestAmount || 0) +
      Number(principalAmount || 0) +
      Number(penaltyAmount || 0);

    if (!loanId) {
      setError("Loan ID is required");
      return;
    }

    if (!customerId) {
      setError("Customer ID is required");
      return;
    }

    if (totalAmount <= 0) {
      setError("Collection amount must be greater than zero");
      return;
    }

    onSubmit({
      loanId,
      customerId,

      collectionDate,

      collectionType,

      interestAmount: Number(interestAmount || 0),

      principalAmount: Number(principalAmount || 0),

      penaltyAmount: Number(penaltyAmount || 0),

      totalAmount,

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
        max={today}
        value={collectionDate}
        onChange={(e) => setCollectionDate(e.target.value)}
      />

      <select
        value={collectionType}
        onChange={(e) => setCollectionType(e.target.value as CollectionType)}
      >
        <option value="INTEREST">Interest</option>

        <option value="PRINCIPAL">Principal</option>

        <option value="BOTH">Both</option>

        <option value="PENALTY">Penalty</option>
      </select>

      <input
        type="number"
        placeholder="Interest Amount"
        value={interestAmount}
        onChange={(e) => setInterestAmount(e.target.value)}
      />

      <input
        type="number"
        placeholder="Principal Amount"
        value={principalAmount}
        onChange={(e) => setPrincipalAmount(e.target.value)}
      />

      <input
        type="number"
        placeholder="Penalty Amount"
        value={penaltyAmount}
        onChange={(e) => setPenaltyAmount(e.target.value)}
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

      <Button type="submit">Save Collection</Button>
    </form>
  );
}
