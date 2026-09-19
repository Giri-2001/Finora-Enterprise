/* ============================================================
   FINORA ENTERPRISE OS
   BRANCH DEVICE TRUST STORE

   RESPONSIBILITY:

   - Persist recipient device trust only on the current device
   - Bind trust to exact branch + Portable Auth generation
   - Bind trust to exact native installation public identity
   - Keep the trust store encrypted with Electron safeStorage
   - Fail closed on malformed, duplicate or undecryptable state

   SECURITY:

   - MAIN PROCESS ONLY.
   - This store never contains a native private key.
   - This store never contains Password or Security Code.
   - This store never mutates the Portable Branch Auth carrier.
   - USB is never a device-trust authority.
   - Renderer supplies no filesystem path.
   - Missing state means no trusted-device authority.
   - A caller must separately prove Password / Security Code
     authority before creating or replacing a trust record.
   - The low-level persistence API does not itself authorize a
     device. Login authorization belongs to a separate service.

   PHYSICAL PATH:

   <userData>/FINORA/auth/finora-device-trust.bin

   VERSION : 1.0
   STATUS  : Foundation
============================================================ */

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdir,
  readFile,
  rename,
  rm,
} from "node:fs/promises";

import {
  dirname,
  join,
} from "node:path";

import {
  randomUUID,
} from "node:crypto";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_BRANCH_DEVICE_TRUST_FORMAT =
  "FINORA_BRANCH_DEVICE_TRUST" as const;

export const FINORA_BRANCH_DEVICE_TRUST_LEGACY_SCHEMA_VERSION = 1 as const;
export const FINORA_BRANCH_DEVICE_TRUST_LEGACY_RECORD_SCHEMA_VERSION = 1 as const;

export const FINORA_BRANCH_DEVICE_TRUST_SCHEMA_VERSION =
  2 as const;

export const FINORA_BRANCH_DEVICE_TRUST_RECORD_SCHEMA_VERSION =
  2 as const;

const FINORA_BRANCH_DEVICE_TRUST_MAX_RECORDS =
  64;

const FINORA_BRANCH_DEVICE_TRUST_MAX_FILE_BYTES =
  128 *
  1024;

const DIRECTORY_FINORA =
  "FINORA";

const DIRECTORY_AUTH =
  "auth";

const DEVICE_TRUST_FILE_NAME =
  "finora-device-trust.bin";

// ============================================================
// CONTRACT
// ============================================================

export type FinoraBranchDeviceTrustStorageMode =
  | "LOCAL"
  | "USB";

export type FinoraBranchDeviceTrustDataContext =
  | "REAL"
  | "DEMO";

export type FinoraBranchDeviceTrustPlatform =
  | "WINDOWS"
  | "ANDROID";

export interface FinoraBranchDeviceTrustRecordV1 {
  authStateId:
    string;

  userId:
    string;

  canonicalUsername:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    FinoraBranchDeviceTrustStorageMode;

  dataContext:
    FinoraBranchDeviceTrustDataContext;

  demoId?:
    string;

  authGeneration:
    number;

  /**
   * SHA-256 of the canonical serialized Portable Branch Auth
   * envelope that authorized this device trust.
   *
   * Trusted-device fast-path lookup MUST match this exact value.
   * Any Portable Auth replacement / rotation changes the
   * fingerprint and therefore invalidates stale trust.
   */
  portableAuthFingerprintAlgorithm:
    "SHA256";

  portableAuthFingerprint:
    string;

  platform:
    FinoraBranchDeviceTrustPlatform;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    string;

  publicKeyFingerprint:
    string;

  trustedAt:
    string;

  updatedAt:
    string;

  schemaVersion:
    typeof FINORA_BRANCH_DEVICE_TRUST_LEGACY_RECORD_SCHEMA_VERSION;
}

export interface FinoraBranchDeviceTrustLifecycleV2 {
  status: "ACTIVE" | "REVOKED";
  revokedAt?: string;
}

export interface FinoraBranchDeviceTrustRecordV2 extends Omit<FinoraBranchDeviceTrustRecordV1, "schemaVersion">, FinoraBranchDeviceTrustLifecycleV2 {
  schemaVersion: 2;
}

export interface FinoraBranchDeviceTrustStoreStateV2 {
  format: typeof FINORA_BRANCH_DEVICE_TRUST_FORMAT;
  schemaVersion: 2;
  records: FinoraBranchDeviceTrustRecordV2[];
  updatedAt: string;
}

export function normalizeFinoraBranchDeviceTrustRecordV1(record: FinoraBranchDeviceTrustRecordV1): FinoraBranchDeviceTrustRecordV2 {
  const { schemaVersion: _legacySchemaVersion, ...rest } = record;
  return { ...rest, status: "ACTIVE", schemaVersion: 2 };
}

export type FinoraBranchDeviceTrustRecord = FinoraBranchDeviceTrustRecordV2;
export type FinoraBranchDeviceTrustStoreState = FinoraBranchDeviceTrustStoreStateV2;

export interface FinoraBranchDeviceTrustStoreStateV1 {
  format:
    typeof FINORA_BRANCH_DEVICE_TRUST_FORMAT;

  schemaVersion:
    typeof FINORA_BRANCH_DEVICE_TRUST_LEGACY_SCHEMA_VERSION;

  records:
    FinoraBranchDeviceTrustRecordV1[];

  updatedAt:
    string;
}

export function normalizeFinoraBranchDeviceTrustStoreStateV1(state: FinoraBranchDeviceTrustStoreStateV1): FinoraBranchDeviceTrustStoreStateV2 {
  return { format: state.format, schemaVersion: 2, records: state.records.map(normalizeFinoraBranchDeviceTrustRecordV1), updatedAt: state.updatedAt };
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

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

function hasExactKeys(
  value:
    Record<string, unknown>,
  expected:
    readonly string[],
): boolean {
  const actual =
    Object.keys(
      value,
    ).sort();

  const sortedExpected =
    [
      ...expected,
    ].sort();

  return (
    actual.length ===
      sortedExpected.length &&
    actual.every(
      (
        key,
        index,
      ) =>
        key ===
          sortedExpected[
            index
          ],
    )
  );
}

function isNonEmptyString(
  value:
    unknown,
): value is string {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}

function isBoundedString(
  value:
    unknown,
  maxLength:
    number,
): value is string {
  return (
    isNonEmptyString(
      value,
    ) &&
    value.length <=
      maxLength
  );
}

function isCanonicalUsername(
  value:
    unknown,
): value is string {
  return (
    isBoundedString(
      value,
      256,
    ) &&
    value ===
      value.trim() &&
    value ===
      value.toLowerCase()
  );
}

function isTimestamp(
  value:
    unknown,
): value is string {
  if (
    typeof value !==
      "string"
  ) {
    return false;
  }

  const parsed =
    Date.parse(
      value,
    );

  if (
    !Number.isFinite(
      parsed,
    )
  ) {
    return false;
  }

  return (
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}

function isPositiveInteger(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isSafeInteger(
      value,
    ) &&
    value >=
      1
  );
}

function expectedRecordKeys(
  dataContext:
    unknown,
): readonly string[] {
  const common = [
    "authStateId",
    "userId",
    "canonicalUsername",
    "ownerId",
    "businessId",
    "branchId",
    "storageMode",
    "dataContext",
    "authGeneration",
    "portableAuthFingerprintAlgorithm",
    "portableAuthFingerprint",
    "platform",
    "installationId",
    "bindingKeyId",
    "fingerprintAlgorithm",
    "publicKeyFingerprint",
    "trustedAt",
    "updatedAt",
    "schemaVersion",
  ] as const;

  return dataContext ===
      "DEMO"
    ? [
        ...common,
        "demoId",
      ]
    : common;
}

function validateRecord(
  value:
    unknown,
): asserts value is FinoraBranchDeviceTrustRecordV1 {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "FINORA Branch Device Trust record must be an object.",
    );
  }

  if (
    !hasExactKeys(
      value,
      expectedRecordKeys(
        value.dataContext,
      ),
    )
  ) {
    throw new Error(
      "FINORA Branch Device Trust record contains unexpected fields.",
    );
  }

  if (
    !isBoundedString(
      value.authStateId,
      512,
    ) ||
    !isBoundedString(
      value.userId,
      512,
    ) ||
    !isCanonicalUsername(
      value.canonicalUsername,
    ) ||
    !isBoundedString(
      value.ownerId,
      512,
    ) ||
    !isBoundedString(
      value.businessId,
      512,
    ) ||
    !isBoundedString(
      value.branchId,
      512,
    )
  ) {
    throw new Error(
      "FINORA Branch Device Trust identity scope is invalid.",
    );
  }

  if (
    value.storageMode !==
      "LOCAL" &&
    value.storageMode !==
      "USB"
  ) {
    throw new Error(
      "FINORA Branch Device Trust storage mode is invalid.",
    );
  }

  if (
    value.dataContext !==
      "REAL" &&
    value.dataContext !==
      "DEMO"
  ) {
    throw new Error(
      "FINORA Branch Device Trust data context is invalid.",
    );
  }

  if (
    value.dataContext ===
      "DEMO"
  ) {
    if (
      !isBoundedString(
        value.demoId,
        512,
      )
    ) {
      throw new Error(
        "FINORA DEMO Branch Device Trust record requires demoId.",
      );
    }
  }
  else if (
    Object.prototype.hasOwnProperty.call(
      value,
      "demoId",
    )
  ) {
    throw new Error(
      "FINORA REAL Branch Device Trust record cannot contain demoId.",
    );
  }

  if (
    !isPositiveInteger(
      value.authGeneration,
    )
  ) {
    throw new Error(
      "FINORA Branch Device Trust auth generation is invalid.",
    );
  }

  if (
    value.portableAuthFingerprintAlgorithm !==
      "SHA256" ||
    typeof value.portableAuthFingerprint !==
      "string" ||
    !/^[a-f0-9]{64}$/.test(
      value.portableAuthFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Branch Device Trust Portable Auth fingerprint is invalid.",
    );
  }

  if (
    value.platform !==
      "WINDOWS" &&
    value.platform !==
      "ANDROID"
  ) {
    throw new Error(
      "FINORA Branch Device Trust platform is invalid.",
    );
  }

  if (
    !isBoundedString(
      value.installationId,
      1024,
    ) ||
    !isBoundedString(
      value.bindingKeyId,
      1024,
    ) ||
    !isBoundedString(
      value.fingerprintAlgorithm,
      128,
    ) ||
    !isBoundedString(
      value.publicKeyFingerprint,
      2048,
    )
  ) {
    throw new Error(
      "FINORA Branch Device Trust native binding identity is invalid.",
    );
  }

  if (
    !isTimestamp(
      value.trustedAt,
    ) ||
    !isTimestamp(
      value.updatedAt,
    ) ||
    Date.parse(
      value.updatedAt,
    ) <
      Date.parse(
        value.trustedAt,
      )
  ) {
    throw new Error(
      "FINORA Branch Device Trust timestamps are invalid.",
    );
  }

  if (
    value.schemaVersion !==
      FINORA_BRANCH_DEVICE_TRUST_LEGACY_RECORD_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Branch Device Trust record schema version is unsupported.",
    );
  }
}

function validateRecordV2(value: unknown): asserts value is FinoraBranchDeviceTrustRecordV2 {
  if (!isRecord(value)) throw new Error("FINORA Branch Device Trust V2 record must be an object.");
  const keys = value.status === "REVOKED" ? [...expectedRecordKeys(value.dataContext), "status", "revokedAt"] : [...expectedRecordKeys(value.dataContext), "status"];
  if (!hasExactKeys(value, keys)) throw new Error("FINORA Branch Device Trust V2 record contains unexpected fields.");
  const { status: _status, revokedAt: _revokedAt, ...legacy } = value;
  validateRecord({ ...legacy, schemaVersion: FINORA_BRANCH_DEVICE_TRUST_LEGACY_RECORD_SCHEMA_VERSION });
  if (value.schemaVersion !== 2) throw new Error("FINORA Branch Device Trust V2 record schema version is unsupported.");
  if (value.status === "ACTIVE") return;
  if (value.status !== "REVOKED" || !isTimestamp(value.revokedAt)) throw new Error("FINORA REVOKED Device Trust record requires canonical revokedAt.");
  if (typeof value.trustedAt !== "string" || typeof value.updatedAt !== "string" || Date.parse(value.revokedAt) < Date.parse(value.trustedAt) || Date.parse(value.revokedAt) > Date.parse(value.updatedAt)) throw new Error("FINORA Device Trust revocation timestamp is invalid.");
}

function createDeviceTrustKey(
  record:
    FinoraBranchDeviceTrustRecordV1,
): string {
  return [
    record.ownerId,
    record.businessId,
    record.branchId,
    record.authStateId,
    String(
      record.authGeneration,
    ),
    record.portableAuthFingerprintAlgorithm,
    record.portableAuthFingerprint,
    record.platform,
    record.installationId,
    record.bindingKeyId,
    record.fingerprintAlgorithm,
    record.publicKeyFingerprint,
  ].join(
    "\u0000",
  );
}

function assertSafeStorageAvailable():
  void {
  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA Branch Device Trust encryption is unavailable.",
    );
  }
}

// ============================================================
// VALIDATION
// ============================================================

export function normalizeFinoraBranchDeviceTrustStoreState(value: unknown): FinoraBranchDeviceTrustStoreState {
  if (!isRecord(value)) throw new Error("FINORA Branch Device Trust store must be an object.");
  if (value.schemaVersion === FINORA_BRANCH_DEVICE_TRUST_LEGACY_SCHEMA_VERSION) {
    validateFinoraBranchDeviceTrustStoreStateV1(value);
    return normalizeFinoraBranchDeviceTrustStoreStateV1(value);
  }
  if (value.schemaVersion === 2) {
    validateFinoraBranchDeviceTrustStoreStateV2(value);
    return value;
  }
  throw new Error("FINORA Branch Device Trust store schema version is unsupported.");
}

export function validateFinoraBranchDeviceTrustStoreStateV2(value: unknown): asserts value is FinoraBranchDeviceTrustStoreStateV2 {
  if (!isRecord(value)) throw new Error("FINORA Branch Device Trust V2 store must be an object.");
  if (!hasExactKeys(value, ["format", "schemaVersion", "records", "updatedAt"])) throw new Error("FINORA Branch Device Trust V2 store contains unexpected fields.");
  if (value.format !== FINORA_BRANCH_DEVICE_TRUST_FORMAT || value.schemaVersion !== 2) throw new Error("FINORA Branch Device Trust V2 store format is unsupported.");
  if (!Array.isArray(value.records) || value.records.length > FINORA_BRANCH_DEVICE_TRUST_MAX_RECORDS) throw new Error("FINORA Branch Device Trust V2 record collection is invalid.");
  if (!isTimestamp(value.updatedAt)) throw new Error("FINORA Branch Device Trust V2 store timestamp is invalid.");
  const deviceTrustKeys = new Set<string>();
  for (const item of value.records) {
    validateRecordV2(item);
    if (Date.parse(item.updatedAt) > Date.parse(value.updatedAt)) throw new Error("FINORA Branch Device Trust V2 record is newer than its store.");
    const key = [item.ownerId,item.businessId,item.branchId,item.authStateId,String(item.authGeneration),item.portableAuthFingerprintAlgorithm,item.portableAuthFingerprint,item.platform,item.installationId,item.bindingKeyId,item.fingerprintAlgorithm,item.publicKeyFingerprint].join("\u0000");
    if (deviceTrustKeys.has(key)) throw new Error("FINORA Branch Device Trust V2 store contains a duplicate exact device authority.");
    deviceTrustKeys.add(key);
  }
}

export function validateFinoraBranchDeviceTrustStoreStateV1(
  value:
    unknown,
): asserts value is FinoraBranchDeviceTrustStoreStateV1 {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "FINORA Branch Device Trust store must be an object.",
    );
  }

  if (
    !hasExactKeys(
      value,
      [
        "format",
        "schemaVersion",
        "records",
        "updatedAt",
      ],
    )
  ) {
    throw new Error(
      "FINORA Branch Device Trust store contains unexpected fields.",
    );
  }

  if (
    value.format !==
      FINORA_BRANCH_DEVICE_TRUST_FORMAT ||
    value.schemaVersion !==
      FINORA_BRANCH_DEVICE_TRUST_LEGACY_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Branch Device Trust store format is unsupported.",
    );
  }

  if (
    !Array.isArray(
      value.records,
    ) ||
    value.records.length >
      FINORA_BRANCH_DEVICE_TRUST_MAX_RECORDS
  ) {
    throw new Error(
      "FINORA Branch Device Trust record collection is invalid.",
    );
  }

  if (
    !isTimestamp(
      value.updatedAt,
    )
  ) {
    throw new Error(
      "FINORA Branch Device Trust store timestamp is invalid.",
    );
  }

  const deviceTrustKeys =
    new Set<string>();

  for (
    const item of
      value.records
  ) {
    validateRecord(
      item,
    );

    if (
      Date.parse(
        item.updatedAt,
      ) >
        Date.parse(
          value.updatedAt,
        )
    ) {
      throw new Error(
        "FINORA Branch Device Trust record is newer than its store.",
      );
    }

    const deviceTrustKey =
      createDeviceTrustKey(
        item,
      );

    if (
      deviceTrustKeys.has(
        deviceTrustKey,
      )
    ) {
      throw new Error(
        "FINORA Branch Device Trust store contains a duplicate exact device authority.",
      );
    }

    deviceTrustKeys.add(
      deviceTrustKey,
    );
  }
}

// ============================================================
// PHYSICAL PATH
// ============================================================

export function getFinoraBranchDeviceTrustStorePath():
  string {
  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY_FINORA,
    DIRECTORY_AUTH,
    DEVICE_TRUST_FILE_NAME,
  );
}

// ============================================================
// LOAD
//
// Missing file means no trusted-device authority.
// ============================================================

export async function loadFinoraBranchDeviceTrustStore():
  Promise<
    FinoraBranchDeviceTrustStoreState | undefined
  > {
  assertSafeStorageAvailable();

  const storePath =
    getFinoraBranchDeviceTrustStorePath();

  let encrypted:
    Buffer;

  try {
    encrypted =
      await readFile(
        storePath,
      );
  }
  catch (
    error
  ) {
    const code =
      isRecord(
        error,
      ) &&
      typeof error.code ===
        "string"
        ? error.code
        : undefined;

    if (
      code ===
        "ENOENT"
    ) {
      return undefined;
    }

    throw error;
  }

  if (
    encrypted.length ===
      0 ||
    encrypted.length >
      FINORA_BRANCH_DEVICE_TRUST_MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Branch Device Trust store size is invalid.",
    );
  }

  let decrypted:
    string;

  try {
    decrypted =
      safeStorage.decryptString(
        encrypted,
      );
  }
  catch {
    throw new Error(
      "FINORA Branch Device Trust store could not be decrypted.",
    );
  }

  if (
    decrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA Branch Device Trust store decrypted to an empty payload.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        decrypted,
      );
  }
  catch {
    throw new Error(
      "FINORA Branch Device Trust store contains invalid JSON.",
    );
  }

  return normalizeFinoraBranchDeviceTrustStoreState(
    parsed,
  );
}

// ============================================================
// PERSIST COMPLETE VALIDATED STATE
//
// This is deliberately a low-level primitive.
//
// It does NOT decide whether a device is trusted.
// A separate authorization service must prove the branch
// Password/Security Code authority before changing this state.
// ============================================================

export async function persistFinoraBranchDeviceTrustStore(
  state:
    FinoraBranchDeviceTrustStoreState,
): Promise<void> {
  validateFinoraBranchDeviceTrustStoreStateV2(
    state,
  );

  assertSafeStorageAvailable();

  const storePath =
    getFinoraBranchDeviceTrustStorePath();

  const parentDirectory =
    dirname(
      storePath,
    );

  await mkdir(
    parentDirectory,
    {
      recursive:
        true,

      mode:
        0o700,
    },
  );

  const encrypted =
    safeStorage.encryptString(
      JSON.stringify(
        state,
      ),
    );

  if (
    encrypted.length ===
      0 ||
    encrypted.length >
      FINORA_BRANCH_DEVICE_TRUST_MAX_FILE_BYTES
  ) {
    throw new Error(
      "FINORA Branch Device Trust encryption produced an invalid payload size.",
    );
  }

  const temporaryPath =
    `${storePath}.${randomUUID()}.tmp`;

  try {
    await import("node:fs/promises")
      .then(
        (
          fs,
        ) =>
          fs.writeFile(
            temporaryPath,
            encrypted,
            {
              flag:
                "wx",

              mode:
                0o600,
            },
          ),
      );

    await rename(
      temporaryPath,
      storePath,
    );
  }
  catch (
    error
  ) {
    await rm(
      temporaryPath,
      {
        force:
          true,
      },
    );

    throw error;
  }
}

// ============================================================
// END
// ============================================================
