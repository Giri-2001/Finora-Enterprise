import { Buffer } from "node:buffer";

const MAX_BYTES = 32 * 1024 * 1024;
const MAX_RECORDS = 200000;

const RECORD_KEYS = [
  "branchId",
  "businessId",
  "createdAt",
  "data",
  "entity",
  "id",
  "ownerId",
  "updatedAt",
];

export interface PaisaruleWalletMergeScopeV1 {
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface PaisaruleWalletMergeInputV1 {
  backupPrimary: Uint8Array;
  currentPrimary: Uint8Array;
  scope: PaisaruleWalletMergeScopeV1;
}

interface StoredRecord {
  id: string;
  entity: string;
  ownerId: string;
  businessId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  data: unknown;
}

interface StoragePackage {
  version: "2.0";
  updatedAt: string;
  records: StoredRecord[];
}

export interface PaisaruleWalletMergeResultV1 {
  mergedPrimary: Buffer;
  backupRecordCount: number;
  restoredBusinessAndMetadataRecords: number;
  preservedWalletRecords: 1;
  skippedBackupWalletRecords: number;
  finalRecordCount: number;
}

function fail(code: string): never {
  throw new Error(code);
}

function objectValue(
  value: unknown,
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    fail("RESTORE_MERGE_OBJECT_INVALID");
  }
  return value as Record<string, unknown>;
}

function assertScope(
  scope: PaisaruleWalletMergeScopeV1,
): void {
  if (
    !scope ||
    typeof scope.ownerId !== "string" ||
    !scope.ownerId.trim() ||
    typeof scope.businessId !== "string" ||
    !scope.businessId.trim() ||
    typeof scope.branchId !== "string" ||
    !scope.branchId.trim()
  ) {
    fail("RESTORE_MERGE_SCOPE_INVALID");
  }
}

function readPackage(
  bytes: Uint8Array,
  scope: PaisaruleWalletMergeScopeV1,
): StoragePackage {
  if (
    !(bytes instanceof Uint8Array) ||
    bytes.byteLength === 0 ||
    bytes.byteLength > MAX_BYTES
  ) {
    fail("RESTORE_MERGE_BYTES_INVALID");
  }

  let decoded: unknown;

  try {
    decoded = JSON.parse(
      Buffer.from(bytes).toString("utf8"),
    );
  } catch {
    fail("RESTORE_MERGE_JSON_INVALID");
  }

  const root = objectValue(decoded);

  if (
    Object.keys(root).sort().join("|") !==
      ["records", "updatedAt", "version"].sort().join("|") ||
    root.version !== "2.0" ||
    typeof root.updatedAt !== "string" ||
    !root.updatedAt ||
    !Array.isArray(root.records) ||
    root.records.length > MAX_RECORDS
  ) {
    fail("RESTORE_MERGE_PACKAGE_SCHEMA_INVALID");
  }

  const records: StoredRecord[] = [];
  const ids = new Set<string>();

  for (const item of root.records) {
    const record = objectValue(item);

    if (
      Object.keys(record).sort().join("|") !==
      RECORD_KEYS.join("|")
    ) {
      fail("RESTORE_MERGE_RECORD_SCHEMA_INVALID");
    }

    for (const key of [
      "id",
      "entity",
      "ownerId",
      "businessId",
      "branchId",
      "createdAt",
      "updatedAt",
    ]) {
      if (
        typeof record[key] !== "string" ||
        !(record[key] as string).trim()
      ) {
        fail("RESTORE_MERGE_RECORD_FIELD_INVALID");
      }
    }

    if (
      record.ownerId !== scope.ownerId ||
      record.businessId !== scope.businessId ||
      record.branchId !== scope.branchId
    ) {
      fail("RESTORE_MERGE_RECORD_SCOPE_MISMATCH");
    }

    const id = record.id as string;

    if (ids.has(id)) {
      fail("RESTORE_MERGE_DUPLICATE_RECORD_ID");
    }

    ids.add(id);
    records.push(record as unknown as StoredRecord);
  }

  return {
    version: "2.0",
    updatedAt: root.updatedAt as string,
    records,
  };
}

function isWalletRelated(entity: string): boolean {
  const name = entity.toUpperCase();

  return (
    name === "WALLET" ||
    name.startsWith("WALLET_") ||
    name.startsWith("WALLET-")
  );
}

/**
 * Pure memory-only merge. No filesystem, USB, wallet API,
 * database, authentication, or Restore commit operations.
 *
 * The current destination WALLET is authoritative locally.
 * Backup WALLET records are not imported.
 *
 * Unexpected wallet-related entity types are rejected,
 * not silently discarded.
 */
export function preparePaisaruleWalletPreservingMergeV1(
  input: PaisaruleWalletMergeInputV1,
): PaisaruleWalletMergeResultV1 {
  if (!input) {
    fail("RESTORE_MERGE_INPUT_INVALID");
  }

  assertScope(input.scope);

  const current = readPackage(
    input.currentPrimary,
    input.scope,
  );

  const backup = readPackage(
    input.backupPrimary,
    input.scope,
  );

  if (
    current.records.length !== 1 ||
    current.records[0].entity !== "WALLET"
  ) {
    fail("RESTORE_MERGE_DESTINATION_NOT_WALLET_ONLY");
  }

  const existingWallet = current.records[0];
  const imported: StoredRecord[] = [];

  let skippedBackupWalletRecords = 0;

  for (const record of backup.records) {
    if (record.entity === "WALLET") {
      skippedBackupWalletRecords++;

      if (skippedBackupWalletRecords > 1) {
        fail("RESTORE_MERGE_MULTIPLE_BACKUP_WALLETS");
      }

      continue;
    }

    if (isWalletRelated(record.entity)) {
      fail("RESTORE_MERGE_WALLET_ENTITY_REVIEW_REQUIRED");
    }

    if (record.id === existingWallet.id) {
      fail("RESTORE_MERGE_WALLET_ID_COLLISION");
    }

    imported.push(record);
  }

  const mergedRecords = [
    existingWallet,
    ...imported,
  ];

  if (mergedRecords.length > MAX_RECORDS) {
    fail("RESTORE_MERGE_RECORD_LIMIT");
  }

  const merged: StoragePackage = {
    version: "2.0",
    updatedAt: new Date().toISOString(),
    records: mergedRecords,
  };

  const mergedPrimary = Buffer.from(
    JSON.stringify(merged),
    "utf8",
  );

  if (
    mergedPrimary.length === 0 ||
    mergedPrimary.length > MAX_BYTES
  ) {
    fail("RESTORE_MERGE_OUTPUT_TOO_LARGE");
  }

  return {
    mergedPrimary,
    backupRecordCount: backup.records.length,
    restoredBusinessAndMetadataRecords: imported.length,
    preservedWalletRecords: 1,
    skippedBackupWalletRecords,
    finalRecordCount: mergedRecords.length,
  };
}