import {
  app,
  safeStorage,
} from "electron";

import {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  dirname,
  join,
} from "node:path";

import {
  assertFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,
  FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_ID_PREFIX,
} from "./finoraBranchCertificationRotationContract.js";

// ============================================================
// CONTRACT
// ============================================================

export const FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_SCHEMA_VERSION =
  1 as const;

export const FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_STATE =
  "PENDING_CONTROL_CENTER_APPROVAL" as const;

const DIRECTORY_FINORA =
  "FINORA";

const DIRECTORY_CONTROL =
  "control";

const PENDING_FILE_NAME =
  "finora-branch-certification-rotation-pending.bin";

export interface FinoraBranchCertificationRotationPendingRecordV1 {

  state:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_STATE;

  requestId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  authStateId:
    string;

  authGeneration:
    number;

  portableAuthFingerprintAlgorithm:
    "SHA-256";

  portableAuthFingerprint:
    string;

  previousCertificationKeyId?:
    string;

  replacementCertificationKeyMaterial:
    FinoraBranchCertificationKeyMaterialV1;

  recoveryReason:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON;

  requestedAt:
    string;

  schemaVersion:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_SCHEMA_VERSION;
}

export interface PersistFinoraBranchCertificationRotationPendingInput {

  requestId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  authStateId:
    string;

  authGeneration:
    number;

  portableAuthFingerprintAlgorithm:
    "SHA-256";

  portableAuthFingerprint:
    string;

  previousCertificationKeyId?:
    string;

  replacementCertificationKeyMaterial:
    FinoraBranchCertificationKeyMaterialV1;

  recoveryReason:
    typeof FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON;

  requestedAt:
    string;
}

export interface DestroyFinoraBranchCertificationRotationPendingInput {

  requestId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  replacementCertificationKeyId:
    string;
}

// ============================================================
// BASIC VALIDATION
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

function hasText(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.length >
      0 &&
    value.length <=
      512 &&
    value.trim() ===
      value
  );
}

function isCanonicalTimestamp(
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

  return (
    Number.isFinite(
      parsed,
    ) &&
    new Date(
      parsed,
    ).toISOString() ===
      value
  );
}

function isSha256Fingerprint(
  value:
    unknown,
): value is string {

  return (
    typeof value ===
      "string" &&
    /^[0-9a-f]{64}$/.test(
      value,
    )
  );
}

function hasExactKeys(
  value:
    Record<string, unknown>,
): boolean {

  const expected = [
    "state",
    "requestId",
    "ownerId",
    "businessId",
    "branchId",
    "installationId",
    "bindingKeyId",
    "fingerprintAlgorithm",
    "publicKeyFingerprint",
    "authStateId",
    "authGeneration",
    "portableAuthFingerprintAlgorithm",
    "portableAuthFingerprint",
    "replacementCertificationKeyMaterial",
    "recoveryReason",
    "requestedAt",
    "schemaVersion",
  ];

  if (
    Object.prototype.hasOwnProperty.call(
      value,
      "previousCertificationKeyId",
    )
  ) {
    expected.push(
      "previousCertificationKeyId",
    );
  }

  expected.sort();

  const actual =
    Object.keys(
      value,
    ).sort();

  return (
    actual.length ===
      expected.length &&
    actual.every(
      (
        key,
        index,
      ) =>
        key ===
          expected[index],
    )
  );
}

function cloneRecord(
  value:
    FinoraBranchCertificationRotationPendingRecordV1,
): FinoraBranchCertificationRotationPendingRecordV1 {

  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as FinoraBranchCertificationRotationPendingRecordV1;
}

function recordsEqual(
  left:
    FinoraBranchCertificationRotationPendingRecordV1,

  right:
    FinoraBranchCertificationRotationPendingRecordV1,
): boolean {

  return (
    JSON.stringify(
      left,
    ) ===
    JSON.stringify(
      right,
    )
  );
}

export function assertFinoraBranchCertificationRotationPendingRecord(
  value:
    unknown,
): asserts value is FinoraBranchCertificationRotationPendingRecordV1 {

  if (
    !isRecord(
      value,
    ) ||
    !hasExactKeys(
      value,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending custody structure is invalid.",
    );
  }

  if (
    value.state !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_STATE ||
    value.schemaVersion !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending custody version/state is invalid.",
    );
  }

  if (
    !hasText(
      value.requestId,
    ) ||
    !value.requestId.startsWith(
      FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_ID_PREFIX,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending requestId is invalid.",
    );
  }

  if (
    !hasText(
      value.ownerId,
    ) ||
    !hasText(
      value.businessId,
    ) ||
    !hasText(
      value.branchId,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending branch scope is invalid.",
    );
  }

  if (
    !hasText(
      value.installationId,
    ) ||
    !hasText(
      value.bindingKeyId,
    ) ||
    value.fingerprintAlgorithm !==
      "SHA-256" ||
    !isSha256Fingerprint(
      value.publicKeyFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending installation identity is invalid.",
    );
  }

  const expectedBindingKeyId =
    `FINORA-BINDING-${value.publicKeyFingerprint
      .slice(
        0,
        32,
      )
      .toUpperCase()}`;

  if (
    value.bindingKeyId !==
      expectedBindingKeyId
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending bindingKeyId does not match its fingerprint.",
    );
  }

  if (
    !hasText(
      value.authStateId,
    ) ||
    !Number.isSafeInteger(
      value.authGeneration,
    ) ||
    (
      value.authGeneration as
        number
    ) <=
      0 ||
    value.portableAuthFingerprintAlgorithm !==
      "SHA-256" ||
    !isSha256Fingerprint(
      value.portableAuthFingerprint,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending Portable Auth binding is invalid.",
    );
  }

  if (
    value.previousCertificationKeyId !==
      undefined &&
    (
      typeof value.previousCertificationKeyId !==
        "string" ||
      !/^FINORA-BRANCH-CERT-[0-9A-F]{32}$/.test(
        value.previousCertificationKeyId,
      )
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending previous certification keyId is invalid.",
    );
  }

  try {
    assertFinoraBranchCertificationKeyMaterial(
      value.replacementCertificationKeyMaterial as
        FinoraBranchCertificationKeyMaterialV1,
    );
  }
  catch (
    error
  ) {
    throw new Error(
      error instanceof Error
        ? `FINORA Branch Certification Rotation pending replacement certification material is invalid: ${error.message}`
        : "FINORA Branch Certification Rotation pending replacement certification material is invalid.",
    );
  }

  const replacementMaterial =
    value.replacementCertificationKeyMaterial as
      FinoraBranchCertificationKeyMaterialV1;

  const replacementPublic =
    toFinoraBranchCertificationPublicKey(
      replacementMaterial,
    );

  if (
    value.previousCertificationKeyId !==
      undefined &&
    value.previousCertificationKeyId ===
      replacementPublic.keyId
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending replacement authority must differ from the previous authority.",
    );
  }

  if (
    value.recoveryReason !==
      FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending recovery reason is invalid.",
    );
  }

  if (
    !isCanonicalTimestamp(
      value.requestedAt,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending requestedAt is invalid.",
    );
  }
}

// ============================================================
// PATH / SAFESTORAGE
// ============================================================

export function getFinoraBranchCertificationRotationPendingStorePath():
  string {

  if (
    !app.isReady()
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending custody is unavailable before Electron app readiness.",
    );
  }

  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY_FINORA,
    DIRECTORY_CONTROL,
    PENDING_FILE_NAME,
  );
}

function assertSafeStorageAvailable():
  void {

  if (
    !app.isReady() ||
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Branch Certification Rotation pending custody is unavailable on this installation.",
    );
  }
}

function isEnoent(
  error:
    unknown,
): boolean {

  return (
    typeof error ===
      "object" &&
    error !==
      null &&
    "code" in
      error &&
    (
      error as {
        code?:
          unknown;
      }
    ).code ===
      "ENOENT"
  );
}

// ============================================================
// SERIALIZATION
// ============================================================

let mutationTail:
  Promise<void> =
    Promise.resolve();

function runSerializedMutation<T>(
  operation:
    () => Promise<T>,
): Promise<T> {

  const current =
    mutationTail.then(
      operation,
      operation,
    );

  mutationTail =
    current.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return current;
}

// ============================================================
// READ / WRITE
// ============================================================

async function loadInternal():
  Promise<
    FinoraBranchCertificationRotationPendingRecordV1 |
    undefined
  > {

  assertSafeStorageAvailable();

  const filePath =
    getFinoraBranchCertificationRotationPendingStorePath();

  let encrypted:
    Buffer;

  try {
    encrypted =
      await readFile(
        filePath,
      );
  }
  catch (
    error
  ) {
    if (
      isEnoent(
        error,
      )
    ) {
      return undefined;
    }

    throw error;
  }

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending custody store is empty.",
    );
  }

  let plaintext:
    string;

  try {
    plaintext =
      safeStorage.decryptString(
        encrypted,
      );
  }
  catch {
    throw new Error(
      "FINORA Branch Certification Rotation pending custody decryption failed.",
    );
  }

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        plaintext,
      );
  }
  catch {
    throw new Error(
      "FINORA Branch Certification Rotation pending custody JSON is invalid.",
    );
  }

  assertFinoraBranchCertificationRotationPendingRecord(
    parsed,
  );

  return cloneRecord(
    parsed,
  );
}

async function writeNewInternal(
  record:
    FinoraBranchCertificationRotationPendingRecordV1,
): Promise<void> {

  assertSafeStorageAvailable();

  assertFinoraBranchCertificationRotationPendingRecord(
    record,
  );

  const filePath =
    getFinoraBranchCertificationRotationPendingStorePath();

  const directory =
    dirname(
      filePath,
    );

  const temporaryPath =
    `${filePath}.tmp`;

  await mkdir(
    directory,
    {
      recursive:
        true,
    },
  );

  await rm(
    temporaryPath,
    {
      force:
        true,
    },
  );

  const plaintext =
    JSON.stringify(
      record,
    );

  const encrypted =
    safeStorage.encryptString(
      plaintext,
    );

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA Branch Certification Rotation pending custody encryption produced no bytes.",
    );
  }

  try {
    await writeFile(
      temporaryPath,
      encrypted,
      {
        flag:
          "wx",
      },
    );

    await rename(
      temporaryPath,
      filePath,
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
// PUBLIC API
// ============================================================

export function loadFinoraBranchCertificationRotationPending():
  Promise<
    FinoraBranchCertificationRotationPendingRecordV1 |
    undefined
  > {

  return loadInternal();
}

export function persistFinoraBranchCertificationRotationPending(
  input:
    PersistFinoraBranchCertificationRotationPendingInput,
): Promise<
  FinoraBranchCertificationRotationPendingRecordV1
> {

  return runSerializedMutation(
    async () => {

      const record:
        FinoraBranchCertificationRotationPendingRecordV1 = {

          state:
            FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_STATE,

          requestId:
            input.requestId,

          ownerId:
            input.ownerId,

          businessId:
            input.businessId,

          branchId:
            input.branchId,

          installationId:
            input.installationId,

          bindingKeyId:
            input.bindingKeyId,

          fingerprintAlgorithm:
            input.fingerprintAlgorithm,

          publicKeyFingerprint:
            input.publicKeyFingerprint,

          authStateId:
            input.authStateId,

          authGeneration:
            input.authGeneration,

          portableAuthFingerprintAlgorithm:
            input.portableAuthFingerprintAlgorithm,

          portableAuthFingerprint:
            input.portableAuthFingerprint,

          ...(
            input.previousCertificationKeyId ===
              undefined
              ? {}
              : {
                  previousCertificationKeyId:
                    input.previousCertificationKeyId,
                }
          ),

          replacementCertificationKeyMaterial:
            {
              ...input.replacementCertificationKeyMaterial,
            },

          recoveryReason:
            input.recoveryReason,

          requestedAt:
            input.requestedAt,

          schemaVersion:
            FINORA_BRANCH_CERTIFICATION_ROTATION_PENDING_SCHEMA_VERSION,
        };

      assertFinoraBranchCertificationRotationPendingRecord(
        record,
      );

      const existing =
        await loadInternal();

      if (
        existing !==
          undefined
      ) {

        if (
          recordsEqual(
            existing,
            record,
          )
        ) {
          return existing;
        }

        throw new Error(
          "FINORA Branch Certification Rotation already has conflicting pending custody on this installation.",
        );
      }

      await writeNewInternal(
        record,
      );

      const persisted =
        await loadInternal();

      if (
        persisted ===
          undefined ||
        !recordsEqual(
          persisted,
          record,
        )
      ) {
        throw new Error(
          "FINORA Branch Certification Rotation pending custody persistence verification failed.",
        );
      }

      return persisted;
    },
  );
}

export function destroyFinoraBranchCertificationRotationPending(
  input:
    DestroyFinoraBranchCertificationRotationPendingInput,
): Promise<boolean> {

  return runSerializedMutation(
    async () => {

      const current =
        await loadInternal();

      if (
        current ===
          undefined
      ) {
        return false;
      }

      if (
        current.requestId !==
          input.requestId ||
        current.ownerId !==
          input.ownerId ||
        current.businessId !==
          input.businessId ||
        current.branchId !==
          input.branchId ||
        current.replacementCertificationKeyMaterial.keyId !==
          input.replacementCertificationKeyId
      ) {
        throw new Error(
          "FINORA Branch Certification Rotation pending custody destruction evidence does not match.",
        );
      }

      await rm(
        getFinoraBranchCertificationRotationPendingStorePath(),
        {
          force:
            true,
        },
      );

      const after =
        await loadInternal();

      if (
        after !==
          undefined
      ) {
        throw new Error(
          "FINORA Branch Certification Rotation pending custody destruction verification failed.",
        );
      }

      return true;
    },
  );
}