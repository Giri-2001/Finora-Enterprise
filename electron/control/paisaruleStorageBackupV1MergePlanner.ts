/*
 * PAISARULE Storage Backup V1 - Pure Merge Planner.
 *
 * No filesystem, network, IPC, wallet billing or persistence.
 * The caller must authenticate the Owner, decrypt/validate the
 * backup and validate the target storage before invoking this.
 *
 * This module does not authorize or execute a restore.
 */

export interface PaisaruleMergeScope {
  userId: string;
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface PaisaruleMergeRecord {
  id: string;
  entity: string;
  data: unknown;
  createdAt: unknown;
  updatedAt: unknown;
  ownerId: string;
  businessId: string;
  branchId: string;
}

export interface PaisaruleMergeStorage {
  records: PaisaruleMergeRecord[];
  updatedAt: unknown;
  version: unknown;
}

export interface PaisaruleMergeCount {
  entity: string;
  existing: number;
  backup: number;
  matched: number;
  newRecords: number;
  conflicts: number;
  final: number;
}

export interface PaisaruleMergePreview {
  canConfirm: boolean;
  existingCount: number;
  backupCount: number;
  matchedCount: number;
  newCount: number;
  conflictCount: number;
  finalCount: number;
  counts: PaisaruleMergeCount[];
  merged: PaisaruleMergeStorage | null;
}

function fail(code: string): never {
  throw new Error(code);
}

function object(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function canonical(value: unknown): string {
  if (value === null) return "null";

  if (typeof value === "string") return JSON.stringify(value);

  if (typeof value === "number" && Number.isFinite(value)) {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return "[" + value.map(canonical).join(",") + "]";
  }

  if (object(value)) {
    return "{" +
      Object.keys(value).sort().map((key) =>
        JSON.stringify(key) + ":" + canonical(value[key])
      ).join(",") +
      "}";
  }

  return fail("MERGE_UNSUPPORTED_VALUE");
}

function validateScope(scope: PaisaruleMergeScope): void {
  for (const key of [
    "userId", "ownerId", "businessId", "branchId"
  ] as const) {
    if (
      typeof scope[key] !== "string" ||
      scope[key].trim().length === 0
    ) {
      fail("MERGE_SCOPE_INVALID");
    }
  }
}

function validateStorage(
  value: unknown,
  scope: PaisaruleMergeScope,
  label: string
): PaisaruleMergeStorage {
  if (!object(value)) fail(label + "_ROOT_INVALID");

  const rootKeys = Object.keys(value).sort().join("|");

  if (rootKeys !== "records|updatedAt|version") {
    fail(label + "_ROOT_SCHEMA_INVALID");
  }

  if (!Array.isArray(value.records)) {
    fail(label + "_RECORDS_INVALID");
  }

  if (value.records.length > 200000) {
    fail(label + "_RECORD_LIMIT");
  }

  if (
    value.version === null ||
    value.version === undefined ||
    value.updatedAt === undefined
  ) {
    fail(label + "_METADATA_INVALID");
  }

  const seen = new Set<string>();

  for (const entry of value.records) {
    if (!object(entry)) fail(label + "_RECORD_INVALID");

    const keys = Object.keys(entry).sort().join("|");

    if (
      keys !==
      "branchId|businessId|createdAt|data|entity|id|ownerId|updatedAt"
    ) {
      fail(label + "_RECORD_SCHEMA_INVALID");
    }

    if (
      typeof entry.id !== "string" ||
      !entry.id.trim() ||
      typeof entry.entity !== "string" ||
      !entry.entity.trim()
    ) {
      fail(label + "_RECORD_ID_INVALID");
    }

    if (
      entry.ownerId !== scope.ownerId ||
      entry.businessId !== scope.businessId ||
      entry.branchId !== scope.branchId
    ) {
      fail(label + "_RECORD_SCOPE_MISMATCH");
    }

    const identity = JSON.stringify([
      entry.entity,
      entry.id
    ]);

    if (seen.has(identity)) {
      fail(label + "_DUPLICATE_RECORD_ID");
    }

    seen.add(identity);

    canonical(entry);
  }

  canonical(value.updatedAt);
  canonical(value.version);

  return value as unknown as PaisaruleMergeStorage;
}

export function previewPaisaruleStorageBackupV1Merge(input: {
  scope: PaisaruleMergeScope;
  backup: unknown;
  target: unknown | null;
}): PaisaruleMergePreview {
  validateScope(input.scope);

  const backup = validateStorage(
    input.backup, input.scope, "BACKUP"
  );

  const target = input.target === null
    ? {
        records: [],
        updatedAt: backup.updatedAt,
        version: backup.version,
      } as PaisaruleMergeStorage
    : validateStorage(input.target, input.scope, "TARGET");

  if (canonical(backup.version) !== canonical(target.version)) {
    fail("MERGE_STORAGE_VERSION_MISMATCH");
  }

  const keyOf = (record: PaisaruleMergeRecord): string =>
    JSON.stringify([record.entity, record.id]);

  const existing = new Map(
    target.records.map((record) => [keyOf(record), record])
  );

  const counts = new Map<string, PaisaruleMergeCount>();

  function countFor(entity: string): PaisaruleMergeCount {
    let count = counts.get(entity);

    if (!count) {
      count = {
        entity,
        existing: 0,
        backup: 0,
        matched: 0,
        newRecords: 0,
        conflicts: 0,
        final: 0,
      };

      counts.set(entity, count);
    }

    return count;
  }

  for (const record of target.records) {
    countFor(record.entity).existing++;
  }

  const additions: PaisaruleMergeRecord[] = [];

  for (const incoming of backup.records) {
    const count = countFor(incoming.entity);
    count.backup++;

    const current = existing.get(keyOf(incoming));

    if (!current) {
      count.newRecords++;
      additions.push(incoming);
      continue;
    }

    if (canonical(current) === canonical(incoming)) {
      count.matched++;
    } else {
      count.conflicts++;
    }
  }

  let matchedCount = 0;
  let newCount = 0;
  let conflictCount = 0;

  for (const count of counts.values()) {
    count.final = count.existing + count.newRecords;
    matchedCount += count.matched;
    newCount += count.newRecords;
    conflictCount += count.conflicts;
  }

  const canConfirm = conflictCount === 0;

  const merged: PaisaruleMergeStorage | null =
    canConfirm
      ? {
          ...target,
          records: [...target.records, ...additions],
        }
      : null;

  return {
    canConfirm,
    existingCount: target.records.length,
    backupCount: backup.records.length,
    matchedCount,
    newCount,
    conflictCount,
    finalCount: target.records.length + newCount,
    counts: [...counts.values()].sort((a, b) =>
      a.entity.localeCompare(b.entity)
    ),
    merged,
  };
}