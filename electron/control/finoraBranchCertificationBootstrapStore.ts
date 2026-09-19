/*
 * FINORA ENTERPRISE
 * BRANCH CERTIFICATION BOOTSTRAP STORE
 *
 * Temporary main-process custody for the branch-level
 * certification private key during initial provisioning.
 *
 * Persisted lifecycle:
 *
 * GENERATED_FOR_REQUEST
 *   ->
 * BRANCH_BOUND_AFTER_RESPONSE
 *
 * Successful migration into Password + Security Code protected
 * Portable Branch Auth is represented by physical deletion of
 * this encrypted bootstrap store, never by another persisted
 * secret-bearing terminal state.
 *
 * Security rules:
 * - Electron main process only.
 * - Private key is encrypted at rest with safeStorage.
 * - Atomic temp-file -> rename replacement.
 * - Same-process mutations are serialized.
 * - Keypair cannot change while bootstrap custody exists.
 * - Branch binding is immutable once established.
 */

import {
  app,
  safeStorage,
} from "electron";

import {
  randomUUID,
} from "node:crypto";

import {
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";

import {
  dirname,
  join,
} from "node:path";

import {
  assertFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import type {
  FinoraBranchCertificationKeyMaterialV1,
} from "./finoraBranchCertificationContract.js";

// ============================================================
// CONSTANTS
// ============================================================

export const FINORA_BRANCH_CERTIFICATION_BOOTSTRAP_STORE_SCHEMA_VERSION =
  1 as const;

export const FINORA_BRANCH_CERTIFICATION_BOOTSTRAP_RECORD_SCHEMA_VERSION =
  1 as const;

const DIRECTORY_FINORA =
  "FINORA";

const DIRECTORY_CONTROL =
  "control";

const BOOTSTRAP_FILE_NAME =
  "finora-branch-certification-bootstrap.bin";

// ============================================================
// CONTRACT
// ============================================================

export type FinoraBranchCertificationBootstrapState =
  | "GENERATED_FOR_REQUEST"
  | "BRANCH_BOUND_AFTER_RESPONSE";

export interface FinoraBranchCertificationBootstrapBranchBindingV1 {

  responseId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  boundAt:
    string;
}

export interface FinoraBranchCertificationBootstrapRecordV1 {

  state:
    FinoraBranchCertificationBootstrapState;

  requestId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  certificationKeyMaterial:
    FinoraBranchCertificationKeyMaterialV1;

  generatedAt:
    string;

  branchBinding?:
    FinoraBranchCertificationBootstrapBranchBindingV1;

  schemaVersion:
    typeof FINORA_BRANCH_CERTIFICATION_BOOTSTRAP_RECORD_SCHEMA_VERSION;
}

export interface PersistFinoraBranchCertificationBootstrapGeneratedInput {

  requestId:
    string;

  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;

  certificationKeyMaterial:
    FinoraBranchCertificationKeyMaterialV1;

  generatedAt:
    string;
}

export interface BindFinoraBranchCertificationBootstrapInput {

  requestId:
    string;

  responseId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  boundAt:
    string;
}

export interface DestroyFinoraBranchCertificationBootstrapAfterMigrationInput {

  requestId:
    string;

  responseId:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  certificationKeyId:
    string;

  migratedAt:
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

function hasExactKeys(
  value:
    Record<string, unknown>,

  expected:
    readonly string[],
): boolean {

  const actualKeys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [...expected].sort();

  return (
    actualKeys.length ===
      expectedKeys.length &&
    actualKeys.every(
      (
        key,
        index,
      ) =>
        key ===
          expectedKeys[index],
    )
  );
}

function hasText(
  value:
    unknown,

  maximumLength:
    number,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.length >
      0 &&
    value.length <=
      maximumLength &&
    value ===
      value.trim()
  );
}

function isCanonicalTimestamp(
  value:
    unknown,
): value is string {

  if (
    typeof value !==
      "string" ||
    value.length ===
      0
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

function isCanonicalSha256(
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

function isEnrollmentRequestId(
  value:
    unknown,
): value is string {

  return (
    hasText(
      value,
      256,
    ) &&
    value.startsWith(
      "FINORA-ENROLLMENT-",
    ) &&
    !value.startsWith(
      "FINORA-ENROLLMENT-RESPONSE-",
    )
  );
}

function isEnrollmentResponseId(
  value:
    unknown,
): value is string {

  return (
    hasText(
      value,
      256,
    ) &&
    value.startsWith(
      "FINORA-ENROLLMENT-RESPONSE-",
    )
  );
}

// ============================================================
// CLONE
// ============================================================

function cloneRecord(
  record:
    FinoraBranchCertificationBootstrapRecordV1,
): FinoraBranchCertificationBootstrapRecordV1 {

  return {
    state:
      record.state,

    requestId:
      record.requestId,

    installationId:
      record.installationId,

    bindingKeyId:
      record.bindingKeyId,

    fingerprintAlgorithm:
      record.fingerprintAlgorithm,

    publicKeyFingerprint:
      record.publicKeyFingerprint,

    certificationKeyMaterial: {
      ...record.certificationKeyMaterial,
    },

    generatedAt:
      record.generatedAt,

    ...(
      record.branchBinding ===
        undefined
        ? {}
        : {
            branchBinding: {
              ...record.branchBinding,
            },
          }
    ),

    schemaVersion:
      FINORA_BRANCH_CERTIFICATION_BOOTSTRAP_RECORD_SCHEMA_VERSION,
  };
}

// ============================================================
// RECORD VALIDATION
// ============================================================

function validateBranchBinding(
  value:
    unknown,

  generatedAt:
    string,
): asserts value is FinoraBranchCertificationBootstrapBranchBindingV1 {

  if (
    !isRecord(
      value,
    ) ||
    !hasExactKeys(
      value,
      [
        "responseId",
        "ownerId",
        "businessId",
        "branchId",
        "boundAt",
      ],
    ) ||
    !isEnrollmentResponseId(
      value.responseId,
    ) ||
    !hasText(
      value.ownerId,
      256,
    ) ||
    !hasText(
      value.businessId,
      256,
    ) ||
    !hasText(
      value.branchId,
      256,
    ) ||
    !isCanonicalTimestamp(
      value.boundAt,
    ) ||
    Date.parse(
      value.boundAt,
    ) <
      Date.parse(
        generatedAt,
      )
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap branch binding is invalid.",
    );
  }
}

function validateBootstrapRecord(
  value:
    unknown,
): asserts value is FinoraBranchCertificationBootstrapRecordV1 {

  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap state structure is invalid.",
    );
  }

  const expectedKeys = [
    "state",
    "requestId",
    "installationId",
    "bindingKeyId",
    "fingerprintAlgorithm",
    "publicKeyFingerprint",
    "certificationKeyMaterial",
    "generatedAt",
    "schemaVersion",
  ];

  if (
    value.state ===
      "BRANCH_BOUND_AFTER_RESPONSE"
  ) {
    expectedKeys.push(
      "branchBinding",
    );
  }

  if (
    !hasExactKeys(
      value,
      expectedKeys,
    )
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap state contains unsupported or missing fields.",
    );
  }

  if (
    (
      value.state !==
        "GENERATED_FOR_REQUEST" &&
      value.state !==
        "BRANCH_BOUND_AFTER_RESPONSE"
    ) ||
    !isEnrollmentRequestId(
      value.requestId,
    ) ||
    !hasText(
      value.installationId,
      256,
    ) ||
    !hasText(
      value.bindingKeyId,
      128,
    ) ||
    value.fingerprintAlgorithm !==
      "SHA-256" ||
    !isCanonicalSha256(
      value.publicKeyFingerprint,
    ) ||
    !isCanonicalTimestamp(
      value.generatedAt,
    ) ||
    value.schemaVersion !==
      FINORA_BRANCH_CERTIFICATION_BOOTSTRAP_RECORD_SCHEMA_VERSION
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap state is invalid.",
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
      "FINORA Branch Certification bootstrap native bindingKeyId is not canonical.",
    );
  }

  try {
    assertFinoraBranchCertificationKeyMaterial(
      value.certificationKeyMaterial as
        FinoraBranchCertificationKeyMaterialV1,
    );
  } catch {
    throw new Error(
      "FINORA Branch Certification bootstrap key material is invalid.",
    );
  }

  const keyMaterial =
    value.certificationKeyMaterial as
      FinoraBranchCertificationKeyMaterialV1;

  if (
    keyMaterial.createdAt !==
      value.generatedAt
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap generation timestamp does not match its key material.",
    );
  }

  if (
    value.state ===
      "GENERATED_FOR_REQUEST"
  ) {

    if (
      value.branchBinding !==
        undefined
    ) {
      throw new Error(
        "FINORA generated Branch Certification bootstrap state cannot contain branch binding.",
      );
    }

    return;
  }

  validateBranchBinding(
    value.branchBinding,
    value.generatedAt,
  );
}

// ============================================================
// EXACT COMPARISON
// ============================================================

function recordsEqual(
  left:
    FinoraBranchCertificationBootstrapRecordV1,

  right:
    FinoraBranchCertificationBootstrapRecordV1,
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

function keyMaterialEqual(
  left:
    FinoraBranchCertificationKeyMaterialV1,

  right:
    FinoraBranchCertificationKeyMaterialV1,
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

function nativeBindingEqual(
  left:
    FinoraBranchCertificationBootstrapRecordV1,

  right:
    FinoraBranchCertificationBootstrapRecordV1,
): boolean {

  return (
    left.installationId ===
      right.installationId &&
    left.bindingKeyId ===
      right.bindingKeyId &&
    left.fingerprintAlgorithm ===
      right.fingerprintAlgorithm &&
    left.publicKeyFingerprint ===
      right.publicKeyFingerprint
  );
}

// ============================================================
// PATH / SAFESTORAGE
// ============================================================

export function getFinoraBranchCertificationBootstrapStorePath():
  string {

  if (
    !app.isReady()
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap storage is unavailable before Electron app readiness.",
    );
  }

  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY_FINORA,
    DIRECTORY_CONTROL,
    BOOTSTRAP_FILE_NAME,
  );
}

function assertSafeStorageAvailable():
  void {

  if (
    !app.isReady()
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap storage is unavailable before Electron app readiness.",
    );
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure Branch Certification bootstrap storage is unavailable on this installation.",
    );
  }
}

async function fileExists(
  filePath:
    string,
): Promise<boolean> {

  try {

    await stat(
      filePath,
    );

    return true;

  } catch (
    error
  ) {

    if (
      (
        error as NodeJS.ErrnoException
      ).code ===
        "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}

// ============================================================
// INTERNAL LOAD
// ============================================================

async function loadInternal():
  Promise<
    FinoraBranchCertificationBootstrapRecordV1 |
    undefined
  > {

  const filePath =
    getFinoraBranchCertificationBootstrapStorePath();

  if (
    !await fileExists(
      filePath,
    )
  ) {
    return undefined;
  }

  assertSafeStorageAvailable();

  const encrypted =
    await readFile(
      filePath,
    );

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap store is empty.",
    );
  }

  let decrypted:
    string;

  try {

    decrypted =
      safeStorage.decryptString(
        encrypted,
      );

  } catch {

    throw new Error(
      "FINORA Branch Certification bootstrap store could not be decrypted.",
    );
  }

  if (
    decrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap store decrypted to an empty payload.",
    );
  }

  let parsed:
    unknown;

  try {

    parsed =
      JSON.parse(
        decrypted,
      );

  } catch {

    throw new Error(
      "FINORA Branch Certification bootstrap store contains invalid JSON.",
    );
  }

  validateBootstrapRecord(
    parsed,
  );

  return cloneRecord(
    parsed,
  );
}

// ============================================================
// INTERNAL WRITE
// ============================================================

async function writeInternal(
  record:
    FinoraBranchCertificationBootstrapRecordV1,
): Promise<void> {

  validateBootstrapRecord(
    record,
  );

  assertSafeStorageAvailable();

  const filePath =
    getFinoraBranchCertificationBootstrapStorePath();

  const parentDirectory =
    dirname(
      filePath,
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
        record,
      ),
    );

  if (
    encrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA Branch Certification bootstrap encryption returned an empty payload.",
    );
  }

  const temporaryPath =
    `${filePath}.${randomUUID()}.tmp`;

  try {

    await writeFile(
      temporaryPath,
      encrypted,
      {
        flag:
          "wx",

        mode:
          0o600,
      },
    );

    await rename(
      temporaryPath,
      filePath,
    );

  } catch (
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
// MUTATION SERIALIZATION
// ============================================================

let bootstrapMutationQueue:
  Promise<void> =
  Promise.resolve();

function runSerializedMutation<T>(
  operation:
    () => Promise<T>,
): Promise<T> {

  const result =
    bootstrapMutationQueue.then(
      operation,
      operation,
    );

  bootstrapMutationQueue =
    result.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return result;
}

// ============================================================
// PUBLIC LOAD
// ============================================================

export async function loadFinoraBranchCertificationBootstrap():
  Promise<
    FinoraBranchCertificationBootstrapRecordV1 |
    undefined
  > {

  const record =
    await loadInternal();

  return record
    ? cloneRecord(
        record,
      )
    : undefined;
}

// ============================================================
// GENERATED FOR REQUEST
// ============================================================

export function persistFinoraBranchCertificationBootstrapGenerated(
  input:
    PersistFinoraBranchCertificationBootstrapGeneratedInput,
): Promise<
  FinoraBranchCertificationBootstrapRecordV1 |
  undefined
> {

  return runSerializedMutation(
    async () => {

      const record:
        FinoraBranchCertificationBootstrapRecordV1 = {

          state:
            "GENERATED_FOR_REQUEST",

          requestId:
            input.requestId,

          installationId:
            input.installationId,

          bindingKeyId:
            input.bindingKeyId,

          fingerprintAlgorithm:
            input.fingerprintAlgorithm,

          publicKeyFingerprint:
            input.publicKeyFingerprint,

          certificationKeyMaterial: {
            ...input.certificationKeyMaterial,
          },

          generatedAt:
            input.generatedAt,

          schemaVersion:
            FINORA_BRANCH_CERTIFICATION_BOOTSTRAP_RECORD_SCHEMA_VERSION,
        };

      validateBootstrapRecord(
        record,
      );

      const existing =
        await loadInternal();

      if (
        existing ===
          undefined
      ) {

        await writeInternal(
          record,
        );

        return undefined;
      }

      if (
        existing.state ===
          "BRANCH_BOUND_AFTER_RESPONSE"
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap is already branch-bound and cannot be replaced by a new Enrollment Request.",
        );
      }

      if (
        !nativeBindingEqual(
          existing,
          record,
        )
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap cannot move to a different native installation binding.",
        );
      }

      if (
        !keyMaterialEqual(
          existing.certificationKeyMaterial,
          record.certificationKeyMaterial,
        )
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap keypair is immutable while bootstrap custody exists.",
        );
      }

      const previous =
        cloneRecord(
          existing,
        );

      if (
        recordsEqual(
          existing,
          record,
        )
      ) {
        return previous;
      }

      await writeInternal(
        record,
      );

      return previous;
    },
  );
}

// ============================================================
// CONDITIONAL RESTORE
// ============================================================

export function restoreFinoraBranchCertificationBootstrapGenerated(
  expectedCurrentRequestId:
    string,

  previous:
    FinoraBranchCertificationBootstrapRecordV1 |
    undefined,
): Promise<boolean> {

  return runSerializedMutation(
    async () => {

      if (
        !isEnrollmentRequestId(
          expectedCurrentRequestId,
        )
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap restore requestId is invalid.",
        );
      }

      const current =
        await loadInternal();

      if (
        current ===
          undefined ||
        current.state !==
          "GENERATED_FOR_REQUEST" ||
        current.requestId !==
          expectedCurrentRequestId
      ) {
        return false;
      }

      const filePath =
        getFinoraBranchCertificationBootstrapStorePath();

      if (
        previous ===
          undefined
      ) {

        await rm(
          filePath,
          {
            force:
              true,
          },
        );

        return true;
      }

      validateBootstrapRecord(
        previous,
      );

      if (
        previous.state !==
          "GENERATED_FOR_REQUEST" ||
        !nativeBindingEqual(
          current,
          previous,
        ) ||
        !keyMaterialEqual(
          current.certificationKeyMaterial,
          previous.certificationKeyMaterial,
        )
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap restore state does not match immutable custody.",
        );
      }

      await writeInternal(
        previous,
      );

      return true;
    },
  );
}

// ============================================================
// BRANCH BIND AFTER VERIFIED RESPONSE
// ============================================================

export function bindFinoraBranchCertificationBootstrapToBranch(
  input:
    BindFinoraBranchCertificationBootstrapInput,
): Promise<
  FinoraBranchCertificationBootstrapRecordV1
> {

  return runSerializedMutation(
    async () => {

      if (
        !isEnrollmentRequestId(
          input.requestId,
        ) ||
        !isEnrollmentResponseId(
          input.responseId,
        ) ||
        !hasText(
          input.ownerId,
          256,
        ) ||
        !hasText(
          input.businessId,
          256,
        ) ||
        !hasText(
          input.branchId,
          256,
        ) ||
        !isCanonicalTimestamp(
          input.boundAt,
        )
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap branch-binding input is invalid.",
        );
      }

      const existing =
        await loadInternal();

      if (
        existing ===
          undefined
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap custody is unavailable.",
        );
      }

      if (
        existing.requestId !==
          input.requestId
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap requestId does not match the verified Enrollment Response.",
        );
      }

      const branchBinding:
        FinoraBranchCertificationBootstrapBranchBindingV1 = {

          responseId:
            input.responseId,

          ownerId:
            input.ownerId,

          businessId:
            input.businessId,

          branchId:
            input.branchId,

          boundAt:
            input.boundAt,
        };

      validateBranchBinding(
        branchBinding,
        existing.generatedAt,
      );

      if (
        existing.state ===
          "BRANCH_BOUND_AFTER_RESPONSE"
      ) {

        if (
          existing.branchBinding !==
            undefined &&
          JSON.stringify(
            existing.branchBinding,
          ) ===
            JSON.stringify(
              branchBinding,
            )
        ) {
          return cloneRecord(
            existing,
          );
        }

        throw new Error(
          "FINORA Branch Certification bootstrap branch binding is immutable once established.",
        );
      }

      const bound:
        FinoraBranchCertificationBootstrapRecordV1 = {

          ...cloneRecord(
            existing,
          ),

          state:
            "BRANCH_BOUND_AFTER_RESPONSE",

          branchBinding,

          schemaVersion:
            FINORA_BRANCH_CERTIFICATION_BOOTSTRAP_RECORD_SCHEMA_VERSION,
        };

      validateBootstrapRecord(
        bound,
      );

      await writeInternal(
        bound,
      );

      return cloneRecord(
        bound,
      );
    },
  );
}

// ============================================================
// DESTROY AFTER VERIFIED PORTABLE-AUTH MIGRATION
// ============================================================

export function destroyFinoraBranchCertificationBootstrapAfterMigration(
  input:
    DestroyFinoraBranchCertificationBootstrapAfterMigrationInput,
): Promise<boolean> {

  return runSerializedMutation(
    async () => {

      if (
        !isEnrollmentRequestId(
          input.requestId,
        ) ||
        !isEnrollmentResponseId(
          input.responseId,
        ) ||
        !hasText(
          input.ownerId,
          256,
        ) ||
        !hasText(
          input.businessId,
          256,
        ) ||
        !hasText(
          input.branchId,
          256,
        ) ||
        !hasText(
          input.certificationKeyId,
          128,
        ) ||
        !isCanonicalTimestamp(
          input.migratedAt,
        )
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap migration-destroy input is invalid.",
        );
      }

      const existing =
        await loadInternal();

      if (
        existing ===
          undefined
      ) {
        return false;
      }

      if (
        existing.state !==
          "BRANCH_BOUND_AFTER_RESPONSE" ||
        existing.branchBinding ===
          undefined
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap cannot be destroyed before verified branch binding.",
        );
      }

      const binding =
        existing.branchBinding;

      if (
        existing.requestId !==
          input.requestId ||
        binding.responseId !==
          input.responseId ||
        binding.ownerId !==
          input.ownerId ||
        binding.businessId !==
          input.businessId ||
        binding.branchId !==
          input.branchId ||
        existing.certificationKeyMaterial.keyId !==
          input.certificationKeyId
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap migration evidence does not match exact custody.",
        );
      }

      if (
        Date.parse(
          input.migratedAt,
        ) <
          Date.parse(
            binding.boundAt,
          )
      ) {
        throw new Error(
          "FINORA Branch Certification bootstrap migration timestamp precedes branch binding.",
        );
      }

      await rm(
        getFinoraBranchCertificationBootstrapStorePath(),
        {
          force:
            true,
        },
      );

      return true;
    },
  );
}