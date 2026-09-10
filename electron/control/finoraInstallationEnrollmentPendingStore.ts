/* ===========================================================
   FINORA ENTERPRISE OS™

   PENDING INSTALLATION ENROLLMENT STORE

   MODULE  : Native Control
   LAYER   : Electron Main / Protected Persistence
   VERSION : 1.0
   STATUS  : Production Foundation

   RESPONSIBILITY:

   - Persist the exact Enrollment Request provenance that this
     installation exported for Control Center approval
   - Survive application restart / offline USB round-trip
   - Bind pending provenance to the exact native installation
   - Encrypt state with Electron safeStorage
   - Use atomic temp-file -> rename replacement
   - Allow replacement only for the same native binding
   - Allow conditional restore after failed request-file export
   - Allow exact-request clearing after successful bootstrap

   SECURITY:

   - ELECTRON MAIN PROCESS ONLY.
   - No IPC registration.
   - No preload.
   - No renderer.
   - No user-selected filepath.
   - No branch activation authority.
   - No recipient trust authority.
   - No storage entitlement authority.
=========================================================== */

import {
  app,
  safeStorage,
} from "electron";

import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";

import {
  constants as fsConstants,
} from "node:fs";

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

const DIRECTORY_FINORA =
  "FINORA";

const DIRECTORY_CONTROL =
  "control";

const PENDING_ENROLLMENT_FILE_NAME =
  "finora-pending-installation-enrollment.bin";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPendingInstallationEnrollmentAcceptedResponse {

  responseId:
    string;

  responseDigest:
    string;

  acceptedAt:
    string;

  schemaVersion:
    1;
}

export interface FinoraPendingInstallationEnrollmentRecord {

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

  requestedAt:
    string;

  /**
   * Once bootstrap mutation begins, the first verified signed
   * response is latched here.
   *
   * A retry must present the exact same response digest.
   * A different valid response for the same requestId cannot
   * take over a partially committed bootstrap.
   */
  acceptedResponse?:
    FinoraPendingInstallationEnrollmentAcceptedResponse;

  schemaVersion:
    1;
}

// ============================================================
// BASIC HELPERS
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
  maxLength:
    number,
): value is string {

  return (
    typeof value ===
      "string" &&
    value.length >
      0 &&
    value.length <=
      maxLength &&
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

function cloneRecord(
  record:
    FinoraPendingInstallationEnrollmentRecord,
): FinoraPendingInstallationEnrollmentRecord {

  return {
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

    requestedAt:
      record.requestedAt,

    ...(
      record.acceptedResponse ===
        undefined
        ? {}
        : {
            acceptedResponse: {
              responseId:
                record.acceptedResponse.responseId,

              responseDigest:
                record.acceptedResponse.responseDigest,

              acceptedAt:
                record.acceptedResponse.acceptedAt,

              schemaVersion:
                1 as const,
            },
          }
    ),

    schemaVersion:
      1,
  };
}

// ============================================================
// VALIDATION
// ============================================================

function validatePendingRecord(
  value:
    unknown,
): asserts value is FinoraPendingInstallationEnrollmentRecord {

  const expectedKeys = [
    "requestId",
    "installationId",
    "bindingKeyId",
    "fingerprintAlgorithm",
    "publicKeyFingerprint",
    "requestedAt",
    "schemaVersion",
  ];

  if (
    isRecord(
      value,
    ) &&
    value.acceptedResponse !==
      undefined
  ) {
    expectedKeys.push(
      "acceptedResponse",
    );
  }

  if (
    !isRecord(
      value,
    ) ||
    !hasExactKeys(
      value,
      expectedKeys,
    )
  ) {
    throw new Error(
      "FINORA pending Installation Enrollment state structure is invalid.",
    );
  }

  if (
    !hasText(
      value.requestId,
      256,
    ) ||
    !value.requestId.startsWith(
      "FINORA-ENROLLMENT-",
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
      value.requestedAt,
    ) ||
    value.schemaVersion !==
      1
  ) {
    throw new Error(
      "FINORA pending Installation Enrollment state is invalid.",
    );
  }

  if (
    value.acceptedResponse !==
      undefined
  ) {

    const accepted =
      value.acceptedResponse;

    if (
      !isRecord(
        accepted,
      ) ||
      !hasExactKeys(
        accepted,
        [
          "responseId",
          "responseDigest",
          "acceptedAt",
          "schemaVersion",
        ],
      ) ||
      !hasText(
        accepted.responseId,
        256,
      ) ||
      !accepted.responseId.startsWith(
        "FINORA-ENROLLMENT-RESPONSE-",
      ) ||
      !isCanonicalSha256(
        accepted.responseDigest,
      ) ||
      !isCanonicalTimestamp(
        accepted.acceptedAt,
      ) ||
      accepted.schemaVersion !==
        1
    ) {
      throw new Error(
        "FINORA pending Installation Enrollment accepted-response latch is invalid.",
      );
    }
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
      "FINORA pending Installation Enrollment bindingKeyId is not canonical.",
    );
  }
}

// ============================================================
// PATH / SECURE STORAGE
// ============================================================

function getPendingEnrollmentPath():
  string {

  if (!app.isReady()) {
    throw new Error(
      "FINORA pending Installation Enrollment storage is unavailable before Electron app readiness.",
    );
  }

  return join(
    app.getPath(
      "userData",
    ),
    DIRECTORY_FINORA,
    DIRECTORY_CONTROL,
    PENDING_ENROLLMENT_FILE_NAME,
  );
}

function assertSafeStorageAvailable():
  void {

  if (!app.isReady()) {
    throw new Error(
      "FINORA pending Installation Enrollment storage is unavailable before Electron app readiness.",
    );
  }

  if (
    !safeStorage.isEncryptionAvailable()
  ) {
    throw new Error(
      "FINORA secure pending Installation Enrollment storage is unavailable on this installation.",
    );
  }
}

async function fileExists(
  filePath:
    string,
): Promise<boolean> {

  try {
    await access(
      filePath,
      fsConstants.F_OK,
    );

    return true;

  } catch {
    return false;
  }
}

// ============================================================
// INTERNAL LOAD
// ============================================================

async function loadInternal():
  Promise<
    FinoraPendingInstallationEnrollmentRecord |
    undefined
  > {

  const filePath =
    getPendingEnrollmentPath();

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
      "FINORA pending Installation Enrollment store is empty.",
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
      "FINORA pending Installation Enrollment store could not be decrypted.",
    );
  }

  if (
    decrypted.length ===
      0
  ) {
    throw new Error(
      "FINORA pending Installation Enrollment store decrypted to an empty payload.",
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
      "FINORA pending Installation Enrollment store contains invalid JSON.",
    );
  }

  validatePendingRecord(
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
    FinoraPendingInstallationEnrollmentRecord,
): Promise<void> {

  validatePendingRecord(
    record,
  );

  assertSafeStorageAvailable();

  const filePath =
    getPendingEnrollmentPath();

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
      "FINORA pending Installation Enrollment encryption returned an empty payload.",
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

let pendingEnrollmentMutationQueue:
  Promise<void> =
    Promise.resolve();

function runSerializedMutation<T>(
  operation:
    () => Promise<T>,
): Promise<T> {

  const result =
    pendingEnrollmentMutationQueue.then(
      operation,
      operation,
    );

  pendingEnrollmentMutationQueue =
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

export async function loadFinoraPendingInstallationEnrollment():
  Promise<
    FinoraPendingInstallationEnrollmentRecord |
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
// PERSIST / REPLACE
//
// Returns the previous pending request so the caller may
// conditionally restore it if a later external file write fails.
// ============================================================

export function persistFinoraPendingInstallationEnrollment(
  record:
    FinoraPendingInstallationEnrollmentRecord,
): Promise<
  FinoraPendingInstallationEnrollmentRecord |
  undefined
> {

  return runSerializedMutation(
    async () => {

      validatePendingRecord(
        record,
      );

      const existing =
        await loadInternal();

      if (
        existing?.acceptedResponse !==
          undefined
      ) {

        if (
          existing.requestId !==
            record.requestId ||
          record.acceptedResponse ===
            undefined ||
          record.acceptedResponse.responseId !==
            existing.acceptedResponse.responseId ||
          record.acceptedResponse.responseDigest !==
            existing.acceptedResponse.responseDigest
        ) {
          throw new Error(
            "FINORA pending Installation Enrollment is already bound to an accepted Enrollment Response and cannot be replaced.",
          );
        }
      }

      if (
        existing &&
        (
          existing.installationId !==
            record.installationId ||
          existing.bindingKeyId !==
            record.bindingKeyId ||
          existing.fingerprintAlgorithm !==
            record.fingerprintAlgorithm ||
          existing.publicKeyFingerprint !==
            record.publicKeyFingerprint
        )
      ) {
        throw new Error(
          "FINORA pending Installation Enrollment cannot be replaced by a different native installation binding.",
        );
      }

      await writeInternal(
        record,
      );

      return existing
        ? cloneRecord(
            existing,
          )
        : undefined;
    },
  );
}

// ============================================================
// LATCH VERIFIED ENROLLMENT RESPONSE
//
// This is the bootstrap transaction's first mutation.
//
// The first responseId + canonical verified-response digest
// wins. Same-response retry is idempotent. Any different
// response for the same pending request is rejected.
// ============================================================

export function latchFinoraPendingInstallationEnrollmentResponse(
  expectedRequestId:
    string,

  responseId:
    string,

  responseDigest:
    string,
): Promise<
  FinoraPendingInstallationEnrollmentAcceptedResponse
> {

  return runSerializedMutation(
    async () => {

      if (
        !hasText(
          expectedRequestId,
          256,
        ) ||
        !expectedRequestId.startsWith(
          "FINORA-ENROLLMENT-",
        ) ||
        !hasText(
          responseId,
          256,
        ) ||
        !responseId.startsWith(
          "FINORA-ENROLLMENT-RESPONSE-",
        ) ||
        !isCanonicalSha256(
          responseDigest,
        )
      ) {
        throw new Error(
          "A valid FINORA Enrollment Response latch is required.",
        );
      }

      const current =
        await loadInternal();

      if (
        !current ||
        current.requestId !==
          expectedRequestId
      ) {
        throw new Error(
          "FINORA Enrollment Response does not match the protected pending Enrollment Request.",
        );
      }

      if (
        current.acceptedResponse !==
          undefined
      ) {

        if (
          current.acceptedResponse.responseId !==
            responseId ||
          current.acceptedResponse.responseDigest !==
            responseDigest
        ) {
          throw new Error(
            "A different FINORA Enrollment Response is already bound to this pending Enrollment Request.",
          );
        }

        return {
          ...current.acceptedResponse,
        };
      }

      const acceptedResponse:
        FinoraPendingInstallationEnrollmentAcceptedResponse = {

          responseId,

          responseDigest,

          acceptedAt:
            new Date().toISOString(),

          schemaVersion:
            1,
        };

      await writeInternal({
        ...current,

        acceptedResponse,
      });

      return {
        ...acceptedResponse,
      };
    },
  );
}

// ============================================================
// CONDITIONAL RESTORE
//
// Restores a previous record only while the currently persisted
// request is still the exact request whose external export failed.
// A newer request can therefore never be overwritten.
// ============================================================

export function restoreFinoraPendingInstallationEnrollment(
  expectedCurrentRequestId:
    string,

  previous:
    FinoraPendingInstallationEnrollmentRecord |
    undefined,
): Promise<boolean> {

  return runSerializedMutation(
    async () => {

      const current =
        await loadInternal();

      if (
        !current ||
        current.requestId !==
          expectedCurrentRequestId
      ) {
        return false;
      }

      if (!previous) {
        await rm(
          getPendingEnrollmentPath(),
          {
            force:
              true,
          },
        );

        return true;
      }

      validatePendingRecord(
        previous,
      );

      if (
        previous.installationId !==
          current.installationId ||
        previous.bindingKeyId !==
          current.bindingKeyId ||
        previous.fingerprintAlgorithm !==
          current.fingerprintAlgorithm ||
        previous.publicKeyFingerprint !==
          current.publicKeyFingerprint
      ) {
        throw new Error(
          "FINORA pending Installation Enrollment restore binding does not match the current native installation.",
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
// EXACT CLEAR
//
// Used only after later bootstrap succeeds. A stale response
// cannot clear a newer pending Enrollment Request.
// ============================================================

export function clearFinoraPendingInstallationEnrollment(
  expectedRequestId:
    string,
): Promise<boolean> {

  return runSerializedMutation(
    async () => {

      const current =
        await loadInternal();

      if (
        !current ||
        current.requestId !==
          expectedRequestId
      ) {
        return false;
      }

      await rm(
        getPendingEnrollmentPath(),
        {
          force:
            true,
        },
      );

      return true;
    },
  );
}

// ============================================================
// END
// ============================================================