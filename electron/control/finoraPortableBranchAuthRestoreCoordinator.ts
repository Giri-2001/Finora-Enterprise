/* ============================================================
   FINORA ENTERPRISE

   PORTABLE BRANCH AUTH RESTORE COORDINATOR

   Phase 5.6O-O2

   This is privileged main-process recovery logic.

   It does NOT accept renderer authority for:
   - sessionId
   - owner/business/branch scope
   - storage mode
   - auth generation
   - source/destination path

   serializedBackup is privileged native-transport input and is
   never part of the renderer-facing credential contract.
   ============================================================ */

import {
  authenticateFinoraBranchCredential,
} from "./finoraBranchCredentialAuthenticationService.js";

import type {
  FinoraBranchCredentialAuthenticationResult,
} from "./finoraBranchCredentialAuthenticationService.js";

import {
  parseFinoraPortableBranchAuthBackupFileV1,
} from "./finoraPortableBranchAuthBackupContract.js";

import type {
  FinoraPortableBranchAuthBackupFileV1,
} from "./finoraPortableBranchAuthBackupContract.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
  FinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  decryptFinoraPortableBranchAuthEnvelopeV1,
  parseFinoraPortableBranchAuth,
  serializeFinoraPortableBranchAuth,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FinoraPortableBranchAuthStoreError,
} from "./finoraPortableBranchAuthStore.js";

import {
  evaluateFinoraPortableBranchAuthRestoreGeneration,
  isFinoraPortableBranchAuthRestoreScopeMatch,
  isFinoraPortableBranchAuthRestoreStorageModeMatch,
  sanitizeFinoraPortableBranchAuthRestoreCredentialRequest,
} from "./finoraPortableBranchAuthRestoreContract.js";

import type {
  FinoraPortableBranchAuthRestoreCredentialRequest,
  FinoraPortableBranchAuthRestoreErrorCode,
  FinoraPortableBranchAuthRestoreScope,
  FinoraPortableBranchAuthRestoreStorageMode,
} from "./finoraPortableBranchAuthRestoreContract.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthRestoreCoordinatorRequest {
  credentials:
    unknown;

  /**
   * Privileged bytes loaded by native transport.
   *
   * Never populate this field directly from renderer IPC.
   */
  serializedBackup:
    string;
}

export interface FinoraPortableBranchAuthRestoreSuccess {
  backupId:
    string;

  storageMode:
    FinoraPortableBranchAuthRestoreStorageMode;

  authGeneration:
    number;
}

export type FinoraPortableBranchAuthRestoreResult =
  | {
      success:
        true;

      data:
        FinoraPortableBranchAuthRestoreSuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableBranchAuthRestoreErrorCode;

      error:
        string;
    };

export interface FinoraPortableBranchAuthRestoreStore {
  write(
    storageMode:
      FinoraPortableBranchAuthRestoreStorageMode,
    envelope:
      FinoraPortableBranchAuthEnvelopeV1,
  ): Promise<void>;

  read(
    storageMode:
      FinoraPortableBranchAuthRestoreStorageMode,
  ): Promise<
    FinoraPortableBranchAuthEnvelopeV1 |
    null
  >;
}

export interface FinoraPortableBranchAuthRestoreCoordinatorDependencies {
  portableStore:
    FinoraPortableBranchAuthRestoreStore;

  authenticateCredential?: (
    input:
      unknown,
  ) => Promise<
    FinoraBranchCredentialAuthenticationResult
  >;

  parseBackup?: (
    serialized:
      string,
  ) => FinoraPortableBranchAuthBackupFileV1;

  parseEnvelope?: (
    serialized:
      string,
  ) => FinoraPortableBranchAuthEnvelopeV1;

  decryptEnvelope?: (
    envelope:
      FinoraPortableBranchAuthEnvelopeV1,
    password:
      string,
    securityCode:
      string,
  ) => Promise<
    FinoraPortableBranchAuthPayloadV1
  >;

  serializeEnvelope?: (
    envelope:
      FinoraPortableBranchAuthEnvelopeV1,
  ) => string;
}

interface SanitizedRestoreCoordinatorRequest {
  credentials:
    FinoraPortableBranchAuthRestoreCredentialRequest;

  serializedBackup:
    string;
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

  const wanted =
    [...expected].sort();

  return (
    actual.length ===
      wanted.length &&
    actual.every(
      (
        key,
        index,
      ) =>
        key ===
          wanted[index],
    )
  );
}

function sanitizeCoordinatorRequest(
  input:
    unknown,
): SanitizedRestoreCoordinatorRequest | null {
  if (
    !isRecord(
      input,
    ) ||
    !hasExactKeys(
      input,
      [
        "credentials",
        "serializedBackup",
      ],
    ) ||
    typeof input.serializedBackup !==
      "string" ||
    input.serializedBackup.length ===
      0
  ) {
    return null;
  }

  const credentials =
    sanitizeFinoraPortableBranchAuthRestoreCredentialRequest(
      input.credentials,
    );

  if (!credentials) {
    return null;
  }

  return {
    credentials,

    serializedBackup:
      input.serializedBackup,
  };
}

function failure(
  errorCode:
    FinoraPortableBranchAuthRestoreErrorCode,
  error:
    string,
): FinoraPortableBranchAuthRestoreResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function buildScope(
  value:
    {
      ownerId:
        string;

      businessId:
        string;

      branchId:
        string;
    },
): FinoraPortableBranchAuthRestoreScope {
  return {
    ownerId:
      value.ownerId,

    businessId:
      value.businessId,

    branchId:
      value.branchId,
  };
}

// ============================================================
// RESTORE
// ============================================================

export async function restoreFinoraPortableBranchAuth(
  input:
    unknown,
  dependencies:
    FinoraPortableBranchAuthRestoreCoordinatorDependencies,
): Promise<
  FinoraPortableBranchAuthRestoreResult
> {
  const request =
    sanitizeCoordinatorRequest(
      input,
    );

  if (!request) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA Restore request is required.",
    );
  }

  const authenticateCredential =
    dependencies.authenticateCredential ??
    authenticateFinoraBranchCredential;

  const parseBackup =
    dependencies.parseBackup ??
    parseFinoraPortableBranchAuthBackupFileV1;

  const parseEnvelope =
    dependencies.parseEnvelope ??
    parseFinoraPortableBranchAuth;

  const decryptEnvelope =
    dependencies.decryptEnvelope ??
    (
      async (
        envelope,
        password,
        securityCode,
      ) =>
        decryptFinoraPortableBranchAuthEnvelopeV1(
          envelope,
          password,
          securityCode,
        )
    );

  const serializeEnvelope =
    dependencies.serializeEnvelope ??
    serializeFinoraPortableBranchAuth;

  // ==========================================================
  // 1. CURRENT CREDENTIAL AUTHORITY
  // ==========================================================

  let credentialResult:
    FinoraBranchCredentialAuthenticationResult;

  try {
    credentialResult =
      await authenticateCredential({
        username:
          request.credentials.username,

        password:
          request.credentials.password,
      });
  }
  catch {
    return failure(
      "CREDENTIAL_AUTHENTICATION_FAILED",
      "FINORA could not authenticate the current Branch Credential.",
    );
  }

  if (!credentialResult.success) {
    return failure(
      "CREDENTIAL_AUTHENTICATION_FAILED",
      "Invalid FINORA Restore credentials.",
    );
  }

  const current =
    credentialResult.data;

  const currentScope =
    buildScope(
      current,
    );

  // ==========================================================
  // 2. STRICT BACKUP WRAPPER PARSE
  // ==========================================================

  let backup:
    FinoraPortableBranchAuthBackupFileV1;

  try {
    backup =
      parseBackup(
        request.serializedBackup,
      );
  }
  catch {
    return failure(
      "BACKUP_INVALID",
      "The FINORA backup file is invalid.",
    );
  }

  // ==========================================================
  // 3. STRICT EMBEDDED ENVELOPE PARSE
  // ==========================================================

  let envelope:
    FinoraPortableBranchAuthEnvelopeV1;

  try {
    envelope =
      parseEnvelope(
        backup.portableAuthEnvelopeSerialized,
      );
  }
  catch {
    return failure(
      "BACKUP_INVALID",
      "The FINORA backup contains invalid Portable Auth data.",
    );
  }

  // The wrapper must preserve the exact canonical encrypted
  // envelope. Parsing then serializing must reproduce the exact
  // privileged bytes carried by the Backup artifact.
  try {
    if (
      serializeEnvelope(
        envelope,
      ) !==
      backup.portableAuthEnvelopeSerialized
    ) {
      return failure(
        "BACKUP_INVALID",
        "The FINORA backup Portable Auth envelope is not canonical.",
      );
    }
  }
  catch {
    return failure(
      "BACKUP_INVALID",
      "The FINORA backup Portable Auth envelope is invalid.",
    );
  }

  // ==========================================================
  // 4. INNER AUTHENTICATION
  // ==========================================================

  let payload:
    FinoraPortableBranchAuthPayloadV1;

  try {
    payload =
      await decryptEnvelope(
        envelope,
        request.credentials.password,
        request.credentials.securityCode,
      );
  }
  catch {
    return failure(
      "BACKUP_AUTHENTICATION_FAILED",
      "The FINORA backup could not be authenticated.",
    );
  }

  const payloadScope =
    buildScope(
      payload,
    );

  // ==========================================================
  // 5. WRAPPER ↔ AUTHENTICATED INNER CONSISTENCY
  //
  // Wrapper metadata is not authority. It must agree exactly
  // with the authenticated inner payload before being accepted.
  // ==========================================================

  if (
    !isFinoraPortableBranchAuthRestoreScopeMatch(
      backup.branchScope,
      payloadScope,
    ) ||
    backup.sourceStorageMode !==
      payload.storageMode ||
    backup.authGeneration !==
      payload.authGeneration
  ) {
    return failure(
      "BACKUP_INVALID",
      "The FINORA backup metadata does not match its authenticated Portable Auth payload.",
    );
  }

  // ==========================================================
  // 6. CURRENT AUTHORITY ↔ AUTHENTICATED INNER SCOPE
  // ==========================================================

  if (
    !isFinoraPortableBranchAuthRestoreScopeMatch(
      payloadScope,
      currentScope,
    )
  ) {
    return failure(
      "SCOPE_MISMATCH",
      "The FINORA backup belongs to a different branch scope.",
    );
  }

  // ==========================================================
  // 7. SAME STORAGE MODE ONLY
  // ==========================================================

  if (
    !isFinoraPortableBranchAuthRestoreStorageModeMatch(
      payload.storageMode,
      current.storageMode,
    )
  ) {
    return failure(
      "STORAGE_MODE_MISMATCH",
      "The FINORA backup storage mode does not match the current Branch Credential.",
    );
  }

  // ==========================================================
  // 8. GENERATION ROLLBACK / FUTURE AUTHORITY POLICY
  // ==========================================================

  let generationDecision:
    ReturnType<
      typeof evaluateFinoraPortableBranchAuthRestoreGeneration
    >;

  try {
    generationDecision =
      evaluateFinoraPortableBranchAuthRestoreGeneration(
        payload.authGeneration,
        current.authGeneration,
      );
  }
  catch {
    return failure(
      "BACKUP_INVALID",
      "The FINORA backup authentication generation is invalid.",
    );
  }

  if (
    generationDecision ===
      "STALE_BACKUP"
  ) {
    return failure(
      "STALE_BACKUP",
      "This FINORA backup is older than the current Branch Credential authority.",
    );
  }

  if (
    generationDecision ===
      "FUTURE_BACKUP"
  ) {
    return failure(
      "FUTURE_BACKUP",
      "This FINORA backup is newer than the current Branch Credential authority and cannot be trusted.",
    );
  }

  // ==========================================================
  // 9. BRANCH CERTIFICATION AUTHORITY REQUIRED
  // ==========================================================

  if (
    payload.branchCertificationKeyMaterial ===
      undefined ||
    payload.branchCertificationKeyMaterial ===
      null
  ) {
    return failure(
      "CERTIFICATION_AUTHORITY_MISSING",
      "The FINORA backup does not contain migrated Branch Certification authority.",
    );
  }

  // ==========================================================
  // 10. ATOMIC STORE WRITE
  // ==========================================================

  try {
    await dependencies.portableStore.write(
      current.storageMode,
      envelope,
    );
  }
  catch (
    error
  ) {
    if (
      error instanceof
        FinoraPortableBranchAuthStoreError &&
      error.code ===
        "STORAGE_UNAVAILABLE"
    ) {
      return failure(
        "TARGET_UNAVAILABLE",
        "The FINORA Restore target is unavailable.",
      );
    }

    return failure(
      "TARGET_WRITE_FAILED",
      "FINORA could not write the restored Portable Auth state.",
    );
  }

  // ==========================================================
  // 11. EXPLICIT READBACK
  //
  // Success is not declared merely because rename() completed.
  // The persisted target is read through the normal bounded /
  // strict Portable Store read path and compared canonically.
  // ==========================================================

  let readback:
    FinoraPortableBranchAuthEnvelopeV1 |
    null;

  try {
    readback =
      await dependencies.portableStore.read(
        current.storageMode,
      );
  }
  catch {
    return failure(
      "TARGET_READBACK_FAILED",
      "FINORA could not verify the restored Portable Auth state.",
    );
  }

  if (!readback) {
    return failure(
      "TARGET_READBACK_FAILED",
      "The restored Portable Auth state could not be read back.",
    );
  }

  try {
    if (
      serializeEnvelope(
        readback,
      ) !==
      backup.portableAuthEnvelopeSerialized
    ) {
      return failure(
        "TARGET_READBACK_FAILED",
        "The restored Portable Auth state failed exact readback verification.",
      );
    }
  }
  catch {
    return failure(
      "TARGET_READBACK_FAILED",
      "The restored Portable Auth state failed readback validation.",
    );
  }

  return {
    success:
      true,

    data: {
      backupId:
        backup.backupId,

      storageMode:
        current.storageMode,

      authGeneration:
        current.authGeneration,
    },
  };
}

// ============================================================
// END
// ============================================================