import { replaceCustomers } from "../store/customerStore";

import { replaceLoans } from "../store/loanStore";

import { replaceCollections } from "../store/collectionStore";

import { replaceUsers } from "../store/authStore";

import { replaceAuditLogs } from "../store/auditStore";

type BackupData = {
  application: string;

  version: string;

  createdAt: string;

  customers: unknown[];

  loans: unknown[];

  collections: unknown[];

  users: unknown[];

  auditLogs: unknown[];
};

export function importBackupFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as BackupData;

        if (data.application !== "FINORA Enterprise") {
          resolve(false);

          return;
        }

        replaceCustomers(data.customers as any[]);

        replaceLoans(data.loans as any[]);

        replaceCollections(data.collections as any[]);

        replaceUsers(data.users as any[]);

        replaceAuditLogs(data.auditLogs as any[]);

        resolve(true);
      } catch {
        resolve(false);
      }
    };

    reader.onerror = () => {
      resolve(false);
    };

    reader.readAsText(file);
  });
}
