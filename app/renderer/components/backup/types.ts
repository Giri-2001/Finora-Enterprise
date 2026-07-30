export type BackupType = "FULL" | "CUSTOMER" | "LOAN" | "COLLECTION";

export type BackupStatus = "CREATED" | "RESTORED" | "FAILED";

export type BackupRecord = {
  id: string;

  fileName: string;

  backupType: BackupType;

  status: BackupStatus;

  createdBy: string;

  userRole: string;

  createdAt: string;

  size: number;
};
