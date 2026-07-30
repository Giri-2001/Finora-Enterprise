import { useState } from "react";

import Card from "../../components/ui/Card";

import {
  deleteAuditArchive,
  getAuditArchives,
  restoreAuditArchive,
} from "../../store/auditArchiveStore";

import type { AuditArchive as AuditArchiveType } from "../../store/auditArchiveStore";

export default function AuditArchive() {
  const [archives, setArchives] =
    useState<AuditArchiveType[]>(getAuditArchives());

  const [message, setMessage] = useState("");

  function refresh() {
    setArchives(getAuditArchives());
  }

  function handleRestore(id: string) {
    const logs = restoreAuditArchive(id);

    if (logs) {
      setMessage(`Archive restored. ${logs.length} audit records loaded.`);
    } else {
      setMessage("Archive not found.");
    }
  }

  function handleDelete(id: string) {
    deleteAuditArchive(id);

    setMessage("Archive deleted successfully.");

    refresh();
  }

  return (
    <div>
      <h1>Audit Archive Management</h1>

      <p>View, restore and manage FINORA audit archives.</p>

      {message && (
        <p
          style={{
            color: "#22c55e",
          }}
        >
          {message}
        </p>
      )}

      <Card title="Archive History">
        {archives.length === 0 ? (
          <p>No audit archives available.</p>
        ) : (
          archives.map((archive) => (
            <div
              key={archive.id}
              style={{
                padding: 14,

                borderBottom: "1px solid #334155",
              }}
            >
              <p>
                <strong>Name:</strong> {archive.name}
              </p>

              <p>
                <strong>Total Logs:</strong> {archive.totalLogs}
              </p>

              <p>
                <strong>Created By:</strong> {archive.createdBy}
              </p>

              <p>
                <strong>Created At:</strong>{" "}
                {new Date(archive.createdAt).toLocaleString("en-IN")}
              </p>

              <button
                type="button"
                onClick={() => handleRestore(archive.id)}
                style={{
                  background: "#16a34a",

                  color: "#ffffff",

                  border: "none",

                  padding: "8px 14px",

                  borderRadius: 6,

                  cursor: "pointer",
                }}
              >
                Restore Archive
              </button>

              <button
                type="button"
                onClick={() => handleDelete(archive.id)}
                style={{
                  marginLeft: 10,

                  background: "#dc2626",

                  color: "#ffffff",

                  border: "none",

                  padding: "8px 14px",

                  borderRadius: 6,

                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
