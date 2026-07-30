import { useState } from "react";

import Button from "../ui/Button";

import type { GoldBag } from "./types";

type BagManagerProps = {
  bags: GoldBag[];

  onAdd: (bag: GoldBag) => void;

  onUpdate: (bag: GoldBag) => void;
};

export default function BagManager({
  bags,

  onAdd,

  onUpdate,
}: BagManagerProps) {
  const [bagNumber, setBagNumber] = useState("");

  const [lockerNumber, setLockerNumber] = useState("");

  const [loanId, setLoanId] = useState("");

  const [error, setError] = useState("");

  function addBag() {
    setError("");

    if (!bagNumber) {
      setError("Bag number required");

      return;
    }

    if (!lockerNumber) {
      setError("Locker number required");

      return;
    }

    const bag: GoldBag = {
      id: Date.now().toString(),

      bagNumber,

      lockerNumber,

      loanId,

      status: "SEALED",

      createdAt: new Date().toISOString(),
    };

    onAdd(bag);

    setBagNumber("");

    setLockerNumber("");

    setLoanId("");
  }

  return (
    <div>
      <div
        style={{
          display: "grid",

          gap: 10,

          maxWidth: 400,

          marginBottom: 20,
        }}
      >
        <input
          placeholder="Bag Number"
          value={bagNumber}
          onChange={(e) => setBagNumber(e.target.value)}
        />

        <input
          placeholder="Locker Number"
          value={lockerNumber}
          onChange={(e) => setLockerNumber(e.target.value)}
        />

        <input
          placeholder="Loan ID"
          value={loanId}
          onChange={(e) => setLoanId(e.target.value)}
        />

        <Button type="button" onClick={addBag}>
          Add Bag
        </Button>
      </div>

      {error && (
        <div
          style={{
            color: "#dc2626",

            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      <table
        style={{
          width: "100%",

          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={cellStyle}>Bag Number</th>

            <th style={cellStyle}>Locker</th>

            <th style={cellStyle}>Loan</th>

            <th style={cellStyle}>Status</th>

            <th style={cellStyle}>Action</th>
          </tr>
        </thead>

        <tbody>
          {bags.map((bag) => (
            <tr key={bag.id}>
              <td style={cellStyle}>{bag.bagNumber}</td>

              <td style={cellStyle}>{bag.lockerNumber}</td>

              <td style={cellStyle}>{bag.loanId || "-"}</td>

              <td style={cellStyle}>{bag.status}</td>

              <td style={cellStyle}>
                <Button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      ...bag,

                      status: bag.status === "SEALED" ? "RELEASED" : "SEALED",
                    })
                  }
                >
                  Change Status
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cellStyle = {
  padding: "12px",

  borderBottom: "1px solid #334155",
};
