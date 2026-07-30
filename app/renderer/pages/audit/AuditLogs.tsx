import { useMemo, useState } from "react";

import Card from "../../components/ui/Card";

import AuditFilters from "../../components/audit/AuditFilters";
import AuditTable from "../../components/audit/AuditTable";
import AuditTimeline from "../../components/audit/AuditTimeline";

import { getAuditLogs } from "../../store/auditStore";

export default function AuditLogs() {
  const logs = getAuditLogs();

  const [search, setSearch] = useState("");

  const [module, setModule] = useState("");

  const [action, setAction] = useState("");

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
          !searchText ||
          log.description.toLowerCase().includes(searchText) ||
          log.performedBy.toLowerCase().includes(searchText);

        const matchesModule = !module || log.module === module;

        const matchesAction = !action || log.action === action;

        return matchesSearch && matchesModule && matchesAction;
      }),

    [logs, search, module, action],
  );

  return (
    <div>
      <h1>Audit Logs</h1>

      <p>Track user activities and system changes inside FINORA.</p>

      <Card title="Audit Filters">
        <AuditFilters
          search={search}
          module={module}
          action={action}
          onSearchChange={setSearch}
          onModuleChange={setModule}
          onActionChange={setAction}
        />
      </Card>

      <Card title="Activity Timeline">
        <AuditTimeline logs={filteredLogs} />
      </Card>

      <Card title="Activity History">
        <AuditTable logs={filteredLogs} />
      </Card>
    </div>
  );
}
