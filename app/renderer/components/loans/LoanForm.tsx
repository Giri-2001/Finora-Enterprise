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

  discountAmount: number;

  interestType: InterestType;

  interestValue: number;

  collectionType: CollectionType;

  duration: number;

  calculatedCollectionAmount: number;

  collectionAmount: number;

  startDate: string;

  remarks: string;
};

type LoanFormProps = {
  customers: Customer[];

  onSubmit: (loan: LoanFormData) => void;
};

export default function LoanForm({ customers, onSubmit }: LoanFormProps) {
  const [customerId, setCustomerId] = useState("");

  const [oldLoanNumber, setOldLoanNumber] = useState("");

  const [lockerNumber, setLockerNumber] = useState("");

  const [bagNumber, setBagNumber] = useState("");

  const [approvedLoanAmount, setApprovedLoanAmount] = useState("");

  const [deductionAmount, setDeductionAmount] = useState("");

  const [discountAmount, setDiscountAmount] = useState("");

  const [receivedAmount, setReceivedAmount] = useState("");

  const [interestType, setInterestType] = useState<InterestType>("Percentage");

  const [interestValue, setInterestValue] = useState("");

  const [collectionType, setCollectionType] =
    useState<CollectionType>("Monthly");

  const [duration, setDuration] = useState("");

  const [collectionAmount, setCollectionAmount] = useState("");

  const [startDate, setStartDate] = useState("");

  const [remarks, setRemarks] = useState("");

  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

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

  useEffect(() => {
    if (calculatedCollectionAmount <= 0) {
      setCollectionAmount("");

      return;
    }

    setCollectionAmount(calculatedCollectionAmount.toFixed(2));
  }, [calculatedCollectionAmount]);

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

    setDiscountAmount("");

    setReceivedAmount("");

    setInterestType("Percentage");

    setInterestValue("");

    setCollectionType("Monthly");

    setDuration("");

    setCollectionAmount("");

    setStartDate("");

    setRemarks("");

    setError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const approved = Number(approvedLoanAmount);

    const deduction = Number(deductionAmount || 0);

    const discount = Number(discountAmount || 0);

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

    if (deduction < 0 || deduction > approved) {
      setError("Invalid deduction amount.");

      return;
    }

    if (discount < 0 || discount > approved) {
      setError("Invalid discount amount.");

      return;
    }

    if (interest <= 0) {
      setError("Enter valid interest value.");

      return;
    }

    if (loanDuration <= 0) {
      setError("Enter valid duration.");

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

      receivedAmount: Number(receivedAmount),

      deductionAmount: deduction,

      discountAmount: discount,

      interestType,

      interestValue: interest,

      collectionType,

      duration: loanDuration,

      calculatedCollectionAmount,

      collectionAmount: Number(collectionAmount),

      startDate,

      remarks: remarks.trim(),
    });

    clearForm();

    alert("Loan created successfully.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 900,

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
      <h2>Create New Loan</h2>

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
              {customer.customerId}
              {" - "}
              {customer.name}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h3>📦 Loan Details</h3>

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
      </section>

      <section>
        <h3>💰 Financial Details</h3>

        <input
          placeholder="Approved Amount"
          value={approvedLoanAmount}
          onChange={(e) => setApprovedLoanAmount(onlyNumbers(e.target.value))}
        />

        <input
          placeholder="Deduction Amount"
          value={deductionAmount}
          onChange={(e) => setDeductionAmount(onlyNumbers(e.target.value))}
        />

        <input
          placeholder="Discount Amount"
          value={discountAmount}
          onChange={(e) => setDiscountAmount(onlyNumbers(e.target.value))}
        />

        <input readOnly value={receivedAmount} />
      </section>

      <section>
        <h3>📈 Interest Details</h3>

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
          placeholder="Interest Value"
          value={interestValue}
          onChange={(e) => setInterestValue(onlyNumbers(e.target.value))}
        />
      </section>

      <section>
        <h3>📅 Collection Details</h3>

        <select
          value={collectionType}
          onChange={(e) => setCollectionType(e.target.value as CollectionType)}
        >
          <option value="Daily">Daily</option>

          <option value="Weekly">Weekly</option>

          <option value="Monthly">Monthly</option>
        </select>

        <input
          placeholder="Duration"
          value={duration}
          onChange={(e) => setDuration(onlyNumbers(e.target.value))}
        />

        <input
          readOnly
          value={calculatedCollectionAmount}
          placeholder="Calculated Collection"
        />

        <input
          value={collectionAmount}
          onChange={(e) => setCollectionAmount(onlyNumbers(e.target.value))}
          placeholder="Collection Amount"
        />
      </section>

      <section>
        <h3>📝 Remarks</h3>

        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </section>

      {error && (
        <div
          style={{
            color: "red",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <Button type="button" onClick={clearForm}>
          Clear
        </Button>

        <Button type="submit">Create Loan</Button>
      </div>
    </form>
  );
}
