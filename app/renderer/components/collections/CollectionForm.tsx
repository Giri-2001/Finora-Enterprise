import { useMemo, useState } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";

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

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 110,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--text)",
  fontSize: 14,
  resize: "vertical",
  outline: "none",
  fontFamily: "inherit",
};

export default function CollectionForm({
  onSubmit,
}: CollectionFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [loanId, setLoanId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [collectionDate, setCollectionDate] = useState(today);

  const [collectionType, setCollectionType] =
    useState<CollectionType>("BOTH");

  const [interestAmount, setInterestAmount] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [penaltyAmount, setPenaltyAmount] = useState("");

  const [paymentMode, setPaymentMode] =
    useState<PaymentMode>("CASH");

  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const interest = Number(interestAmount) || 0;
  const principal = Number(principalAmount) || 0;
  const penalty = Number(penaltyAmount) || 0;

  const totalAmount = useMemo(
    () => interest + principal + penalty,
    [interest, principal, penalty],
  );

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!loanId.trim()) {
      setError("Loan ID is required.");
      return;
    }

    if (!customerId.trim()) {
      setError("Customer ID is required.");
      return;
    }

    if (totalAmount <= 0) {
      setError("Collection amount must be greater than zero.");
      return;
    }

    onSubmit({
      loanId: loanId.trim(),
      customerId: customerId.trim(),
      collectionDate,
      collectionType,
      interestAmount: interest,
      principalAmount: principal,
      penaltyAmount: penalty,
      totalAmount,
      paymentMode,
      remarks: remarks.trim(),
    });

    clearForm();
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 18,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 16,
        }}
      >
        <Input
          label="Loan ID"
          placeholder="Enter Loan ID"
          value={loanId}
          onChange={(e) => setLoanId(e.target.value)}
        />

        <Input
          label="Customer ID"
          placeholder="Enter Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />

        <Input
          label="Collection Date"
          type="date"
          max={today}
          value={collectionDate}
          onChange={(e) => setCollectionDate(e.target.value)}
        />

        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontWeight: 600,
              color: "var(--text-muted)",
            }}
          >
            Collection Type
          </label>

          <select
            value={collectionType}
            onChange={(e) =>
              setCollectionType(e.target.value as CollectionType)
            }
            style={selectStyle}
          >
            <option value="INTEREST">Interest</option>
            <option value="PRINCIPAL">Principal</option>
            <option value="BOTH">Both</option>
            <option value="PENALTY">Penalty</option>
          </select>
        </div>

        <Input
          label="Interest Amount"
          type="number"
          placeholder="0"
          value={interestAmount}
          onChange={(e) => setInterestAmount(e.target.value)}
        />

        <Input
          label="Principal Amount"
          type="number"
          placeholder="0"
          value={principalAmount}
          onChange={(e) => setPrincipalAmount(e.target.value)}
        />

        <Input
          label="Penalty Amount"
          type="number"
          placeholder="0"
          value={penaltyAmount}
          onChange={(e) => setPenaltyAmount(e.target.value)}
        />

        <div>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontWeight: 600,
              color: "var(--text-muted)",
            }}
          >
            Payment Mode
          </label>

          <select
            value={paymentMode}
            onChange={(e) =>
              setPaymentMode(e.target.value as PaymentMode)
            }
            style={selectStyle}
          >
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">
              Bank Transfer
            </option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
      </div>

      <div
        style={{
          padding: 18,
          borderRadius: 14,
          border: "1px solid var(--surface-border)",
          background: "var(--surface)",
        }}
      >
        <strong style={{ color: "var(--text)" }}>
          Total Collection
        </strong>

        <div
          style={{
            marginTop: 8,
            fontSize: 28,
            fontWeight: 800,
            color: "var(--finora-accent)",
          }}
        >
          ₹{totalAmount.toLocaleString("en-IN")}
        </div>
      </div>

      <div>
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontWeight: 600,
            color: "var(--text-muted)",
          }}
        >
          Remarks
        </label>

        <textarea
          placeholder="Optional remarks..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          style={textareaStyle}
        />
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button type="submit" size="large">
          Save Collection
        </Button>
      </div>
    </form>
  );
}

