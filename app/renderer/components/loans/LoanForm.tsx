import { useEffect, useMemo, useState } from "react";

import type { Customer } from "../customers/types";
import Button from "../ui/Button";
import type { CollectionType, InterestType } from "./types";

type LoanFormData = {
  customerId: string;

  oldLoanNumber: string;
  lockerNumber: string;
  bagNumber: string;

  approvedLoanAmount: number;
  receivedAmount: number;
  deductionAmount: number;

  interestType: InterestType;
  interestValue: number;

  collectionType: CollectionType;
  duration: number;

  calculatedCollectionAmount: number;
  collectionAmount: number;

  startDate: string;
};

type LoanFormProps = {
  customers: Customer[];
  onSubmit: (loan: LoanFormData) => void;
};

export default function LoanForm({ customers, onSubmit }: LoanFormProps) {
  // ==========================================
  // Customer
  // ==========================================

  const [customerId, setCustomerId] = useState("");

  // ==========================================
  // Loan Details
  // ==========================================

  const [oldLoanNumber, setOldLoanNumber] = useState("");

  const [lockerNumber, setLockerNumber] = useState("");

  const [bagNumber, setBagNumber] = useState("");

  // ==========================================
  // Amounts
  // ==========================================

  const [approvedLoanAmount, setApprovedLoanAmount] = useState("");

  const [deductionAmount, setDeductionAmount] = useState("");

  const [receivedAmount, setReceivedAmount] = useState("");

  // ==========================================
  // Interest
  // ==========================================

  const [interestType, setInterestType] = useState<InterestType>("Percentage");

  const [interestValue, setInterestValue] = useState("");

  // ==========================================
  // Collection
  // ==========================================

  const [collectionType, setCollectionType] =
    useState<CollectionType>("Monthly");

  const [duration, setDuration] = useState("");

  const [collectionAmount, setCollectionAmount] = useState("");

  // ==========================================
  // Date
  // ==========================================

  const [startDate, setStartDate] = useState("");

  // ==========================================
  // Error
  // ==========================================

  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // ==========================================
  // Auto Received Amount
  // ==========================================

  useEffect(() => {
    const approved = Number(approvedLoanAmount || 0);

    const deduction = Number(deductionAmount || 0);

    if (approved <= 0) {
      setReceivedAmount("");
      return;
    }

    const value = approved - deduction;

    setReceivedAmount(String(value > 0 ? value : 0));
  }, [approvedLoanAmount, deductionAmount]);

  // ==========================================
  // Auto Collection Calculation
  // ==========================================

  const calculatedCollectionAmount = useMemo(() => {
    const amount = Number(approvedLoanAmount);

    const interest = Number(interestValue);

    const months = Number(duration);

    if (amount <= 0 || interest <= 0 || months <= 0) {
      return 0;
    }

    let totalInterest = 0;

    switch (interestType) {
      case "Percentage":
        totalInterest = (amount * interest * months) / 100;
        break;

      case "Rupees":
        totalInterest = interest * months;
        break;

      case "Paisa":
        totalInterest = (amount * interest * months) / 100;
        break;

      case "Fixed":
        totalInterest = interest;
        break;
    }

    const totalPayable = amount + totalInterest;

    let installments = months;

    switch (collectionType) {
      case "Daily":
        installments = months * 30;
        break;

      case "Weekly":
        installments = months * 4;
        break;

      case "Monthly":
        installments = months;
        break;
    }

    return Number((totalPayable / installments).toFixed(2));
  }, [
    approvedLoanAmount,
    interestValue,
    duration,
    interestType,
    collectionType,
  ]);

  // ==========================================
  // Sync Editable Collection Amount
  // ==========================================

  useEffect(() => {
    if (calculatedCollectionAmount <= 0) {
      setCollectionAmount("");
      return;
    }

    setCollectionAmount(calculatedCollectionAmount.toFixed(2));
  }, [calculatedCollectionAmount]);

  // ==========================================
  // Helpers
  // ==========================================

  function onlyNumbers(value: string) {
    return value.replace(/[^0-9.]/g, "");
  }

  function clearForm() {
    setCustomerId("");

    setOldLoanNumber("");
    setLockerNumber("");
    setBagNumber("");

    setApprovedLoanAmount("");
    setDeductionAmount("");
    setReceivedAmount("");

    setInterestType("Percentage");
    setInterestValue("");

    setCollectionType("Monthly");
    setDuration("");

    setCollectionAmount("");

    setStartDate("");

    setError("");
  }

  // ==========================================
  // Submit Validation
  // ==========================================

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const approved = Number(approvedLoanAmount);

    const deduction = Number(deductionAmount);

    const interest = Number(interestValue);

    const loanDuration = Number(duration);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (approved <= 0) {
      setError("Approved amount should be greater than zero.");
      return;
    }

    if (deduction < 0) {
      setError("Deduction cannot be negative.");
      return;
    }

    if (deduction > approved) {
      setError("Deduction cannot exceed approved amount.");
      return;
    }

    if (interest <= 0) {
      setError("Enter a valid interest value.");
      return;
    }

    if (loanDuration <= 0) {
      setError("Enter a valid duration.");
      return;
    }

    if (!startDate) {
      setError("Loan date is required.");
      return;
    }

    if (startDate > today) {
      setError("Future dates are not allowed.");
      return;
    }

    onSubmit({
      customerId,

      oldLoanNumber: oldLoanNumber.trim(),

      lockerNumber: lockerNumber.trim(),

      bagNumber: bagNumber.trim(),

      approvedLoanAmount: approved,

      deductionAmount: deduction,

      receivedAmount: Number(receivedAmount),

      interestType,

      interestValue: interest,

      collectionType,

      duration: loanDuration,

      calculatedCollectionAmount,

      collectionAmount: Number(collectionAmount),

      startDate,
    });

    clearForm();

    alert("Loan created successfully.");
  }

  const canSubmit =
    customerId !== "" &&
    Number(approvedLoanAmount) > 0 &&
    Number(interestValue) > 0 &&
    Number(duration) > 0 &&
    startDate !== "";

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 850,
        margin: "20px auto",
        padding: 24,
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <h2
        style={{
          margin: 0,
          color: "#1e293b",
        }}
      >
        Create New Loan
      </h2>

      {/* Customer */}

      <section>
        <h3>👤 Customer Details</h3>

        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
          }}
        >
          <option value="">Select Customer *</option>

          {customers.map((customer) => (
            <option key={customer.id} value={customer.customerId}>
              {customer.customerId} - {customer.name}
            </option>
          ))}
        </select>
      </section>

      {/* Loan Details */}

      <section>
        <h3>📦 Loan Details</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 14,
          }}
        >
          <input
            placeholder="Old Loan Number"
            value={oldLoanNumber}
            onChange={(e) => setOldLoanNumber(e.target.value)}
          />

          <input
            placeholder="Locker Number"
            value={lockerNumber}
            onChange={(e) => setLockerNumber(e.target.value)}
          />

          <input
            placeholder="Bag Number"
            value={bagNumber}
            onChange={(e) => setBagNumber(e.target.value)}
          />

          <input
            type="date"
            max={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </section>

      {/* Financial */}

      <section>
        <h3>💰 Financial Details</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 14,
          }}
        >
          <input
            type="text"
            placeholder="Approved Amount"
            value={approvedLoanAmount}
            onChange={(e) => setApprovedLoanAmount(onlyNumbers(e.target.value))}
          />

          <input
            type="text"
            placeholder="Deduction Amount"
            value={deductionAmount}
            onChange={(e) => setDeductionAmount(onlyNumbers(e.target.value))}
          />

          <input
            type="text"
            placeholder="Received Amount"
            value={receivedAmount}
            readOnly
            style={{
              background: "#f3f4f6",
            }}
          />
        </div>
      </section>

      {/* Interest */}

      <section>
        <h3>📈 Interest Details</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
          }}
        >
          <select
            value={interestType}
            onChange={(e) => setInterestType(e.target.value as InterestType)}
          >
            <option value="Percentage">Percentage</option>

            <option value="Rupees">Rupees</option>

            <option value="Paisa">Paisa</option>

            <option value="Fixed">Fixed</option>
          </select>

          <input
            type="text"
            placeholder="Interest Value"
            value={interestValue}
            onChange={(e) => setInterestValue(onlyNumbers(e.target.value))}
          />
        </div>
      </section>

      {/* Collection */}

      <section>
        <h3>📅 Collection Details</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 14,
          }}
        >
          <select
            value={collectionType}
            onChange={(e) =>
              setCollectionType(e.target.value as CollectionType)
            }
          >
            <option value="Daily">Daily</option>

            <option value="Weekly">Weekly</option>

            <option value="Monthly">Monthly</option>
          </select>

          <input
            type="text"
            placeholder="Duration"
            value={duration}
            onChange={(e) => setDuration(onlyNumbers(e.target.value))}
          />

          <input
            type="text"
            readOnly
            value={calculatedCollectionAmount}
            placeholder="Auto Collection"
            style={{
              background: "#f3f4f6",
            }}
          />

          <input
            type="text"
            value={collectionAmount}
            placeholder="Collection Amount"
            onChange={(e) => setCollectionAmount(onlyNumbers(e.target.value))}
          />
        </div>
      </section>

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#fee2e2",
            color: "#b91c1c",
            border: "1px solid #fecaca",
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          marginTop: 8,
        }}
      >
        <Button type="button" onClick={clearForm}>
          Clear
        </Button>

        <Button type="submit" onClick={() => {}}>
          Create Loan
        </Button>
      </div>

      <div
        style={{
          marginTop: 10,
          padding: 14,
          borderRadius: 8,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          color: "#475569",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        <strong>Summary</strong>

        <div>Approved Amount : {approvedLoanAmount || "0"}</div>

        <div>Deduction : {deductionAmount || "0"}</div>

        <div>Customer Receives : {receivedAmount || "0"}</div>

        <div>
          Interest : {interestValue || "0"} {interestType}
        </div>

        <div>Collection : {collectionType}</div>

        <div>Duration : {duration || "0"}</div>

        <div>Installment : {collectionAmount || "0"}</div>
      </div>
    </form>
  );
}
