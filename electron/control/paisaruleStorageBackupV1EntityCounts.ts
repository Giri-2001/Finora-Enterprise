import { TextDecoder } from "node:util";

export interface PaisaruleV1CountScope {
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface PaisaruleV1EntityCounts {
  customers: number;
  loans: number;
  collections: number;
  goldLoans: number;
  goldCustodyRecords: number;
  businessRecords: number;
  totalStorageRecords: number;
}

interface StoredRecord {
  id: string;
  entity: string;
  data: unknown;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}

const MAX_STORAGE_BYTES = 32 * 1024 * 1024;

const decoder = new TextDecoder("utf-8", {
  fatal: true,
});

const RECORD_KEYS = [
  "id",
  "entity",
  "data",
  "createdAt",
  "updatedAt",
  "ownerId",
  "businessId",
  "branchId",
].sort();

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
    return fail("BACKUP_COUNTS_OBJECT_INVALID");
  }

  const prototype = Object.getPrototypeOf(value);

  if (
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    return fail("BACKUP_COUNTS_OBJECT_INVALID");
  }

  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function assertScope(
  scope: PaisaruleV1CountScope,
): void {
  if (
    !text(scope?.ownerId) ||
    !text(scope?.businessId) ||
    !text(scope?.branchId)
  ) {
    fail("BACKUP_COUNTS_SCOPE_INVALID");
  }
}

function isGoldText(
  data: Record<string, unknown>,
): boolean {
  const candidate = [
    text(data.loanType),
    text(data.title),
  ].join(" ").toUpperCase();

  // Same legacy classification convention as Accounts.
  return candidate.includes("GOLD");
}

/**
 * Counts the single authoritative primary V1 storage snapshot.
 *
 * The secondary storage file is NOT added to these counts.
 * All returned zeroes are computed, never display defaults.
 *
 * Gold Loans are a subset of Loans, not additional
 * business records.
 *
 * This pure function does not read or write USB files.
 */
export function countPaisaruleStorageBackupV1Entities(
  primaryBytes: Uint8Array,
  scope: PaisaruleV1CountScope,
): PaisaruleV1EntityCounts {
  assertScope(scope);

  if (
    !(primaryBytes instanceof Uint8Array) ||
    primaryBytes.byteLength === 0 ||
    primaryBytes.byteLength > MAX_STORAGE_BYTES
  ) {
    return fail("BACKUP_COUNTS_STORAGE_INVALID");
  }

  let root: Record<string, unknown>;

  try {
    root = objectValue(
      JSON.parse(decoder.decode(primaryBytes)),
    );
  } catch {
    return fail("BACKUP_COUNTS_JSON_INVALID");
  }

  if (
    typeof root.version !== "string" ||
    typeof root.updatedAt !== "string" ||
    !Array.isArray(root.records) ||
    root.records.length > 200000 ||
    Object.keys(root).sort().join("|") !==
      ["records", "updatedAt", "version"]
        .sort().join("|")
  ) {
    return fail("BACKUP_COUNTS_SCHEMA_INVALID");
  }

  const records: StoredRecord[] = [];
  const seen = new Set<string>();

  for (const item of root.records) {
    const record = objectValue(item);

    if (
      Object.keys(record).sort().join("|") !==
      RECORD_KEYS.join("|")
    ) {
      return fail("BACKUP_COUNTS_RECORD_SCHEMA_INVALID");
    }

    for (const field of [
      "id",
      "entity",
      "ownerId",
      "businessId",
      "branchId",
      "createdAt",
      "updatedAt",
    ]) {
      if (!text(record[field])) {
        return fail("BACKUP_COUNTS_RECORD_INVALID");
      }
    }

    if (
      record.ownerId !== scope.ownerId ||
      record.businessId !== scope.businessId ||
      record.branchId !== scope.branchId
    ) {
      return fail("BACKUP_COUNTS_SCOPE_MISMATCH");
    }

    const identity = JSON.stringify([
      record.entity,
      record.id,
    ]);

    if (seen.has(identity)) {
      return fail("BACKUP_COUNTS_DUPLICATE_IDENTITY");
    }

    seen.add(identity);
    records.push(record as unknown as StoredRecord);
  }

  const loans = new Map<
    string,
    Record<string, unknown>
  >();

  const goldLoanIds = new Set<string>();

  let customers = 0;
  let collections = 0;
  let goldCustodyRecords = 0;

  for (const record of records) {
    switch (record.entity) {
      case "CUSTOMER":
        customers++;
        break;

      case "COLLECTION":
        collections++;
        break;

      case "LOAN": {
        const data = objectValue(record.data);
        const dataId = text(data.id);

        // The persisted loan identity must be consistent.
        if (dataId && dataId !== record.id) {
          return fail("BACKUP_COUNTS_LOAN_ID_MISMATCH");
        }

        loans.set(record.id, data);

        if (isGoldText(data)) {
          goldLoanIds.add(record.id);
        }

        break;
      }

      case "GOLD_CUSTODY_ALLOCATION": {
        const data = objectValue(record.data);
        const loanId = text(data.loanId);

        if (!loanId) {
          return fail("BACKUP_COUNTS_GOLD_ID_MISSING");
        }

        goldCustodyRecords++;
        goldLoanIds.add(loanId);
        break;
      }

      default:
        // Settings and other entities remain in the
        // complete backup but not the business count.
        break;
    }
  }

  // Historical custody identity must refer to a
  // persisted Loan in the same authoritative snapshot.
  for (const loanId of goldLoanIds) {
    if (!loans.has(loanId)) {
      return fail("BACKUP_COUNTS_GOLD_LOAN_MISSING");
    }
  }

  const loanCount = loans.size;

  return {
    customers,
    loans: loanCount,
    collections,
    goldLoans: goldLoanIds.size,
    goldCustodyRecords,
    businessRecords:
      customers + loanCount + collections,
    totalStorageRecords: records.length,
  };
}