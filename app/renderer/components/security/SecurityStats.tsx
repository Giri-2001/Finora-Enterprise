import Card from "../ui/Card";

import { getLoginSecurityRecords } from "../../store/loginSecurityStore";

export default function SecurityStats() {
  const records = getLoginSecurityRecords();

  const totalRecords = records.length;

  const lockedAccounts = records.filter(
    (record) =>
      record.lockedUntil && new Date(record.lockedUntil).getTime() > Date.now(),
  ).length;

  const failedAttempts = records.reduce(
    (total, record) => total + record.failedAttempts,
    0,
  );

  return (
    <div
      style={{
        display: "grid",

        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",

        gap: 16,

        marginBottom: 20,
      }}
    >
      <Card title="Security Records">
        <h2>{totalRecords}</h2>

        <p>Tracked login accounts</p>
      </Card>

      <Card title="Locked Accounts">
        <h2>{lockedAccounts}</h2>

        <p>Currently blocked users</p>
      </Card>

      <Card title="Failed Attempts">
        <h2>{failedAttempts}</h2>

        <p>Total failed logins</p>
      </Card>
    </div>
  );
}
