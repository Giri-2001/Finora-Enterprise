import Card from "../../components/ui/Card";

import { getAuditLogs } from "../../store/auditStore";

import { getAuditArchives } from "../../store/auditArchiveStore";

import { getAuditRetentionConfig } from "../../store/auditRetentionStore";

import { getLoginSecurityRecords } from "../../store/loginSecurityStore";

import { getBackups } from "../../store/backupStore";

export default function Compliance() {
  const auditLogs = getAuditLogs();

  const archives = getAuditArchives();

  const retention = getAuditRetentionConfig();

  const securityRecords = getLoginSecurityRecords();

  const backups = getBackups();

  const lockedAccounts = securityRecords.filter(
    (record) => record.lockedUntil,
  ).length;

  const complianceScore = Math.min(
    100,
    (auditLogs.length > 0 ? 20 : 0) +
      (archives.length > 0 ? 20 : 0) +
      (retention.retentionDays > 0 ? 20 : 0) +
      (backups.length > 0 ? 20 : 0) +
      (lockedAccounts === 0 ? 20 : 10),
  );

  return (
    <div>
      <h1>Compliance Dashboard</h1>

      <p>
        Monitor FINORA audit, security, backup and retention compliance status.
      </p>

      <Card title="Compliance Health">
        <h2>{complianceScore}%</h2>

        <p>Overall compliance health score</p>
      </Card>

      <Card title="Audit Status">
        <p>
          <strong>Total Audit Events:</strong> {auditLogs.length}
        </p>

        <p>
          <strong>Archived Records:</strong> {archives.length}
        </p>
      </Card>

      <Card title="Retention Policy">
        <p>
          <strong>Retention Days:</strong> {retention.retentionDays}
        </p>

        <p>
          <strong>Auto Archive:</strong>{" "}
          {retention.autoArchiveEnabled ? "Enabled" : "Disabled"}
        </p>

        <p>
          <strong>Cleanup:</strong>{" "}
          {retention.cleanupEnabled ? "Enabled" : "Disabled"}
        </p>
      </Card>

      <Card title="Security Status">
        <p>
          <strong>Security Records:</strong> {securityRecords.length}
        </p>

        <p>
          <strong>Locked Accounts:</strong> {lockedAccounts}
        </p>
      </Card>

      <Card title="Backup Status">
        <p>
          <strong>Available Backups:</strong> {backups.length}
        </p>
      </Card>
    </div>
  );
}
