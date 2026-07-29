import Card from "../../components/ui/Card";

import AuditTable from "../../components/audit/AuditTable";

import { getAuditLogs } from "../../store/auditStore";

export default function AuditLogs() {
  const logs = getAuditLogs();

  return (
    <div>
      <h1>Audit Logs</h1>

      <p>Track user activities and system changes inside FINORA.</p>

      <Card title="Activity History">
        <AuditTable logs={logs} />
      </Card>
    </div>
  );
}
