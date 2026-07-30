import { useState } from "react";

import Card from "../../components/ui/Card";

import BackupButton from "../../components/backup/BackupButton";
import ExportBackupButton from "../../components/backup/ExportBackupButton";
import RestoreBackupButton from "../../components/backup/RestoreBackupButton";
import RestoreConfirmation from "../../components/backup/RestoreConfirmation";

import type { BackupRecord } from "../../components/backup/types";

import {
  createBackup,
  deleteBackup,
  getBackups,
  restoreBackup,
} from "../../store/backupStore";

import { getSession } from "../../store/authStore";

import { createAuditLog } from "../../store/auditStore";

import { exportBackupFile } from "../../utils/backupExporter";

import { importBackupFile } from "../../utils/backupImporter";

export default function Backup() {
  const [backups, setBackups] = useState<BackupRecord[]>(getBackups());

  const [message, setMessage] = useState("");

  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  function refresh() {
    setBackups(getBackups());
  }

  function handleBackup() {
    const session = getSession();

    const backup: BackupRecord = {
      id: Date.now().toString(),

      fileName: `FINORA_BACKUP_${Date.now()}.json`,

      backupType: "FULL",

      status: "CREATED",

      createdBy: session?.username ?? "SYSTEM",

      userRole: session?.role ?? "UNKNOWN",

      createdAt: new Date().toISOString(),

      size: 0,
    };

    createBackup(backup);

    createAuditLog({
      action: "CREATE",

      module: "SYSTEM",

      description: "FINORA database backup created",

      performedBy: session?.username ?? "SYSTEM",

      userRole: session?.role ?? "UNKNOWN",
    });

    refresh();
  }

  function handleExport() {
    const session = getSession();

    exportBackupFile();

    createAuditLog({
      action: "EXPORT",

      module: "SYSTEM",

      description: "FINORA backup file exported",

      performedBy: session?.username ?? "SYSTEM",

      userRole: session?.role ?? "UNKNOWN",
    });
  }

  function handleRestoreRequest(file: File) {
    setRestoreFile(file);

    setMessage("");
  }

  async function confirmRestore() {
    if (!restoreFile) {
      return;
    }

    const session = getSession();

    const success = await importBackupFile(restoreFile);

    if (success) {
      setMessage("Backup restored successfully.");

      createAuditLog({
        action: "RESTORE",

        module: "SYSTEM",

        description: "FINORA backup data restored",

        performedBy: session?.username ?? "SYSTEM",

        userRole: session?.role ?? "UNKNOWN",
      });
    } else {
      setMessage("Invalid backup file.");
    }

    setRestoreFile(null);

    refresh();
  }

  function cancelRestore() {
    setRestoreFile(null);
  }

  function handleRestore(id: string) {
    restoreBackup(id);

    refresh();
  }

  function handleDelete(id: string) {
    deleteBackup(id);

    refresh();
  }

  return (
    <div>
      <h1>Backup Management</h1>

      <p>Create, export, restore and manage FINORA data backups.</p>

      {message && (
        <p
          style={{
            color: "#22c55e",
          }}
        >
          {message}
        </p>
      )}

      <Card title="Backup Actions">
        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >
          <BackupButton onBackup={handleBackup} />

          <ExportBackupButton onExport={handleExport} />

          <RestoreBackupButton onRestore={handleRestoreRequest} />
        </div>

        {restoreFile && (
          <RestoreConfirmation
            onConfirm={confirmRestore}
            onCancel={cancelRestore}
          />
        )}
      </Card>

      <Card title="Backup History">
        {backups.length === 0 ? (
          <p>No backups available</p>
        ) : (
          backups.map((backup) => (
            <div
              key={backup.id}
              style={{
                padding: 12,
                borderBottom: "1px solid #334155",
              }}
            >
              <p>File: {backup.fileName}</p>

              <p>Type: {backup.backupType}</p>

              <p>Status: {backup.status}</p>

              <p>Created By: {backup.createdBy}</p>

              <button type="button" onClick={() => handleRestore(backup.id)}>
                Mark Restored
              </button>

              <button
                type="button"
                onClick={() => handleDelete(backup.id)}
                style={{
                  marginLeft: 10,
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
