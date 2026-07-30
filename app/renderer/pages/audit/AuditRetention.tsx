import { useState } from "react";

import Card from "../../components/ui/Card";

import {
  getAuditRetentionConfig,
  updateAuditRetentionConfig,
} from "../../store/auditRetentionStore";

import { getSession } from "../../store/authStore";

export default function AuditRetention() {
  const [config, setConfig] = useState(getAuditRetentionConfig());

  const [message, setMessage] = useState("");

  function refresh() {
    setConfig(getAuditRetentionConfig());
  }

  function handleSave() {
    const session = getSession();

    updateAuditRetentionConfig(
      {
        retentionDays: config.retentionDays,

        autoArchiveEnabled: config.autoArchiveEnabled,

        cleanupEnabled: config.cleanupEnabled,
      },

      session?.username ?? "SYSTEM",
    );

    setMessage("Audit retention policy updated successfully.");

    refresh();
  }

  return (
    <div>
      <h1>Audit Retention Management</h1>

      <p>Configure FINORA audit storage retention and cleanup policies.</p>

      {message && (
        <p
          style={{
            color: "#22c55e",
          }}
        >
          {message}
        </p>
      )}

      <Card title="Retention Policy">
        <div
          style={{
            display: "flex",

            flexDirection: "column",

            gap: 14,
          }}
        >
          <label>
            Retention Days
            <input
              type="number"
              value={config.retentionDays}
              onChange={(event) =>
                setConfig({
                  ...config,

                  retentionDays: Number(event.target.value),
                })
              }
              style={{
                display: "block",

                marginTop: 6,

                padding: 8,

                borderRadius: 6,
              }}
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={config.autoArchiveEnabled}
              onChange={(event) =>
                setConfig({
                  ...config,

                  autoArchiveEnabled: event.target.checked,
                })
              }
            />{" "}
            Enable Auto Archive
          </label>

          <label>
            <input
              type="checkbox"
              checked={config.cleanupEnabled}
              onChange={(event) =>
                setConfig({
                  ...config,

                  cleanupEnabled: event.target.checked,
                })
              }
            />{" "}
            Enable Cleanup
          </label>

          <button
            type="button"
            onClick={handleSave}
            style={{
              background: "#2563eb",

              color: "#ffffff",

              border: "none",

              padding: "10px 16px",

              borderRadius: 6,

              cursor: "pointer",

              width: "fit-content",
            }}
          >
            Save Policy
          </button>
        </div>
      </Card>

      <Card title="Policy Information">
        <p>
          <strong>Updated By:</strong> {config.updatedBy}
        </p>

        <p>
          <strong>Updated At:</strong>{" "}
          {new Date(config.updatedAt).toLocaleString("en-IN")}
        </p>
      </Card>
    </div>
  );
}
