// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2
// EXACT REAL TENANT STORAGE SNAPSHOT AUTHORITY
// ============================================================
//
// PURPOSE:
//
// Convert one privileged FINORA storage-package record set into
// one exact REAL branch snapshot.
//
// SECURITY / PORTABILITY RULES:
//
// - Exact authority = ownerId + businessId + branchId.
// - REAL only.
// - DEMO records are never exported.
// - Fully scoped sibling tenants are ignored.
// - Missing / partial outer tenant scope fails closed.
// - Historical tenant-looking fields inside record.data are
//   provenance only and are preserved without interpretation.
// - Source records are cloned before entering the backup.
// ============================================================

import type {
  FinoraFullBranchBackupScopeV2,
  FinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import {
  createFinoraFullBranchRealSnapshotV1,
  validateFinoraFullBranchBackupScopeV2,
} from "./finoraFullBranchBackupContract.js";

export interface FinoraFullBranchPersistedStorageRecord {
  id:
    string;

  entity:
    string;

  data:
    unknown;

  createdAt:
    string;

  updatedAt:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  demoId?:
    string;
}

export type FinoraFullBranchStorageSnapshotErrorCode =
  | "INVALID_SOURCE_RECORD"
  | "AMBIGUOUS_SOURCE_SCOPE";

export class FinoraFullBranchStorageSnapshotError
  extends Error {
  readonly code:
    FinoraFullBranchStorageSnapshotErrorCode;

  constructor(
    code:
      FinoraFullBranchStorageSnapshotErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "FinoraFullBranchStorageSnapshotError";

    this.code =
      code;
  }
}

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function readRequiredText(
  record:
    Record<string, unknown>,
  key:
    string,
): string {
  const value =
    record[key];

  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new FinoraFullBranchStorageSnapshotError(
      "AMBIGUOUS_SOURCE_SCOPE",
      `FINORA source record is missing authoritative ${key}.`,
    );
  }

  return value;
}

function readRecordText(
  record:
    Record<string, unknown>,
  key:
    string,
): string {
  const value =
    record[key];

  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new FinoraFullBranchStorageSnapshotError(
      "INVALID_SOURCE_RECORD",
      `FINORA source record has invalid ${key}.`,
    );
  }

  return value;
}

function readCanonicalTimestamp(
  record:
    Record<string, unknown>,
  key:
    string,
): string {
  const value =
    readRecordText(
      record,
      key,
    );

  const parsed =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    ) ||
    new Date(
      parsed,
    ).toISOString() !==
      value
  ) {
    throw new FinoraFullBranchStorageSnapshotError(
      "INVALID_SOURCE_RECORD",
      `FINORA source record has invalid ${key}.`,
    );
  }

  return value;
}

function readDemoId(
  record:
    Record<string, unknown>,
): string | undefined {
  if (
    !Object.prototype.hasOwnProperty.call(
      record,
      "demoId",
    )
  ) {
    return undefined;
  }

  const value =
    record.demoId;

  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new FinoraFullBranchStorageSnapshotError(
      "INVALID_SOURCE_RECORD",
      "FINORA source record has invalid demoId.",
    );
  }

  return value;
}

function normalizeStorageRecord(
  value:
    unknown,
): FinoraFullBranchPersistedStorageRecord {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new FinoraFullBranchStorageSnapshotError(
      "INVALID_SOURCE_RECORD",
      "FINORA source storage record is invalid.",
    );
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      value,
      "data",
    )
  ) {
    throw new FinoraFullBranchStorageSnapshotError(
      "INVALID_SOURCE_RECORD",
      "FINORA source storage record is missing data.",
    );
  }

  const ownerId =
    readRequiredText(
      value,
      "ownerId",
    );

  const businessId =
    readRequiredText(
      value,
      "businessId",
    );

  const branchId =
    readRequiredText(
      value,
      "branchId",
    );

  const demoId =
    readDemoId(
      value,
    );

  return {
    id:
      readRecordText(
        value,
        "id",
      ),

    entity:
      readRecordText(
        value,
        "entity",
      ),

    data:
      structuredClone(
        value.data,
      ),

    createdAt:
      readCanonicalTimestamp(
        value,
        "createdAt",
      ),

    updatedAt:
      readCanonicalTimestamp(
        value,
        "updatedAt",
      ),

    ownerId,
    businessId,
    branchId,

    ...(
      demoId ===
        undefined
        ? {}
        : {
            demoId,
          }
    ),
  };
}

function scopeMatches(
  record:
    FinoraFullBranchPersistedStorageRecord,
  scope:
    FinoraFullBranchBackupScopeV2,
): boolean {
  return (
    record.ownerId ===
      scope.ownerId &&
    record.businessId ===
      scope.businessId &&
    record.branchId ===
      scope.branchId
  );
}

export function captureFinoraFullBranchRealStorageSnapshot(
  input: {
    exportedAt:
      string;

    branchScope:
      FinoraFullBranchBackupScopeV2;

    records:
      unknown[];
  },
): FinoraFullBranchRealSnapshotV1 {
  validateFinoraFullBranchBackupScopeV2(
    input.branchScope,
  );

  if (
    !Array.isArray(
      input.records,
    )
  ) {
    throw new FinoraFullBranchStorageSnapshotError(
      "INVALID_SOURCE_RECORD",
      "FINORA source storage records must be an array.",
    );
  }

  const selected:
    FinoraFullBranchPersistedStorageRecord[] =
    [];

  for (
    const sourceRecord
    of input.records
  ) {
    const normalized =
      normalizeStorageRecord(
        sourceRecord,
      );

    /*
     * DEMO is explicitly outside the Full Branch Backup.
     *
     * This applies even when the DEMO record carries the same
     * owner/business/branch tuple.
     */
    if (
      normalized.demoId !==
        undefined
    ) {
      continue;
    }

    /*
     * A fully scoped sibling tenant is valid shared-storage
     * residue, but it does not belong to this backup.
     */
    if (
      !scopeMatches(
        normalized,
        input.branchScope,
      )
    ) {
      continue;
    }

    selected.push(
      normalized,
    );
  }

  return createFinoraFullBranchRealSnapshotV1({
    exportedAt:
      input.exportedAt,

    branchScope: {
      ownerId:
        input.branchScope.ownerId,

      businessId:
        input.branchScope.businessId,

      branchId:
        input.branchScope.branchId,
    },

    records:
      selected,
  });
}