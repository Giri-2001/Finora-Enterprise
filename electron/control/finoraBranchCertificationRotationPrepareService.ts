import {
  randomUUID,
} from "node:crypto";

import {
  FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,
  FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_ID_PREFIX,
} from "./finoraBranchCertificationRotationContract.js";

import {
  createFinoraBranchCertificationRotationRequestFile,
} from "./finoraBranchCertificationRotationRequest.js";

import {
  createFinoraPortableBranchAuthFingerprint,
} from "./finoraBranchDeviceTrustAuthority.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";

import {
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlStorePackage,
} from "./finoraControlStore.js";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  resolveFinoraBranchOperationalSessionContext,
} from "./finoraBranchLoginSessionAuthority.js";

import type {
  FinoraBranchOperationalSessionPrincipal,
} from "./finoraBranchLoginSessionAuthority.js";

import {
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
  FinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  loadFinoraBranchCertificationRotationPending,
  persistFinoraBranchCertificationRotationPending,
} from "./finoraBranchCertificationRotationPendingStore.js";

import type {
  FinoraBranchCertificationRotationPendingRecordV1,
} from "./finoraBranchCertificationRotationPendingStore.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

// ============================================================
// REQUEST / RESULT
// ============================================================

export interface FinoraBranchCertificationRotationPrepareRequest {
  sessionId:
    string;

  password:
    string;

  securityCode:
    string;
}

export type FinoraBranchCertificationRotationPrepareErrorCode =
  | "INVALID_REQUEST"
  | "SESSION_DENIED"
  | "SOURCE_NOT_FOUND"
  | "SOURCE_STORAGE_FAILED"
  | "AUTHENTICATION_FAILED"
  | "PORTABLE_AUTH_MISMATCH"
  | "CERTIFICATION_AUTHORITY_PRESENT"
  | "NATIVE_BINDING_UNAVAILABLE"
  | "CONTROL_STORE_FAILED"
  | "PENDING_STATE_FAILED"
  | "PENDING_CONFLICT"
  | "PERSIST_FAILED"
  | "PREPARE_FAILED";

export interface FinoraBranchCertificationRotationPrepareSuccess {
  requestId:
    string;

  requestedAt:
    string;

  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;

  storageMode:
    "LOCAL" | "USB";

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

  replacementCertificationPublicKey:
    ReturnType<
      typeof toFinoraBranchCertificationPublicKey
    >;

  requestFile:
    ReturnType<
      typeof createFinoraBranchCertificationRotationRequestFile
    >;

  recoveredExistingPending:
    boolean;
}

export type FinoraBranchCertificationRotationPrepareResult =
  | {
      success:
        true;

      data:
        FinoraBranchCertificationRotationPrepareSuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraBranchCertificationRotationPrepareErrorCode;

      error:
        string;
    };

// ============================================================
// PORTABLE STORE BOUNDARY
// ============================================================

export type FinoraBranchCertificationRotationPreparePortableStore =
  Pick<
    FinoraPortableBranchAuthStore,
    "read"
  >;

// ============================================================
// DEPENDENCIES
// ============================================================

export interface FinoraBranchCertificationRotationPrepareServiceDependencies {
  resolveOperationalSessionContext:
    typeof resolveFinoraBranchOperationalSessionContext;

  readControlStore:
    typeof readFinoraControlStore;

  getInstallationBinding:
    typeof getFinoraWindowsInstallationBinding;

  decryptPortableAuth:
    typeof decryptFinoraPortableBranchAuthEnvelopeV1;

  createPortableAuthFingerprint:
    typeof createFinoraPortableBranchAuthFingerprint;

  generateCertificationKeyMaterial:
    typeof generateFinoraBranchCertificationKeyMaterial;

  toCertificationPublicKey:
    typeof toFinoraBranchCertificationPublicKey;

  loadPending:
    typeof loadFinoraBranchCertificationRotationPending;

  persistPending:
    typeof persistFinoraBranchCertificationRotationPending;

  createRequestId:
    () => string;

  now:
    () => Date;
}

const DEFAULT_DEPENDENCIES:
  FinoraBranchCertificationRotationPrepareServiceDependencies = {

    resolveOperationalSessionContext:
      resolveFinoraBranchOperationalSessionContext,

    readControlStore:
      readFinoraControlStore,

    getInstallationBinding:
      getFinoraWindowsInstallationBinding,

    decryptPortableAuth:
      decryptFinoraPortableBranchAuthEnvelopeV1,

    createPortableAuthFingerprint:
      createFinoraPortableBranchAuthFingerprint,

    generateCertificationKeyMaterial:
      generateFinoraBranchCertificationKeyMaterial,

    toCertificationPublicKey:
      toFinoraBranchCertificationPublicKey,

    loadPending:
      loadFinoraBranchCertificationRotationPending,

    persistPending:
      persistFinoraBranchCertificationRotationPending,

    createRequestId:
      () =>
        (
          FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_ID_PREFIX +
          randomUUID()
            .toUpperCase()
        ),

    now:
      () =>
        new Date(),
  };

// ============================================================
// HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraBranchCertificationRotationPrepareErrorCode,

  error:
    string,
): FinoraBranchCertificationRotationPrepareResult {

  return {
    success:
      false,

    errorCode,

    error,
  };
}

function sanitizeRequest(
  value:
    unknown,
): FinoraBranchCertificationRotationPrepareRequest | null {

  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    return null;
  }

  const candidate =
    value as
      Record<
        string,
        unknown
      >;

  if (
    typeof candidate.sessionId !==
      "string" ||
    candidate.sessionId.trim().length ===
      0 ||
    candidate.sessionId.trim() !==
      candidate.sessionId ||
    typeof candidate.password !==
      "string" ||
    candidate.password.length ===
      0 ||
    typeof candidate.securityCode !==
      "string" ||
    candidate.securityCode.length ===
      0
  ) {
    return null;
  }

  return {
    sessionId:
      candidate.sessionId,

    password:
      candidate.password,

    securityCode:
      candidate.securityCode,
  };
}

function portablePayloadMatchesPrincipal(
  payload:
    FinoraPortableBranchAuthPayloadV1,

  principal:
    FinoraBranchOperationalSessionPrincipal,
): boolean {

  return (
    payload.ownerId ===
      principal.ownerId &&
    payload.businessId ===
      principal.businessId &&
    payload.branchId ===
      principal.branchId &&
    payload.userId ===
      principal.userId &&
    payload.username ===
      principal.username &&
    payload.storageMode ===
      principal.storageMode &&
    payload.dataContext ===
      principal.dataContext &&
    payload.authGeneration ===
      principal.authGeneration &&
    (
      payload.dataContext !==
        "DEMO" ||
      payload.demoId ===
        principal.demoId
    )
  );
}

function resolvePreviousCertificationKeyId(
  controlStore:
    FinoraControlStorePackage,

  principal:
    FinoraBranchOperationalSessionPrincipal,
): string | undefined {

  const matchingKeyIds =
    new Set<
      string
    >();

  for (
    const transaction of
      controlStore.portableBranchAuthEnrollmentTransactions ??
      []
  ) {
    if (
      transaction.status !==
        "COMPLETE" ||
      transaction.ownerId !==
        principal.ownerId ||
      transaction.businessId !==
        principal.businessId ||
      transaction.branchId !==
        principal.branchId ||
      transaction.storageMode !==
        principal.storageMode
    ) {
      continue;
    }

    const currentCertificationKeyId =
      transaction.branchCertificationRotationProvenance?.certificationKeyId ??
      transaction.branchCertificationProvenance?.certificationKeyId;

    if (
      currentCertificationKeyId ===
        undefined
    ) {
      continue;
    }

    matchingKeyIds.add(
      currentCertificationKeyId,
    );
  }

  if (
    matchingKeyIds.size !==
      1
  ) {
    return undefined;
  }

  return (
    matchingKeyIds
      .values()
      .next()
      .value
  );
}

function pendingMatchesCurrentEvidence(
  pending:
    FinoraBranchCertificationRotationPendingRecordV1,

  principal:
    FinoraBranchOperationalSessionPrincipal,

  binding:
    Awaited<
      ReturnType<
        typeof getFinoraWindowsInstallationBinding
      >
    >,

  portableAuthFingerprint:
    string,

  payload:
    FinoraPortableBranchAuthPayloadV1,
): boolean {

  if (
    binding ===
      undefined
  ) {
    return false;
  }

  return (
    pending.ownerId ===
      principal.ownerId &&
    pending.businessId ===
      principal.businessId &&
    pending.branchId ===
      principal.branchId &&
    pending.installationId ===
      binding.installationId &&
    pending.bindingKeyId ===
      binding.bindingKeyId &&
    pending.fingerprintAlgorithm ===
      binding.fingerprintAlgorithm &&
    pending.publicKeyFingerprint ===
      binding.publicKeyFingerprint &&
    pending.authStateId ===
      payload.authStateId &&
    pending.authGeneration ===
      payload.authGeneration &&
    pending.portableAuthFingerprintAlgorithm ===
      "SHA-256" &&
    pending.portableAuthFingerprint ===
      portableAuthFingerprint &&
    pending.recoveryReason ===
      FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON
  );
}

function successFromPending(
  pending:
    FinoraBranchCertificationRotationPendingRecordV1,

  storageMode:
    "LOCAL" | "USB",

  recoveredExistingPending:
    boolean,

  dependencies:
    FinoraBranchCertificationRotationPrepareServiceDependencies,
): FinoraBranchCertificationRotationPrepareResult {

  const replacementCertificationPublicKey =
    dependencies.toCertificationPublicKey(
      pending.replacementCertificationKeyMaterial,
    );

  const requestFile =
    createFinoraBranchCertificationRotationRequestFile(
      pending,
    );

  return {
    success:
      true,

    data: {
      requestId:
        pending.requestId,

      requestedAt:
        pending.requestedAt,

      ownerId:
        pending.ownerId,

      businessId:
        pending.businessId,

      branchId:
        pending.branchId,

      storageMode,

      authStateId:
        pending.authStateId,

      authGeneration:
        pending.authGeneration,

      portableAuthFingerprintAlgorithm:
        pending.portableAuthFingerprintAlgorithm,

      portableAuthFingerprint:
        pending.portableAuthFingerprint,

      ...(
        pending.previousCertificationKeyId ===
          undefined
          ? {}
          : {
              previousCertificationKeyId:
                pending.previousCertificationKeyId,
            }
      ),

      replacementCertificationPublicKey,

      requestFile,

      recoveredExistingPending,
    },
  };
}

// ============================================================
// PREPARE
//
// SECURITY:
// - Current operational session is resolved first.
// - Provisioned storageMode comes only from the authoritative
//   operational principal.
// - Password + Security Code decrypt the exact current Portable
//   Branch Auth envelope.
// - Existing Branch Certification private authority prevents
//   legacy-recovery rotation.
// - Replacement private key is persisted only in protected
//   pending custody and is never returned.
// - Local previous certification keyId is optional evidence.
//   It is used only when durable branch/storage provenance
//   resolves to exactly one distinct keyId.
// ============================================================

export async function prepareFinoraBranchCertificationRotation(
  input:
    unknown,

  portableStore:
    FinoraBranchCertificationRotationPreparePortableStore,

  dependencies:
    FinoraBranchCertificationRotationPrepareServiceDependencies =
      DEFAULT_DEPENDENCIES,
): Promise<
  FinoraBranchCertificationRotationPrepareResult
> {

  const request =
    sanitizeRequest(
      input,
    );

  if (!request) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA Branch Certification Rotation prepare request is required.",
    );
  }

  if (
    !portableStore ||
    typeof portableStore.read !==
      "function"
  ) {
    return failure(
      "INVALID_REQUEST",
      "FINORA Portable Branch Auth storage is required.",
    );
  }

  const sessionResult =
    await dependencies.resolveOperationalSessionContext({
      sessionId:
        request.sessionId,
    });

  if (
    !sessionResult.success
  ) {
    return failure(
      "SESSION_DENIED",
      sessionResult.error,
    );
  }

  const context =
    sessionResult.data;

  const principal =
    context.principal;

  const storageMode =
    principal.storageMode;

  let envelope:
    FinoraPortableBranchAuthEnvelopeV1 | null;

  try {
    envelope =
      await portableStore.read(
        storageMode,
      );
  }
  catch (
    error
  ) {
    return failure(
      "SOURCE_STORAGE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to read current FINORA Portable Branch Auth state.",
    );
  }

  if (
    envelope ===
      null
  ) {
    return failure(
      "SOURCE_NOT_FOUND",
      "Current FINORA Portable Branch Auth state was not found in the provisioned storage mode.",
    );
  }

  let portableAuthFingerprint:
    string;

  try {
    portableAuthFingerprint =
      dependencies.createPortableAuthFingerprint(
        envelope,
      );
  }
  catch (
    error
  ) {
    return failure(
      "SOURCE_STORAGE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to fingerprint current FINORA Portable Branch Auth state.",
    );
  }

  let payload:
    FinoraPortableBranchAuthPayloadV1;

  try {
    payload =
      await dependencies.decryptPortableAuth(
        envelope,
        request.password,
        request.securityCode,
      );
  }
  catch {
    return failure(
      "AUTHENTICATION_FAILED",
      "Password or Security Code did not authorize the current FINORA Portable Branch Auth state.",
    );
  }

  if (
    !portablePayloadMatchesPrincipal(
      payload,
      principal,
    )
  ) {
    return failure(
      "PORTABLE_AUTH_MISMATCH",
      "Current FINORA Portable Branch Auth state does not match the active branch session.",
    );
  }

  if (
    payload.branchCertificationKeyMaterial !==
      undefined
  ) {
    return failure(
      "CERTIFICATION_AUTHORITY_PRESENT",
      "Current FINORA Portable Branch Auth already contains Branch Certification private authority; legacy certification recovery rotation is not applicable.",
    );
  }

  let binding:
    Awaited<
      ReturnType<
        typeof getFinoraWindowsInstallationBinding
      >
    >;

  try {
    binding =
      await dependencies.getInstallationBinding();
  }
  catch (
    error
  ) {
    return failure(
      "NATIVE_BINDING_UNAVAILABLE",
      error instanceof Error
        ? error.message
        : "Unable to read the FINORA native installation binding.",
    );
  }

  if (
    binding ===
      undefined
  ) {
    return failure(
      "NATIVE_BINDING_UNAVAILABLE",
      "FINORA native installation binding is unavailable.",
    );
  }

  let existingPending:
    FinoraBranchCertificationRotationPendingRecordV1 |
    undefined;

  try {
    existingPending =
      await dependencies.loadPending();
  }
  catch (
    error
  ) {
    return failure(
      "PENDING_STATE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to read FINORA Branch Certification Rotation pending custody.",
    );
  }

  if (
    existingPending !==
      undefined
  ) {
    if (
      !pendingMatchesCurrentEvidence(
        existingPending,
        principal,
        binding,
        portableAuthFingerprint,
        payload,
      )
    ) {
      return failure(
        "PENDING_CONFLICT",
        "Existing FINORA Branch Certification Rotation pending custody does not match the current branch, device, or Portable Auth state.",
      );
    }

    try {
      return successFromPending(
        existingPending,
        storageMode,
        true,
        dependencies,
      );
    }
    catch (
      error
    ) {
      return failure(
        "PREPARE_FAILED",
        error instanceof Error
          ? error.message
          : "Unable to reconstruct the existing FINORA Branch Certification Rotation request.",
      );
    }
  }

  const controlStoreResult =
    await dependencies.readControlStore();

  if (
    !controlStoreResult.success ||
    !controlStoreResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      controlStoreResult.error ??
        "Unable to read authoritative FINORA Control Store state.",
    );
  }

  const previousCertificationKeyId =
    resolvePreviousCertificationKeyId(
      controlStoreResult.data,
      principal,
    );

  const now =
    dependencies.now();

  if (
    !(now instanceof Date) ||
    !Number.isFinite(
      now.getTime(),
    )
  ) {
    return failure(
      "PREPARE_FAILED",
      "FINORA Branch Certification Rotation prepare timestamp is invalid.",
    );
  }

  const requestedAt =
    now.toISOString();

  const requestId =
    dependencies.createRequestId();

  if (
    typeof requestId !==
      "string" ||
    requestId.length ===
      0 ||
    !requestId.startsWith(
      FINORA_BRANCH_CERTIFICATION_ROTATION_REQUEST_ID_PREFIX,
    )
  ) {
    return failure(
      "PREPARE_FAILED",
      "FINORA Branch Certification Rotation requestId generation failed.",
    );
  }

  let replacementCertificationKeyMaterial;

  try {
    replacementCertificationKeyMaterial =
      dependencies.generateCertificationKeyMaterial(
        now,
      );
  }
  catch (
    error
  ) {
    return failure(
      "PREPARE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to generate replacement Branch Certification authority.",
    );
  }

  let persisted:
    FinoraBranchCertificationRotationPendingRecordV1;

  try {
    persisted =
      await dependencies.persistPending({
        requestId,

        ownerId:
          principal.ownerId,

        businessId:
          principal.businessId,

        branchId:
          principal.branchId,

        installationId:
          binding.installationId,

        bindingKeyId:
          binding.bindingKeyId,

        fingerprintAlgorithm:
          binding.fingerprintAlgorithm,

        publicKeyFingerprint:
          binding.publicKeyFingerprint,

        authStateId:
          payload.authStateId,

        authGeneration:
          payload.authGeneration,

        portableAuthFingerprintAlgorithm:
          "SHA-256",

        portableAuthFingerprint,

        ...(
          previousCertificationKeyId ===
            undefined
            ? {}
            : {
                previousCertificationKeyId,
              }
        ),

        replacementCertificationKeyMaterial,

        recoveryReason:
          FINORA_BRANCH_CERTIFICATION_ROTATION_RECOVERY_REASON,

        requestedAt,
      });
  }
  catch (
    error
  ) {
    return failure(
      "PERSIST_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to persist protected FINORA Branch Certification Rotation pending custody.",
    );
  }

  try {
    return successFromPending(
      persisted,
      storageMode,
      false,
      dependencies,
    );
  }
  catch (
    error
  ) {
    return failure(
      "PREPARE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to create the FINORA Branch Certification Rotation request.",
    );
  }
}