import { getCustomers } from "../store/customerStore";

import { getLoans } from "../store/loanStore";

import { getCollections } from "../store/collectionStore";

import { getUsers } from "../store/authStore";

import { getAuditLogs } from "../store/auditStore";

type FinoraBackupData = {
  application: string;

  version: string;

  createdAt: string;

  customers: unknown[];

  loans: unknown[];

  collections: unknown[];

  users: unknown[];

  auditLogs: unknown[];
};

export function generateBackupData(): FinoraBackupData {
  return {
    application: "FINORA Enterprise",

    version: "V1",

    createdAt: new Date().toISOString(),

    customers: getCustomers(),

    loans: getLoans(),

    collections: getCollections(),

    users: getUsers(),

    auditLogs: getAuditLogs(),
  };
}

export function exportBackupFile(): void {
  const backupData = generateBackupData();

  const json = JSON.stringify(backupData, null, 2);

  const blob = new Blob([json], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `FINORA_BACKUP_${Date.now()}.json`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
