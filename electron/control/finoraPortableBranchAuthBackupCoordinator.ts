// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH BACKUP COORDINATOR
// PHASE : 5.6N-N2
// ============================================================
//
// SECURITY BOUNDARY:
//
// Renderer-facing callers provide only:
// - sessionId
// - Password
// - Security Code
//
// ownerId / businessId / branchId / storageMode / authGeneration
// are resolved from the authoritative in-memory login session +
// freshly re-read Control Store.
//
// Backup creation is read/export only, so both ACTIVE and
// REGISTERED_EXPIRED_READ_ONLY sessions may create a backup.
// Restore remains responsible for current entitlement/access checks.
//
// No Password or Security Code is persisted or returned.
//
// The Branch Certification private authority is never extracted
// from Portable Auth. It remains inside the exact encrypted envelope.
// ============================================================

import {
  randomUUID,
} from "node:crypto";

import {
  createFinoraPortableBranchAuthBackupFileV1,
  serializeFinoraPortableBranchAuthBackupFileV1,
} from "./finoraPortableBranchAuthBackupContract.js";

import type {
  FinoraPortableBranchAuthBackupFileV1,
} from "./finoraPortableBranchAuthBackupContract.js";

import {
  serializeFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
  FinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  resolveFinoraBranchOperationalSessionContext,
} from "./finoraBranchLoginSessionAuthority.js";

import type {
  FinoraBranchOperationalSessionContextResult,
} from "./finoraBranchLoginSessionAuthority.js";

// ============================================================
// REQUEST
// ============================================================

export interface FinoraPortableBranchAuthBackupCreationRequest {
  sessionId:
    string;

  password:
    string;

  securityCode:
    string;
}

export type FinoraPortableBranchAuthBackupCreationErrorCode =
  | "INVALID_REQUEST"
  | "SESSION_DENIED"
  | "SESSION_STATE_MISMATCH"
  | "SOURCE_NOT_FOUND"
  | "SOURCE_STORAGE_FAILED"
  | "AUTHENTICATION_FAILED"
  | "CERTIFICATION_AUTHORITY_MISSING"
  | "SCOPE_MISMATCH"
  | "STORAGE_MODE_MISMATCH"
  | "AUTH_GENERATION_MISMATCH"
  | "BACKUP_CREATION_FAILED";

export interface FinoraPortableBranchAuthBackupCreationSuccess {
  backupId:
    string;

  createdAt:
    string;

  branchScope: {
    ownerId:
      string;

    businessId:
      string;

    branchId:
      string;
  };

  sourceStorageMode:
    "LOCAL" | "USB";

  authGeneration:
    number;

  backupFile:
    FinoraPortableBranchAuthBackupFileV1;

  /**
   * Internal privileged artifact bytes.
   *
   * Native transport may persist these bytes to a user-selected
   * backup file. They MUST NOT be returned directly to renderer.
   */
  serializedBackup:
    string;

  bytes:
    number;
}

export type FinoraPortableBranchAuthBackupCreationResult =
  | {
      success:
        true;

      data:
        FinoraPortableBranchAuthBackupCreationSuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableBranchAuthBackupCreationErrorCode;

      error:
        string;
    };

// ============================================================
// DEPENDENCIES
// ============================================================

interface FinoraBackupAuthoritativeScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

export interface FinoraPortableBranchAuthBackupCoordinatorDependencies {
  resolveSession:
    (
      sessionId:
        string,
    ) =>
      Promise<
        FinoraBranchOperationalSessionContextResult
      >;

  decryptPortableAuth:
    (
      envelope:
        FinoraPortableBranchAuthEnvelopeV1,
      password:
        string,
      securityCode:
        string,
      expectedScope:
        FinoraBackupAuthoritativeScope,
    ) =>
      Promise<
        FinoraPortableBranchAuthPayloadV1
      >;

  serializePortableAuth:
    (
      envelope:
        FinoraPortableBranchAuthEnvelopeV1,
    ) =>
      string;

  now:
    () =>
      Date;

  createBackupId:
    () =>
      string;
}

function createDefaultDependencies():
  FinoraPortableBranchAuthBackupCoordinatorDependencies {
  return {
    resolveSession:
      async (
        sessionId,
      ) =>
        resolveFinoraBranchOperationalSessionContext({
          sessionId,
        }),

    decryptPortableAuth:
      (
        envelope,
        password,
        securityCode,
        expectedScope,
      ) =>
        decryptFinoraPortableBranchAuthEnvelopeV1(
          envelope,
          password,
          securityCode,
          {
            expectedScope,
          },
        ),

    serializePortableAuth:
      (
        envelope,
      ) =>
        serializeFinoraPortableBranchAuthEnvelopeV1(
          envelope,
        ),

    now:
      () =>
        new Date(),

    createBackupId:
      () =>
        `FINORA-PBA-BACKUP-${randomUUID().toUpperCase()}`,
  };
}

// ============================================================
// HELPERS
// ============================================================

type UnknownObject =
  Record<string, unknown>;

function isObject(
  value:
    unknown,
): value is UnknownObject {
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

function sanitizeRequest(
  value:
    unknown,
): FinoraPortableBranchAuthBackupCreationRequest | null {
  if (
    !isObject(
      value,
    )
  ) {
    return null;
  }

  const keys =
    Object.keys(
      value,
    ).sort();

  const expectedKeys =
    [
      "password",
      "securityCode",
      "sessionId",
    ].sort();

  if (
    keys.length !==
      expectedKeys.length ||
    keys.some(
      (
        key,
        index,
      ) =>
        key !==
          expectedKeys[index],
    )
  ) {
    return null;
  }

  if (
    typeof value.sessionId !==
      "string" ||
    value.sessionId.length ===
      0 ||
    value.sessionId.length >
      512 ||
    value.sessionId !==
      value.sessionId.trim() ||
    typeof value.password !==
      "string" ||
    typeof value.securityCode !==
      "string"
  ) {
    return null;
  }

  return {
    sessionId:
      value.sessionId,

    password:
      value.password,

    securityCode:
      value.securityCode,
  };
}

function failure(
  errorCode:
    FinoraPortableBranchAuthBackupCreationErrorCode,
  error:
    string,
): FinoraPortableBranchAuthBackupCreationResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function stringsEqual(
  left:
    string,
  right:
    string,
): boolean {
  return left ===
    right;
}

// ============================================================
// CREATION
// ============================================================

export async function createFinoraPortableBranchAuthBackup(
  input:
    unknown,
  portableStore:
    Pick<
      FinoraPortableBranchAuthStore,
      "read"
    >,
  dependencyOverrides:
    Partial<
      FinoraPortableBranchAuthBackupCoordinatorDependencies
    > = {},
): Promise<
  FinoraPortableBranchAuthBackupCreationResult
> {
  const request =
    sanitizeRequest(
      input,
    );

  if (
    request ===
      null
  ) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA Portable Branch Auth backup request is required.",
    );
  }

  const defaults =
    createDefaultDependencies();

  const dependencies:
    FinoraPortableBranchAuthBackupCoordinatorDependencies = {
      ...defaults,
      ...dependencyOverrides,
    };

  let sessionResult:
    FinoraBranchOperationalSessionContextResult;

  try {
    sessionResult =
      await dependencies.resolveSession(
        request.sessionId,
      );
  }
  catch {
    return failure(
      "SESSION_DENIED",
      "An authenticated FINORA branch session is required.",
    );
  }

  if (
    !sessionResult.success
  ) {
    return failure(
      "SESSION_DENIED",
      "An authenticated FINORA branch session is required.",
    );
  }

  const session =
    sessionResult.data.session;

  const principal =
    sessionResult.data.principal;

  if (
    session.sessionId !==
      request.sessionId ||
    !stringsEqual(
      session.ownerId,
      principal.ownerId,
    ) ||
    !stringsEqual(
      session.businessId,
      principal.businessId,
    ) ||
    !stringsEqual(
      session.branchId,
      principal.branchId,
    ) ||
    session.storageMode !==
      principal.storageMode
  ) {
    return failure(
      "SESSION_STATE_MISMATCH",
      "Authenticated FINORA branch session state is inconsistent.",
    );
  }

  if (
    session.accessMode !==
      "ACTIVE" &&
    session.accessMode !==
      "REGISTERED_EXPIRED_READ_ONLY"
  ) {
    return failure(
      "SESSION_DENIED",
      "Authenticated FINORA branch access is unavailable.",
    );
  }

  if (
    principal.storageMode !==
      "LOCAL" &&
    principal.storageMode !==
      "USB"
  ) {
    return failure(
      "SESSION_STATE_MISMATCH",
      "Authenticated FINORA storage authority is invalid.",
    );
  }

  if (
    !Number.isSafeInteger(
      principal.authGeneration,
    ) ||
    principal.authGeneration <
      1
  ) {
    return failure(
      "SESSION_STATE_MISMATCH",
      "Authenticated FINORA credential generation is invalid.",
    );
  }

  const authoritativeScope:
    FinoraBackupAuthoritativeScope = {
      ownerId:
        principal.ownerId,

      businessId:
        principal.businessId,

      branchId:
        principal.branchId,
    };

  let sourceEnvelope:
    FinoraPortableBranchAuthEnvelopeV1 | null;

  try {
    sourceEnvelope =
      await portableStore.read(
        principal.storageMode,
      );
  }
  catch {
    return failure(
      "SOURCE_STORAGE_FAILED",
      "Unable to read Portable Branch Auth for backup.",
    );
  }

  if (
    sourceEnvelope ===
      null
  ) {
    return failure(
      "SOURCE_NOT_FOUND",
      "Portable Branch Auth is unavailable for backup.",
    );
  }

  let payload:
    FinoraPortableBranchAuthPayloadV1;

  try {
    payload =
      await dependencies.decryptPortableAuth(
        sourceEnvelope,
        request.password,
        request.securityCode,
        authoritativeScope,
      );
  }
  catch {
    return failure(
      "AUTHENTICATION_FAILED",
      "Portable Branch Auth authentication failed.",
    );
  }

  if (
    !stringsEqual(
      payload.ownerId,
      authoritativeScope.ownerId,
    ) ||
    !stringsEqual(
      payload.businessId,
      authoritativeScope.businessId,
    ) ||
    !stringsEqual(
      payload.branchId,
      authoritativeScope.branchId,
    )
  ) {
    return failure(
      "SCOPE_MISMATCH",
      "Portable Branch Auth does not match the authenticated branch scope.",
    );
  }

  if (
    payload.storageMode !==
      principal.storageMode
  ) {
    return failure(
      "STORAGE_MODE_MISMATCH",
      "Portable Branch Auth storage mode does not match the authenticated session.",
    );
  }

  if (
    payload.authGeneration !==
      principal.authGeneration
  ) {
    return failure(
      "AUTH_GENERATION_MISMATCH",
      "Portable Branch Auth credential generation does not match the authenticated session.",
    );
  }

  if (
    payload.branchCertificationKeyMaterial ===
      undefined
  ) {
    return failure(
      "CERTIFICATION_AUTHORITY_MISSING",
      "Portable Branch Auth does not contain migrated Branch Certification authority.",
    );
  }

  try {
    const portableAuthEnvelopeSerialized =
      dependencies.serializePortableAuth(
        sourceEnvelope,
      );

    const createdAt =
      dependencies.now()
        .toISOString();

    const backupId =
      dependencies.createBackupId();

    const backupFile =
      createFinoraPortableBranchAuthBackupFileV1({
        backupId,

        createdAt,

        branchScope: {
          ownerId:
            authoritativeScope.ownerId,

          businessId:
            authoritativeScope.businessId,

          branchId:
            authoritativeScope.branchId,
        },

        sourceStorageMode:
          principal.storageMode,

        authGeneration:
          principal.authGeneration,

        portableAuthEnvelopeSerialized,
      });

    const serializedBackup =
      serializeFinoraPortableBranchAuthBackupFileV1(
        backupFile,
      );

    const bytes =
      Buffer.byteLength(
        serializedBackup,
        "utf8",
      );

    return {
      success:
        true,

      data: {
        backupId,

        createdAt,

        branchScope: {
          ownerId:
            authoritativeScope.ownerId,

          businessId:
            authoritativeScope.businessId,

          branchId:
            authoritativeScope.branchId,
        },

        sourceStorageMode:
          principal.storageMode,

        authGeneration:
          principal.authGeneration,

        backupFile,

        serializedBackup,

        bytes,
      },
    };
  }
  catch {
    return failure(
      "BACKUP_CREATION_FAILED",
      "Unable to create the FINORA Portable Branch Auth backup artifact.",
    );
  }
}