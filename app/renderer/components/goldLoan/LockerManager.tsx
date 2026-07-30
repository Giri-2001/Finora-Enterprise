import { useState } from "react";

import Button from "../ui/Button";

import type { GoldLocker } from "./types";

type LockerManagerProps = {
  lockers: GoldLocker[];

  onAdd: (locker: GoldLocker) => void;

  onUpdate: (locker: GoldLocker) => void;
};

export default function LockerManager({
  lockers,

  onAdd,

  onUpdate,
}: LockerManagerProps) {
  const [lockerNumber, setLockerNumber] = useState("");

  const [error, setError] = useState("");

  function addLocker() {
    setError("");

    if (!lockerNumber) {
      setError("Locker number required");

      return;
    }

    const locker: GoldLocker = {
      id: Date.now().toString(),

      lockerNumber,

      status: "AVAILABLE",

      createdAt: new Date().toISOString(),
    };

    onAdd(locker);

    setLockerNumber("");
  }

  return (
    <div>
      <div
        style={{
          display: "flex",

          gap: 10,

          marginBottom: 20,
        }}
      >
        <input
          placeholder="Locker Number"
          value={lockerNumber}
          onChange={(e) => setLockerNumber(e.target.value)}
        />

        <Button type="button" onClick={addLocker}>
          Add Locker
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
            <th style={cellStyle}>Locker Number</th>

            <th style={cellStyle}>Status</th>

            <th style={cellStyle}>Action</th>
          </tr>
        </thead>

        <tbody>
          {lockers.map((locker) => (
            <tr key={locker.id}>
              <td style={cellStyle}>{locker.lockerNumber}</td>

              <td style={cellStyle}>{locker.status}</td>

              <td style={cellStyle}>
                <Button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      ...locker,

                      status:
                        locker.status === "AVAILABLE"
                          ? "OCCUPIED"
                          : "AVAILABLE",
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
