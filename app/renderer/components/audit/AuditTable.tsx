import type { AuditLog } from "./types";

type AuditTableProps = {
  logs: AuditLog[];
};

export default function AuditTable({ logs }: AuditTableProps) {
  if (logs.length === 0) {
    return (
      <div
        style={{
          padding: 20,
          background: "#1e293b",
          borderRadius: 12,
        }}
      >
        No audit records available
      </div>
    );
  }

  return (
    <table
      style={{
        width: "100%",
        marginTop: 20,
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr>
          <th style={cellStyle}>Time</th>

          <th style={cellStyle}>Action</th>

          <th style={cellStyle}>Module</th>

          <th style={cellStyle}>Description</th>

          <th style={cellStyle}>User</th>

          <th style={cellStyle}>Role</th>
        </tr>
      </thead>

      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td style={cellStyle}>
              {new Date(log.createdAt).toLocaleString("en-IN")}
            </td>

            <td style={cellStyle}>{log.action}</td>

            <td style={cellStyle}>{log.module}</td>

            <td style={cellStyle}>{log.description}</td>

            <td style={cellStyle}>{log.performedBy}</td>

            <td style={cellStyle}>{log.userRole}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const cellStyle = {
  borderBottom: "1px solid #334155",

  padding: "12px",

  textAlign: "left" as const,
};
