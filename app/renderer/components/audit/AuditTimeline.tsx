import type { AuditLog } from "./types";

type AuditTimelineProps = {
  logs: AuditLog[];
};

export default function AuditTimeline({ logs }: AuditTimelineProps) {
  return (
    <div
      style={{
        display: "flex",

        flexDirection: "column",

        gap: 14,
      }}
    >
      {logs.length === 0 ? (
        <p>No audit activity available.</p>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            style={{
              borderLeft: "3px solid #2563eb",

              paddingLeft: 16,

              paddingBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",

                justifyContent: "space-between",

                gap: 10,
              }}
            >
              <strong>{log.action}</strong>

              <small>{new Date(log.createdAt).toLocaleString("en-IN")}</small>
            </div>

            <p>
              <strong>Module:</strong> {log.module}
            </p>

            <p>{log.description}</p>

            <p
              style={{
                fontSize: 13,

                opacity: 0.7,
              }}
            >
              User: {log.performedBy}
              {" | "}
              Role: {log.userRole}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
