import { useState } from "react";

import Button from "../ui/Button";

import type { GoldRelease } from "../../store/goldReleaseStore";

type GoldReleaseManagerProps = {
  releases: GoldRelease[];

  onAdd: (release: GoldRelease) => void;
};

export default function GoldReleaseManager({
  releases,

  onAdd,
}: GoldReleaseManagerProps) {
  const [loanId, setLoanId] = useState("");

  const [customerId, setCustomerId] = useState("");

  const [lockerNumber, setLockerNumber] = useState("");

  const [bagNumber, setBagNumber] = useState("");

  const [releaseDate, setReleaseDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [releasedBy, setReleasedBy] = useState("");

  const [remarks, setRemarks] = useState("");

  const [error, setError] = useState("");

  function releaseGold() {
    setError("");

    if (!loanId) {
      setError("Loan ID required");

      return;
    }

    if (!lockerNumber) {
      setError("Locker Number required");

      return;
    }

    const now = new Date().toISOString();

    const release: GoldRelease = {
      id: Date.now().toString(),

      loanId,

      customerId,

      lockerNumber,

      bagNumber,

      releaseDate,

      releasedBy: releasedBy || "Admin",

      remarks,

      status: "RELEASED",

      createdAt: now,

      updatedAt: now,
    };

    onAdd(release);

    setLoanId("");

    setCustomerId("");

    setLockerNumber("");

    setBagNumber("");

    setReleasedBy("");

    setRemarks("");
  }

  return (
    <div>
      <div
        style={{
          display: "grid",

          gap: 10,

          maxWidth: 450,

          marginBottom: 20,
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
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
        />

        <input
          placeholder="Released By"
          value={releasedBy}
          onChange={(e) => setReleasedBy(e.target.value)}
        />

        <textarea
          placeholder="Remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        <Button type="button" onClick={releaseGold}>
          Release Gold
        </Button>
      </div>

      {error && (
        <div
          style={{
            color: "#dc2626",
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
            <th style={cellStyle}>Loan</th>

            <th style={cellStyle}>Locker</th>

            <th style={cellStyle}>Bag</th>

            <th style={cellStyle}>Date</th>

            <th style={cellStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {releases.map((release) => (
            <tr key={release.id}>
              <td style={cellStyle}>{release.loanId}</td>

              <td style={cellStyle}>{release.lockerNumber}</td>

              <td style={cellStyle}>{release.bagNumber}</td>

              <td style={cellStyle}>{release.releaseDate}</td>

              <td style={cellStyle}>{release.status}</td>
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
