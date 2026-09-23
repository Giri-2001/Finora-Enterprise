// ============================================================
// FINORA ENTERPRISE OS
// FULL BRANCH BACKUP V2
// EXACT REAL TENANT RESTORE STORAGE PLANNER
// ============================================================
//
// PURE / NO FILESYSTEM I/O.
//
// Given:
// - current target storage package records;
// - authenticated/decrypted Full Backup REAL snapshot;
// - expected exact branch scope;
//
// produce one complete replacement package record array.
//
// Rules:
//
// - exact REAL tenant authority = ownerId + businessId + branchId;
// - every existing exact REAL target record is removed;
// - backup snapshot becomes the complete exact REAL target state;
// - sibling tenant records are preserved;
// - DEMO records are preserved but never restored from backup;
// - ambiguous/unscoped current records fail closed;
// - snapshot scope mismatch fails closed;
// - snapshot DEMO record fails closed;
// - output is detached from both inputs;
// - deterministic SHA-256 digest supports post-write readback.
// ============================================================

import {
  createHash,
} from "node:crypto";

import type {
  FinoraFullBranchBackupScopeV2,
  FinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

import {
  validateFinoraFullBranchBackupScopeV2,
  validateFinoraFullBranchRealSnapshotV1,
} from "./finoraFullBranchBackupContract.js";

export interface FinoraFullBranchRestorePersistedRecord {
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

export type FinoraFullBranchRestoreStoragePlanErrorCode =
  | "INVALID_CURRENT_RECORD"
  | "AMBIGUOUS_CURRENT_SCOPE"
  | "SNAPSHOT_SCOPE_MISMATCH"
  | "INVALID_SNAPSHOT_RECORD"
  | "SNAPSHOT_DEMO_FORBIDDEN";

export class FinoraFullBranchRestoreStoragePlanError
  extends Error {
  readonly code:
    FinoraFullBranchRestoreStoragePlanErrorCode;

  constructor(
    code:
      FinoraFullBranchRestoreStoragePlanErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "FinoraFullBranchRestoreStoragePlanError";

    this.code =
      code;
  }
}

export interface FinoraFullBranchExactRealRestorePlan {
  branchScope:
    FinoraFullBranchBackupScopeV2;

  snapshotRecordCount:
    number;

  removedExistingExactRealCount:
    number;

  preservedRecordCount:
    number;

  finalRecordCount:
    number;

  exactRealDigestSha256:
    string;

  records:
    FinoraFullBranchRestorePersistedRecord[];
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

function requiredText(
  source:
    Record<string, unknown>,
  key:
    string,
  mode:
    "CURRENT" | "SNAPSHOT",
): string {
  const value =
    source[key];

  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new FinoraFullBranchRestoreStoragePlanError(
      mode ===
        "CURRENT"
        ? "AMBIGUOUS_CURRENT_SCOPE"
        : "INVALID_SNAPSHOT_RECORD",
      `FINORA ${mode.toLowerCase()} record has invalid ${key}.`,
    );
  }

  return value;
}

function ordinaryText(
  source:
    Record<string, unknown>,
  key:
    string,
  mode:
    "CURRENT" | "SNAPSHOT",
): string {
  const value =
    source[key];

  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new FinoraFullBranchRestoreStoragePlanError(
      mode ===
        "CURRENT"
        ? "INVALID_CURRENT_RECORD"
        : "INVALID_SNAPSHOT_RECORD",
      `FINORA ${mode.toLowerCase()} record has invalid ${key}.`,
    );
  }

  return value;
}

function timestamp(
  source:
    Record<string, unknown>,
  key:
    string,
  mode:
    "CURRENT" | "SNAPSHOT",
): string {
  const value =
    ordinaryText(
      source,
      key,
      mode,
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
    throw new FinoraFullBranchRestoreStoragePlanError(
      mode ===
        "CURRENT"
        ? "INVALID_CURRENT_RECORD"
        : "INVALID_SNAPSHOT_RECORD",
      `FINORA ${mode.toLowerCase()} record has invalid ${key}.`,
    );
  }

  return value;
}

function optionalDemoId(
  source:
    Record<string, unknown>,
  mode:
    "CURRENT" | "SNAPSHOT",
): string | undefined {
  if (
    !Object.prototype.hasOwnProperty.call(
      source,
      "demoId",
    )
  ) {
    return undefined;
  }

  const value =
    source.demoId;

  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new FinoraFullBranchRestoreStoragePlanError(
      mode ===
        "CURRENT"
        ? "INVALID_CURRENT_RECORD"
        : "INVALID_SNAPSHOT_RECORD",
      `FINORA ${mode.toLowerCase()} record has invalid demoId.`,
    );
  }

  return value;
}

function normalize(
  value:
    unknown,
  mode:
    "CURRENT" | "SNAPSHOT",
): FinoraFullBranchRestorePersistedRecord {
  if (
    !isRecord(
      value,
    ) ||
    !Object.prototype.hasOwnProperty.call(
      value,
      "data",
    )
  ) {
    throw new FinoraFullBranchRestoreStoragePlanError(
      mode ===
        "CURRENT"
        ? "INVALID_CURRENT_RECORD"
        : "INVALID_SNAPSHOT_RECORD",
      `FINORA ${mode.toLowerCase()} storage record is invalid.`,
    );
  }

  const ownerId =
    requiredText(
      value,
      "ownerId",
      mode,
    );

  const businessId =
    requiredText(
      value,
      "businessId",
      mode,
    );

  const branchId =
    requiredText(
      value,
      "branchId",
      mode,
    );

  const demoId =
    optionalDemoId(
      value,
      mode,
    );

  return {
    id:
      ordinaryText(
        value,
        "id",
        mode,
      ),

    entity:
      ordinaryText(
        value,
        "entity",
        mode,
      ),

    data:
      structuredClone(
        value.data,
      ),

    createdAt:
      timestamp(
        value,
        "createdAt",
        mode,
      ),

    updatedAt:
      timestamp(
        value,
        "updatedAt",
        mode,
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

function sameScope(
  left:
    FinoraFullBranchBackupScopeV2,
  right:
    FinoraFullBranchBackupScopeV2,
): boolean {
  return (
    left.ownerId ===
      right.ownerId &&
    left.businessId ===
      right.businessId &&
    left.branchId ===
      right.branchId
  );
}

function matchesScope(
  record:
    FinoraFullBranchRestorePersistedRecord,
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

function isExactReal(
  record:
    FinoraFullBranchRestorePersistedRecord,
  scope:
    FinoraFullBranchBackupScopeV2,
): boolean {
  return (
    matchesScope(
      record,
      scope,
    ) &&
    record.demoId ===
      undefined
  );
}


function canonicalJson(
  value:
    unknown,
): string {
  if (
    value ===
      null
  ) {
    return "null";
  }

  if (
    typeof value ===
      "string"
  ) {
    return JSON.stringify(
      value,
    );
  }

  if (
    typeof value ===
      "boolean"
  ) {
    return value
      ? "true"
      : "false";
  }

  if (
    typeof value ===
      "number"
  ) {
    if (
      !Number.isFinite(
        value,
      )
    ) {
      throw new Error(
        "FINORA restore digest encountered a non-finite number.",
      );
    }

    return JSON.stringify(
      value,
    );
  }

  if (
    Array.isArray(
      value,
    )
  ) {
    return (
      "[" +
      value
        .map(
          (
            item,
          ) =>
            canonicalJson(
              item,
            ),
        )
        .join(
          ",",
        ) +
      "]"
    );
  }

  if (
    isRecord(
      value,
    )
  ) {
    const keys =
      Object.keys(
        value,
      )
        .filter(
          (
            key,
          ) =>
            value[key] !==
              undefined,
        )
        .sort();

    return (
      "{" +
      keys
        .map(
          (
            key,
          ) =>
            (
              JSON.stringify(
                key,
              ) +
              ":" +
              canonicalJson(
                value[key],
              )
            ),
        )
        .join(
          ",",
        ) +
      "}"
    );
  }

  throw new Error(
    "FINORA restore digest encountered unsupported data.",
  );
}

export function calculateFinoraFullBranchExactRealDigest(
  records:
    readonly FinoraFullBranchRestorePersistedRecord[],
  scope:
    FinoraFullBranchBackupScopeV2,
): string {
  validateFinoraFullBranchBackupScopeV2(
    scope,
  );

  const exactReal =
    records
      .filter(
        (
          record,
        ) =>
          isExactReal(
            record,
            scope,
          ),
      )
      .map(
        (
          record,
        ) =>
          structuredClone(
            record,
          ),
      );

  return createHash(
    "sha256",
  )
    .update(
      canonicalJson(
        exactReal,
      ),
      "utf8",
    )
    .digest(
      "hex",
    )
    .toUpperCase();
}

export function planFinoraFullBranchExactRealRestore(
  input: {
    currentRecords:
      unknown[];

    snapshot:
      FinoraFullBranchRealSnapshotV1;

    expectedScope:
      FinoraFullBranchBackupScopeV2;
  },
): FinoraFullBranchExactRealRestorePlan {
  validateFinoraFullBranchBackupScopeV2(
    input.expectedScope,
  );

  validateFinoraFullBranchRealSnapshotV1(
    input.snapshot,
  );

  if (
    !sameScope(
      input.snapshot.branchScope,
      input.expectedScope,
    )
  ) {
    throw new FinoraFullBranchRestoreStoragePlanError(
      "SNAPSHOT_SCOPE_MISMATCH",
      "FINORA Full Branch Backup snapshot scope does not match the authenticated restore scope.",
    );
  }

  if (
    !Array.isArray(
      input.currentRecords,
    )
  ) {
    throw new FinoraFullBranchRestoreStoragePlanError(
      "INVALID_CURRENT_RECORD",
      "FINORA target storage records must be an array.",
    );
  }

  const current =
    input.currentRecords.map(
      (
        record,
      ) =>
        normalize(
          record,
          "CURRENT",
        ),
    );

  const restored =
    input.snapshot.records.map(
      (
        record,
      ) =>
        normalize(
          record,
          "SNAPSHOT",
        ),
    );

  for (
    const record
    of restored
  ) {
    if (
      record.demoId !==
        undefined
    ) {
      throw new FinoraFullBranchRestoreStoragePlanError(
        "SNAPSHOT_DEMO_FORBIDDEN",
        "DEMO data is forbidden inside a FINORA Full Branch Backup restore snapshot.",
      );
    }

    if (
      !matchesScope(
        record,
        input.expectedScope,
      )
    ) {
      throw new FinoraFullBranchRestoreStoragePlanError(
        "SNAPSHOT_SCOPE_MISMATCH",
        "FINORA backup contains a record outside the authenticated restore scope.",
      );
    }
  }

  const preserved =
    current.filter(
      (
        record,
      ) =>
        !isExactReal(
          record,
          input.expectedScope,
        ),
    );

  const removedExistingExactRealCount =
    current.length -
    preserved.length;

  const finalRecords = [
    ...preserved.map(
      (
        record,
      ) =>
        structuredClone(
          record,
        ),
    ),

    ...restored.map(
      (
        record,
      ) =>
        structuredClone(
          record,
        ),
    ),
  ];

  const digest =
    calculateFinoraFullBranchExactRealDigest(
      finalRecords,
      input.expectedScope,
    );

  return {
    branchScope:
      structuredClone(
        input.expectedScope,
      ),

    snapshotRecordCount:
      restored.length,

    removedExistingExactRealCount,

    preservedRecordCount:
      preserved.length,

    finalRecordCount:
      finalRecords.length,

    exactRealDigestSha256:
      digest,

    records:
      finalRecords,
  };
}