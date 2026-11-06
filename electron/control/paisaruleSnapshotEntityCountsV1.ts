/**
 * PAISARULE C117-R125
 * Pure snapshot entity counter.
 *
 * IMPORTANT:
 * This function does NOT authenticate or decrypt a backup.
 * Callers must independently verify the backup, branch scope,
 * and integrity before treating returned counts as verified.
 *
 * No USB, database, filesystem, wallet or Restore operations.
 */

export interface PaisaruleSnapshotScopeV1 {
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface PaisaruleSnapshotCountInputV1 {
  dataContext: "REAL";
  branchScope: PaisaruleSnapshotScopeV1;
  recordCount: number;
  records: unknown[];
}

export interface PaisaruleSnapshotEntityCountsV1 {
  customers: number;
  loans: number;
  collections: number;
  goldRecords: number;
  totalStorageRecords: number;
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" &&
    value.trim().length > 0;
}

function validScope(
  value: unknown,
): value is PaisaruleSnapshotScopeV1 {
  return isObject(value) &&
    isText(value.ownerId) &&
    isText(value.businessId) &&
    isText(value.branchId);
}

/**
 * Counts only recognized business entities in one exact
 * REAL branch snapshot. Other valid entity types remain
 * part of totalStorageRecords, not the four UI categories.
 *
 * Gold means custody allocation records only.
 */
export function countPaisaruleSnapshotEntitiesV1(
  input: unknown,
): PaisaruleSnapshotEntityCountsV1 {
  if (!isObject(input) ||
      input.dataContext !== "REAL" ||
      !validScope(input.branchScope) ||
      !Array.isArray(input.records) ||
      !Number.isSafeInteger(input.recordCount) ||
      (input.recordCount as number) < 0 ||
      input.recordCount !== input.records.length) {
    throw new Error("INVALID_REAL_SNAPSHOT_COUNT_INPUT");
  }

  const scope = input.branchScope;
  const seen = new Set<string>();

  const counts: PaisaruleSnapshotEntityCountsV1 = {
    customers: 0,
    loans: 0,
    collections: 0,
    goldRecords: 0,
    totalStorageRecords: input.records.length,
  };

  for (const value of input.records) {
    if (!isObject(value) ||
        !isText(value.id) ||
        !isText(value.entity) ||
        value.ownerId !== scope.ownerId ||
        value.businessId !== scope.businessId ||
        value.branchId !== scope.branchId ||
        Object.prototype.hasOwnProperty.call(value, "demoId") ||
        !Object.prototype.hasOwnProperty.call(value, "data")) {
      throw new Error("INVALID_OR_OUT_OF_SCOPE_SNAPSHOT_RECORD");
    }

    const identity = JSON.stringify([value.entity, value.id]);

    if (seen.has(identity)) {
      throw new Error("DUPLICATE_SNAPSHOT_ENTITY_ID");
    }

    seen.add(identity);

    switch (value.entity) {
      case "CUSTOMER":
        counts.customers++;
        break;
      case "LOAN":
        counts.loans++;
        break;
      case "COLLECTION":
        counts.collections++;
        break;
      case "GOLD_CUSTODY_ALLOCATION":
        counts.goldRecords++;
        break;
      default:
        // Other storage entities are not business-item counts.
        break;
    }
  }

  return counts;
}
