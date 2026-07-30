import { useState } from "react";

import type { InterestResult, InterestType } from "./types";

import { calculateInterest } from "../../utils/interestCalculator";

export default function InterestCalculator() {
  const [amount, setAmount] = useState(0);

  const [duration, setDuration] = useState(1);

  const [interestType, setInterestType] = useState<InterestType>("Percentage");

  const [interestValue, setInterestValue] = useState(0);

  const [result, setResult] = useState<InterestResult | null>(null);

  function handleCalculate() {
    const calculation = calculateInterest(
      amount,

      duration,

      {
        interestType,

        interestValue,

        calculationType: "Flat",
      },
    );

    setResult(calculation);
  }

  return (
    <div
      style={{
        display: "grid",

        gap: 12,

        padding: 20,

        background: "#ffffff",

        borderRadius: 12,

        border: "1px solid #e2e8f0",
      }}
    >
      <h2>Interest Calculator</h2>

      <input
        type="number"
        placeholder="Loan Amount"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

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
        type="number"
        placeholder="Interest Value"
        value={interestValue}
        onChange={(e) => setInterestValue(Number(e.target.value))}
      />

      <input
        type="number"
        placeholder="Duration"
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
      />

      <button
        type="button"
        onClick={handleCalculate}
        style={{
          padding: "10px",

          borderRadius: 8,

          cursor: "pointer",
        }}
      >
        Calculate Interest
      </button>

      {result && (
        <div
          style={{
            marginTop: 20,

            padding: 16,

            background: "#f8fafc",

            borderRadius: 8,
          }}
        >
          <p>
            <strong>Interest Amount:</strong>

            {" ₹"}

            {result.interestAmount.toLocaleString("en-IN")}
          </p>

          <p>
            <strong>Total Payable:</strong>

            {" ₹"}

            {result.totalPayableAmount.toLocaleString("en-IN")}
          </p>

          <p>
            <strong>Installment:</strong>

            {" ₹"}

            {result.installmentAmount.toLocaleString("en-IN")}
          </p>
        </div>
      )}
    </div>
  );
}
