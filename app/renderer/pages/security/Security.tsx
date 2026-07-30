import { useState } from "react";

import Card from "../../components/ui/Card";

import SecurityExportButton from "../../components/security/SecurityExportButton";

import SecurityReport from "../../components/security/SecurityReport";

import SecurityStats from "../../components/security/SecurityStats";

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

  const lockedAccounts = records.filter((record) =>
    Boolean(record.lockedUntil),
  ).length;

  const failedAttempts = records.reduce(
    (sum, record) => sum + record.failedAttempts,

    0,
  );

  return (
    <div>
      <h1>Security Management</h1>

      <p>Monitor FINORA security activity and user protection.</p>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",

          gap: 16,

          marginBottom: 20,
        }}
      >
        <Card title="Security Records">
          <h2>{records.length}</h2>
        </Card>

        <Card title="Locked Accounts">
          <h2>{lockedAccounts}</h2>
        </Card>

        <Card title="Failed Attempts">
          <h2>{failedAttempts}</h2>
        </Card>
      </div>

      <div
        style={{
          display: "flex",

          gap: 12,

          marginBottom: 20,
        }}
      >
        <SecurityExportButton format="JSON" />

        <SecurityExportButton format="CSV" />
      </div>

      <SecurityStats />

      <SecurityReport />

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
