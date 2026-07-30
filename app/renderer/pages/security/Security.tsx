import { useState } from "react";

import Card from "../../components/ui/Card";

import {
  getLoginSecurityRecords,
  resetLoginAttempts,
} from "../../store/loginSecurityStore";

export default function Security() {
  const [records, setRecords] = useState(getLoginSecurityRecords());

  function refresh() {
    setRecords(getLoginSecurityRecords());
  }

  function unlockAccount(username: string) {
    resetLoginAttempts(username);

    refresh();
  }

  return (
    <div>
      <h1>Security Management</h1>

      <p>Monitor login attempts and manage locked accounts.</p>

      <Card title="Login Security Records">
        {records.length === 0 ? (
          <p>No security records available.</p>
        ) : (
          records.map((record) => (
            <div
              key={record.username}
              style={{
                padding: 14,

                borderBottom: "1px solid #334155",
              }}
            >
              <p>
                <strong>Username:</strong> {record.username}
              </p>

              <p>
                <strong>Failed Attempts:</strong> {record.failedAttempts}
              </p>

              <p>
                <strong>Locked Until:</strong> {record.lockedUntil ?? "-"}
              </p>

              <p>
                <strong>Last Failed:</strong> {record.lastFailedAt ?? "-"}
              </p>

              {record.lockedUntil && (
                <button
                  type="button"
                  onClick={() => unlockAccount(record.username)}
                  style={{
                    background: "#16a34a",

                    color: "#ffffff",

                    border: "none",

                    padding: "8px 14px",

                    borderRadius: 6,

                    cursor: "pointer",
                  }}
                >
                  Unlock Account
                </button>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
