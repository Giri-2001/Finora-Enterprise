import Card from "../ui/Card";

import { getUsers } from "../../store/authStore";

import { getLoginSecurityRecords } from "../../store/loginSecurityStore";

import { getAuditLogs } from "../../store/auditStore";

export default function SecurityReport() {
  const users = getUsers();

  const securityRecords = getLoginSecurityRecords();

  const auditLogs = getAuditLogs();

  const activeUsers = users.filter((user) => user.status === "ACTIVE").length;

  const lockedAccounts = securityRecords.filter(
    (record) =>
      record.lockedUntil && new Date(record.lockedUntil).getTime() > Date.now(),
  ).length;

  const failedAttempts = securityRecords.reduce(
    (total, record) => total + record.failedAttempts,
    0,
  );

  const securityEvents = auditLogs
    .filter((log) => log.module === "AUTH" || log.module === "SYSTEM")
    .slice(0, 5);

  return (
    <div>
      <h2>Security Audit Report</h2>

      <div
        style={{
          display: "grid",

          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",

          gap: 16,

          marginTop: 16,
        }}
      >
        <Card title="Total Users">
          <h2>{users.length}</h2>

          <p>Registered system users</p>
        </Card>

        <Card title="Active Users">
          <h2>{activeUsers}</h2>

          <p>Currently active accounts</p>
        </Card>

        <Card title="Locked Accounts">
          <h2>{lockedAccounts}</h2>

          <p>Security locked users</p>
        </Card>

        <Card title="Failed Attempts">
          <h2>{failedAttempts}</h2>

          <p>Total failed logins</p>
        </Card>
      </div>

      <Card title="Recent Security Events">
        {securityEvents.length === 0 ? (
          <p>No security events available.</p>
        ) : (
          securityEvents.map((event) => (
            <div
              key={event.id}
              style={{
                padding: 10,

                borderBottom: "1px solid #334155",
              }}
            >
              <p>
                <strong>{event.action}</strong>
                {" - "}
                {event.description}
              </p>

              <small>{event.createdAt}</small>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
