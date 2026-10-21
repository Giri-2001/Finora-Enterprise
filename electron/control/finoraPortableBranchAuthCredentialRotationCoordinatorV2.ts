import {
  randomUUID,
} from "node:crypto";

import {
  getFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  authenticateFinoraBranchCredential,
} from "./finoraBranchCredentialAuthenticationService.js";
import {
  recoverFinoraPortableBranchAuthCredentialRotationsV2,
} from "./finoraPortableBranchAuthCredentialRotationRecoveryServiceV2.js";

import {
  runFinoraPortableBranchAuthV2CredentialMutationSerialized,
} from "./finoraPortableBranchAuthCredentialMutationQueueV2.js";

import type {
  FinoraBranchCredentialAuthenticationSuccess,
} from "./finoraBranchCredentialAuthenticationService.js";

import {
  createFinoraPortableBranchAuthEnrollmentMaterialV2,
  decryptFinoraPortableBranchAuthEnvelopeV2WithPassword,
  decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode,
  repairFinoraPortableBranchAuthV2CreatedAtByRecoveryCode,
  rotateFinoraPortableBranchAuthV2PasswordByRecoveryCode,
  rotateFinoraPortableBranchAuthV2RecoveryCodeByPassword,
} from "./finoraPortableBranchAuthV2Crypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,
  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1,
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthReplaceResult,
  FinoraPortableBranchAuthV2Store,
} from "./finoraPortableBranchAuthV2Store.js";

import {
  applyFinoraPortableBranchAuthV2CredentialRotationControlState,
  completeFinoraPortableBranchAuthV2CredentialRotationTransaction,
  markFinoraPortableBranchAuthV2CredentialRotationPortableReplaced,
  prepareFinoraPortableBranchAuthV2CredentialRotationTransaction,
  readPendingFinoraPortableBranchAuthV2CredentialRotation,
  readFinoraControlStore,
  hasActiveFinoraStorageEntitlement,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlBranchCredentialVerifierV1,
} from "./finoraControlStore.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX,
  FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,
  computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256,
  validateFinoraPortableBranchAuthCredentialRotationTransactionV2,
} from "./finoraPortableBranchAuthCredentialRotationTransactionV2.js";

import type {
  FinoraPortableBranchAuthCredentialRotationTransactionV2,
} from "./finoraPortableBranchAuthCredentialRotationTransactionV2.js";


import {
  readFinoraWalletBranchCertificationDeviceVault,
} from "./finoraWalletBranchCertificationDeviceVault.js";
// ============================================================
// CONTRACT

// ============================================================

/*
 * FINORA_P1_578OE_CONTROL_AUTH_RECONVERGENCE
 */
export interface FinoraPortableBranchAuthSecurityCodeReconvergenceRequestV2 {
  rotationRequestId: string;
  username: string;
  currentPassword: string;
  newSecurityCode: string;
}

export interface FinoraPortableBranchAuthSecurityCodeReconvergenceCoordinatorV2Input {
  request:
    FinoraPortableBranchAuthSecurityCodeReconvergenceRequestV2;

  portableStore:
    FinoraPortableBranchAuthV2Store;
}


// ============================================================

export interface FinoraPortableBranchAuthCredentialRotationRequestV2 {
  /**
   * Stable idempotency identity generated once by the caller for
   * this logical rotation submission and reused for retries.
   *
   * Never derive this value from Password or Security Code.
   */
  rotationRequestId:
    string;

  username:
    string;

  currentPassword:
    string;

  currentSecurityCode:
    string;

  /**
   * Omit to preserve the current Password.
   *
   * Plaintext is process-memory-only and is never copied into the
   * durable rotation transaction or Control Store.
   */
  newPassword?:
    string;

  /**
   * Omit to preserve the current Security Code.
   *
   * Plaintext is process-memory-only and is never copied into the
   * durable rotation transaction or Control Store.
   */
  newSecurityCode?:
    string;
}

export interface FinoraPortableBranchAuthCredentialRotationCoordinatorV2Input {
  request:
    FinoraPortableBranchAuthCredentialRotationRequestV2;

  portableStore:
    FinoraPortableBranchAuthV2Store;
}

export interface FinoraPortableBranchAuthCredentialRotationResumeV2Input {
  transaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV2;

  portableStore:
    FinoraPortableBranchAuthV2Store;
}
export type FinoraPortableBranchAuthCredentialRotationCoordinatorV2ErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "AUTHENTICATION_FAILED"
  | "CONTROL_STORE_FAILED"
  | "CURRENT_CREDENTIAL_INVALID"
  | "PORTABLE_STORAGE_FAILED"
  | "CURRENT_PORTABLE_AUTH_MISSING"
  | "CURRENT_PORTABLE_AUTH_AUTHENTICATION_FAILED"
  | "CURRENT_PORTABLE_AUTH_MISMATCH"
  | "NO_CREDENTIAL_CHANGE"
  | "GENERATION_INVALID"
  | "MATERIAL_DERIVATION_FAILED"
  | "TRANSACTION_INVALID"
  | "PREPARE_FAILED"
  | "PORTABLE_REPLACE_FAILED"
  | "PORTABLE_REPLACED_STATE_FAILED"
  | "CONTROL_APPLY_FAILED"
  | "COMPLETE_FAILED";

export interface FinoraPortableBranchAuthCredentialRotationCoordinatorV2Success {
  transactionId:
    string;

  credential:
    FinoraControlBranchCredential;

  authGeneration:
    number;

  portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult;
}

export type FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result =
  | {
      success:
        true;

      data:
        FinoraPortableBranchAuthCredentialRotationCoordinatorV2Success;
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableBranchAuthCredentialRotationCoordinatorV2ErrorCode;

      error:
        string;
    };

// ============================================================
// PROCESS-WIDE SERIALIZATION
// ============================================================
//
// Rotation creates random cryptographic replacement material before
// PREPARED becomes durable.
//
// Process-wide serialization prevents two concurrent requests from
// deriving competing successor generations for the same credential.
// ============================================================

// ============================================================
// RESULT HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthCredentialRotationCoordinatorV2ErrorCode,
  error:
    string,
): FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function success(
  transactionId:
    string,
  credential:
    FinoraControlBranchCredential,
  authGeneration:
    number,
  portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult,
): FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result {
  return {
    success:
      true,

    data: {
      transactionId,

      credential,

      authGeneration,

      portableReplaceResult,
    },
  };
}

function getErrorMessage(
  error:
    unknown,
  fallback:
    string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

// ============================================================
// REQUEST SHAPE
// ============================================================

function isOptionalString(
  value:
    unknown,
): value is string | undefined {
  return (
    value ===
      undefined ||
    typeof value ===
      "string"
  );
}

function isValidRequest(
  request:
    FinoraPortableBranchAuthCredentialRotationRequestV2,
): boolean {
  return (
    typeof request ===
      "object" &&
    request !==
      null &&
    typeof request.rotationRequestId !==
      "string" ||
    request.rotationRequestId.length ===
      0 ||
    request.rotationRequestId.trim() !==
      request.rotationRequestId ||
    typeof request.username ===
      "string" &&
    typeof request.currentPassword ===
      "string" &&
    typeof request.currentSecurityCode ===
      "string" &&
    isOptionalString(
      request.newPassword,
    ) &&
    isOptionalString(
      request.newSecurityCode,
    )
  );
}

// ============================================================
// PORTABLE -> CONTROL VERIFIER ADAPTER
// ============================================================
//
// Portable Auth derives 64 bytes so verifier evidence and encryption
// key material remain separated.
//
// Control Store persists only the 32-byte verifier evidence.
// ============================================================

function toControlCredentialVerifier(
  verifier:
    FinoraPortableBranchAuthVerifierV1,
): FinoraControlBranchCredentialVerifierV1 {
  return {
    algorithm:
      "SCRYPT",

    saltEncoding:
      "BASE64",

    salt:
      verifier.salt,

    derivedKeyEncoding:
      "BASE64",

    derivedKey:
      verifier.verifier,

    keyLength:
      32,

    N:
      verifier.N,

    r:
      verifier.r,

    p:
      verifier.p,
  };
}

function controlCredentialVerifiersEqual(
  left:
    FinoraControlBranchCredentialVerifierV1 | undefined,
  right:
    FinoraControlBranchCredentialVerifierV1,
): boolean {
  return (
    left !==
      undefined &&
    left.algorithm ===
      right.algorithm &&
    left.saltEncoding ===
      right.saltEncoding &&
    left.salt ===
      right.salt &&
    left.derivedKeyEncoding ===
      right.derivedKeyEncoding &&
    left.derivedKey ===
      right.derivedKey &&
    left.keyLength ===
      right.keyLength &&
    left.N ===
      right.N &&
    left.r ===
      right.r &&
    left.p ===
      right.p
  );
}

// ============================================================
// AUTHENTICATED PRINCIPAL CORRELATION
// ============================================================

function credentialMatchesAuthenticatedPrincipal(
  credential:
    FinoraControlBranchCredential,
  principal:
    FinoraBranchCredentialAuthenticationSuccess,
  normalizedGeneration:
    number,
): boolean {
  return (
    credential.credentialId ===
      principal.credentialId &&
    credential.userId ===
      principal.userId &&
    credential.username ===
      principal.username &&
    credential.fullName ===
      principal.fullName &&
    credential.role ===
      principal.role &&
    credential.ownerId ===
      principal.ownerId &&
    credential.businessId ===
      principal.businessId &&
    credential.branchId ===
      principal.branchId &&
    credential.storageMode ===
      principal.storageMode &&
    credential.dataContext ===
      principal.dataContext &&
    (
      credential.demoId ??
      undefined
    ) ===
      (
        principal.demoId ??
        undefined
      ) &&
    normalizedGeneration ===
      principal.authGeneration
  );
}

// ============================================================
// CURRENT PORTABLE PAYLOAD CORRELATION
// ============================================================
//
// Decryption proves possession of both current factors.
//
// This correlation then proves that the decrypted Portable Auth is
// the exact portable representation of the authenticated current
// Control Store credential lineage.
// ============================================================

function currentPortablePayloadMatchesCredential(
  payload:
    Awaited<
      ReturnType<
        typeof decryptFinoraPortableBranchAuthEnvelopeV2WithPassword
      >
    >,
  credential:
    FinoraControlBranchCredential,
  currentGeneration:
    number,
): boolean {
  const expectedPasswordVerifier =
    toControlCredentialVerifier(
      payload.passwordVerifier,
    );

  const expectedSecurityVerifier =
    toControlCredentialVerifier(
      payload.securityVerifier,
    );

  return (
    payload.sourceAuthorizationId ===
      credential.sourceAuthorizationId &&
    payload.sourceAuthorizationVerificationEvidence.authorizationId ===
      credential.sourceAuthorizationId &&
    payload.ownerId ===
      credential.ownerId &&
    payload.businessId ===
      credential.businessId &&
    payload.branchId ===
      credential.branchId &&
    payload.userId ===
      credential.userId &&
    payload.username ===
      credential.username &&
    payload.canonicalUsername ===
      credential.canonicalUsername &&
    payload.fullName ===
      credential.fullName &&
    payload.role ===
      credential.role &&
    payload.storageMode ===
      credential.storageMode &&
    payload.dataContext ===
      credential.dataContext &&
    (
      payload.demoId ??
      undefined
    ) ===
      (
        credential.demoId ??
        undefined
      ) &&
    payload.authGeneration ===
      currentGeneration &&
    payload.createdAt ===
      credential.createdAt &&
    payload.updatedAt ===
      credential.updatedAt &&
    controlCredentialVerifiersEqual(
      credential.verifier,
      expectedPasswordVerifier,
    ) &&
    controlCredentialVerifiersEqual(
      credential.securityVerifier,
      expectedSecurityVerifier,
    )
  );
}

// ============================================================
// INTERNAL ROTATION
// ============================================================

async function rotatePortableBranchAuthCredentialV2Internal(
  input:
    FinoraPortableBranchAuthCredentialRotationCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  if (
    !input ||
    typeof input !==
      "object" ||
    !input.request ||
    !input.portableStore ||
    !isValidRequest(
      input.request,
    )
  ) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA credential rotation request is required.",
    );
  }

  const request =
    input.request;

  // ==========================================================
  // 1. DURABLE V2 RECOVERY BEFORE CREDENTIAL AUTHENTICATION
  //
  // A previous rotation may have crashed after CONTROL_APPLIED.
  // In that state the old Password verifier is no longer
  // authoritative, so retry MUST reconcile the durable frozen
  // transaction before attempting current-Password auth.
  //
  // Recovery accepts no Password or Security Code and derives
  // no fresh cryptographic material.
  // ==========================================================

  const preAuthRecovery =
    await recoverFinoraPortableBranchAuthCredentialRotationsV2({
      portableStore:
        input.portableStore,
    });

  if (!preAuthRecovery.success) {
    return failure(
      "CONTROL_STORE_FAILED",
      preAuthRecovery.error,
    );
  }

  // ==========================================================
  // 1A. EXACT REQUEST-ID IDEMPOTENT RETRY
  //
  // Recovery itself grants no authentication authority.
  //
  // Only a transaction that:
  // - was recovered by THIS pre-auth recovery operation,
  // - is now durably COMPLETE, and
  // - carries the exact caller-supplied rotationRequestId
  //
  // may be returned as the already-completed logical request.
  //
  // A completed historical transaction that was not recovered
  // during this invocation is deliberately NOT sufficient.
  // ==========================================================

  if (
    preAuthRecovery.data.recoveredCount >
      0
  ) {
    const recoveredTransactionIds =
      new Set(
        preAuthRecovery.data.recoveredTransactions.map(
          (item) =>
            item.transactionId,
        ),
      );

    const recoveredStoreResult =
      await readFinoraControlStore();

    if (
      !recoveredStoreResult.success ||
      !recoveredStoreResult.data
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        recoveredStoreResult.error ??
          "Unable to read Control Store after V2 credential rotation recovery.",
      );
    }

    const exactRecoveredRequest =
      (
        recoveredStoreResult.data
          .portableBranchAuthV2CredentialRotationTransactions ??
        []
      ).filter(
        (transaction) =>
          recoveredTransactionIds.has(
            transaction.transactionId,
          ) &&
          transaction.status ===
            "COMPLETE" &&
          transaction.rotationRequestId ===
            request.rotationRequestId,
      );

    if (
      exactRecoveredRequest.length >
        1
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        "Multiple recovered V2 credential rotations share the same rotationRequestId.",
      );
    }

    if (
      exactRecoveredRequest.length ===
        1
    ) {
      const recoveredTransaction =
        exactRecoveredRequest[0];

      return success(
        recoveredTransaction.transactionId,
        structuredClone(
          recoveredTransaction.replacementCredential,
        ),
        recoveredTransaction.targetGeneration,
        "ALREADY_MATCHED",
      );
    }
  }

  // ==========================================================
  // 2. PASSWORD-FIRST AUTHORITY
  //
  // SECURITY:
  // No Portable Auth read and no Security Code verification occurs
  // before current Password authentication succeeds.
  // ==========================================================

  const authentication =
    await authenticateFinoraBranchCredential({
      username:
        request.username,

      password:
        request.currentPassword,
    });

  if (!authentication.success) {
    if (
      authentication.errorCode ===
        "INVALID_CREDENTIALS"
    ) {
      return failure(
        "INVALID_CREDENTIALS",
        authentication.error,
      );
    }

    if (
      authentication.errorCode ===
        "CONTROL_STORE_FAILED"
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        authentication.error,
      );
    }

    return failure(
      "AUTHENTICATION_FAILED",
      authentication.error,
    );
  }

  const principal =
    authentication.data;

  // ==========================================================
  // 2. AUTHORITATIVE CURRENT CREDENTIAL
  // ==========================================================

  const controlStoreResult =
    await readFinoraControlStore();

  if (
    !controlStoreResult.success ||
    !controlStoreResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      controlStoreResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const matchingCredentials =
    (
      controlStoreResult.data.branchCredentials ??
      []
    ).filter(
      (credential) =>
        credential.credentialId ===
          principal.credentialId &&
        credential.status ===
          "ACTIVE",
    );

  if (
    matchingCredentials.length !==
      1
  ) {
    return failure(
      "CURRENT_CREDENTIAL_INVALID",
      "The authenticated FINORA credential is not uniquely authoritative.",
    );
  }

  const currentCredential =
    matchingCredentials[0];

  const currentGeneration =
    currentCredential.authGeneration ??
    FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION;

  if (
    !Number.isSafeInteger(
      currentGeneration,
    ) ||
    currentGeneration <
      FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION ||
    !credentialMatchesAuthenticatedPrincipal(
      currentCredential,
      principal,
      currentGeneration,
    )
  ) {
    return failure(
      "CURRENT_CREDENTIAL_INVALID",
      "The authenticated FINORA credential state is inconsistent.",
    );
  }

  // ==========================================================
  // 3. CURRENT PORTABLE AUTH
  //
  // This point is intentionally after successful Password auth.
  // ==========================================================

  let currentEnvelope;

  // AUTO-RESUME EXISTING V2 ROTATION

  const pendingRotationResult =
    await readPendingFinoraPortableBranchAuthV2CredentialRotation(
      currentCredential.credentialId,
    );

  if (
    !pendingRotationResult.success ||
    !pendingRotationResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      pendingRotationResult.error ??
        "Unable to inspect unfinished FINORA V2 credential rotation state.",
    );
  }

  const pendingRotation =
    pendingRotationResult.data.transaction;

  if (pendingRotation) {
    if (
      pendingRotation.credentialId !== currentCredential.credentialId ||
      pendingRotation.sourceAuthorizationId !== currentCredential.sourceAuthorizationId ||
      pendingRotation.userId !== currentCredential.userId ||
      pendingRotation.ownerId !== currentCredential.ownerId ||
      pendingRotation.businessId !== currentCredential.businessId ||
      pendingRotation.branchId !== currentCredential.branchId ||
      pendingRotation.canonicalUsername !== currentCredential.canonicalUsername
    ) {
      return failure(
        "TRANSACTION_INVALID",
        "Unfinished FINORA V2 credential rotation does not match the authenticated credential lineage.",
      );
    }

    return resumePortableBranchAuthCredentialRotationV2Internal({
      transaction: pendingRotation,
      portableStore: input.portableStore,
    });
  }
  try {
    currentEnvelope =
      await input.portableStore.read(
        currentCredential.storageMode,
      );
  }
  catch (
    error
  ) {
    return failure(
      "PORTABLE_STORAGE_FAILED",
      getErrorMessage(
        error,
        "Unable to read current Portable Branch Auth state.",
      ),
    );
  }

  if (!currentEnvelope) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISSING",
      "Current Portable Branch Auth state is missing.",
    );
  }

  // ==========================================================
  // 4. CURRENT SECURITY CODE + DECRYPTION
  // ==========================================================

  let currentPayload;

  try {
    /*
     * Prove both current factors independently against the same
     * V2 Portable Auth envelope.
     */
    const passwordPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        currentEnvelope,
        request.currentPassword,
      );

    const securityPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
        currentEnvelope,
        request.currentSecurityCode,
      );

    /*
     * Both V2 wraps must resolve to the exact same authenticated
     * portable payload before lineage correlation is allowed.
     */
    if (
      JSON.stringify(passwordPayload) !==
      JSON.stringify(securityPayload)
    ) {
      return failure(
        "CURRENT_PORTABLE_AUTH_MISMATCH",
        "Current Password and Security Code do not resolve to the same Portable Branch Auth payload.",
      );
    }

    currentPayload =
      passwordPayload;
  }
  catch {
    return failure(
      "CURRENT_PORTABLE_AUTH_AUTHENTICATION_FAILED",
      "Current Password, Security Code or Portable Branch Auth state is invalid.",
    );
  }
  if (
    !currentPortablePayloadMatchesCredential(
      currentPayload,
      currentCredential,
      currentGeneration,
    )
  ) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISMATCH",
      "Current Portable Branch Auth does not match the authenticated credential lineage.",
    );
  }

  // ==========================================================
  // 5. ACTUAL CREDENTIAL FACTOR CHANGE
  //
  // Fresh random salts alone MUST NOT count as a user credential
  // rotation. At least one plaintext factor must actually change.
  // ==========================================================

  const passwordChanged =
    request.newPassword !==
      undefined &&
    request.newPassword !==
      request.currentPassword;

  const securityCodeChanged =
    request.newSecurityCode !==
      undefined &&
    request.newSecurityCode !==
      request.currentSecurityCode;

  if (
    !passwordChanged &&
    !securityCodeChanged
  ) {
    return failure(
      "NO_CREDENTIAL_CHANGE",
      "Credential rotation requires a changed Password or Security Code.",
    );
  }

  const replacementPassword =
    request.newPassword ??
    request.currentPassword;

  const replacementSecurityCode =
    request.newSecurityCode ??
    request.currentSecurityCode;

  // ==========================================================
  // 6. FREEZE SUCCESSOR GENERATION
  // ==========================================================

  if (
    !Number.isSafeInteger(
      currentGeneration,
    ) ||
    currentGeneration >=
      Number.MAX_SAFE_INTEGER
  ) {
    return failure(
      "GENERATION_INVALID",
      "FINORA credential generation cannot be advanced safely.",
    );
  }

  const targetGeneration =
    currentGeneration +
    1;

  const preparedAt =
    new Date().toISOString();

  // ==========================================================
  // 7. FRESH REPLACEMENT CRYPTO MATERIAL
  //
  // authStateId / credentialId / sourceAuthorizationId remain
  // immutable lineage identity.
  //
  // Only salts, verifier evidence, encrypted envelope, generation
  // and updatedAt change.
  // ==========================================================

  let material: {
    envelope:
      typeof currentEnvelope;

    passwordVerifier:
      FinoraPortableBranchAuthVerifierV1;

    securityVerifier:
      FinoraPortableBranchAuthVerifierV1;
  };

  try {
    /*
     * Build the complete successor entirely in memory.
     *
     * Step 1:
     * Current Security Code authorizes Password replacement.
     *
     * Step 2:
     * The successor Password authorizes Security Code replacement.
     *
     * The intermediate envelope is NEVER persisted.
     */
    const passwordRotation =
      await rotateFinoraPortableBranchAuthV2PasswordByRecoveryCode(
        currentEnvelope,
        request.currentSecurityCode,
        replacementPassword,
        {
          authGeneration:
            targetGeneration,

          updatedAt:
            preparedAt,
        },
      );

    const securityRotation =
      await rotateFinoraPortableBranchAuthV2RecoveryCodeByPassword(
        passwordRotation.envelope,
        replacementPassword,
        replacementSecurityCode,
      );

    material = {
      envelope:
        securityRotation.envelope,

      passwordVerifier:
        passwordRotation.passwordVerifier,

      securityVerifier:
        securityRotation.securityVerifier,
    };
  }
  catch (
    error
  ) {
    return failure(
      "MATERIAL_DERIVATION_FAILED",
      getErrorMessage(
        error,
        "Unable to derive replacement Portable Branch Auth V2 material.",
      ),
    );
  }
  const replacementCredential:
    FinoraControlBranchCredential = {
      ...structuredClone(
        currentCredential,
      ),

      authGeneration:
        targetGeneration,

      credentialChangeRequired:
        false,

      verifier:
        toControlCredentialVerifier(
          material.passwordVerifier,
        ),

      securityVerifier:
        toControlCredentialVerifier(
          material.securityVerifier,
        ),

      updatedAt:
        preparedAt,
    };

  const transactionId =
    `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}${randomUUID()}`;

  const preparedTransaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV2 = {
      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,

      transactionId,

      rotationRequestId:
        request.rotationRequestId,

      sourceAuthorizationId:
        currentCredential.sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        structuredClone(
          currentPayload.sourceAuthorizationVerificationEvidence,
        ),

      credentialId:
        currentCredential.credentialId,

      userId:
        currentCredential.userId,

      canonicalUsername:
        currentCredential.canonicalUsername,

      ownerId:
        currentCredential.ownerId,

      businessId:
        currentCredential.businessId,

      branchId:
        currentCredential.branchId,

      storageMode:
        currentCredential.storageMode,

      dataContext:
        currentCredential.dataContext,

      ...(
        currentCredential.demoId ===
          undefined
          ? {}
          : {
              demoId:
                currentCredential.demoId,
            }
      ),

      currentGeneration,

      targetGeneration,

      expectedCredential:
        structuredClone(
          currentCredential,
        ),

      replacementCredential:
        structuredClone(
          replacementCredential,
        ),

      expectedPortableEnvelope:
        structuredClone(
          currentEnvelope,
        ),

      expectedPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256(
          currentEnvelope,
        ),

      replacementPortableEnvelope:
        structuredClone(
          material.envelope,
        ),

      replacementPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256(
          material.envelope,
        ),

      status:
        "PREPARED",

      createdAt:
        preparedAt,

      updatedAt:
        preparedAt,
    };

  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV2(
      preparedTransaction,
    );
  }
  catch (
    error
  ) {
    return failure(
      "TRANSACTION_INVALID",
      getErrorMessage(
        error,
        "Replacement credential rotation transaction is invalid.",
      ),
    );
  }

  // ==========================================================
  // 8. PREPARED Ã¢â‚¬â€ DURABLE CONTROL STORE JOURNAL
  // ==========================================================

  const prepareResult =
    await prepareFinoraPortableBranchAuthV2CredentialRotationTransaction({
      transaction:
        preparedTransaction,
    });

  if (!prepareResult.success) {
    return failure(
      "PREPARE_FAILED",
      prepareResult.error ??
        "Unable to persist the credential rotation transaction.",
    );
  }

  // ==========================================================
  // 9. PORTABLE AUTH CAS
  //
  // Crash after successful CAS but before journal mark is safe:
  // retry sees replacement and returns ALREADY_MATCHED.
  // ==========================================================

  let portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult;

  try {
    portableReplaceResult =
      await input.portableStore.replaceExact(
        currentCredential.storageMode,
        currentEnvelope,
        material.envelope,
      );
  }
  catch (
    error
  ) {
    return failure(
      "PORTABLE_REPLACE_FAILED",
      getErrorMessage(
        error,
        "Unable to replace Portable Branch Auth state.",
      ),
    );
  }

  // ==========================================================
  // 10. PORTABLE_REPLACED
  // ==========================================================

  const portableReplacedResult =
    await markFinoraPortableBranchAuthV2CredentialRotationPortableReplaced({
      transactionId,

      transitionedAt:
        new Date().toISOString(),
    });

  if (!portableReplacedResult.success) {
    return failure(
      "PORTABLE_REPLACED_STATE_FAILED",
      portableReplacedResult.error ??
        "Unable to persist Portable Branch Auth replacement state.",
    );
  }

  // ==========================================================
  // 11. CONTROL_APPLIED
  //
  // B4.4 guarantees replacementCredential + journal transition
  // are persisted in one encrypted Control Store commit.
  //
  // No Device Trust, storage entitlement or enrollment authority
  // mutation occurs here.
  // ==========================================================

  const controlAppliedResult =
    await applyFinoraPortableBranchAuthV2CredentialRotationControlState({
      transactionId,

      transitionedAt:
        new Date().toISOString(),
    });

  if (!controlAppliedResult.success) {
    return failure(
      "CONTROL_APPLY_FAILED",
      controlAppliedResult.error ??
        "Unable to apply replacement FINORA credential state.",
    );
  }

  // ==========================================================
  // 12. COMPLETE
  // ==========================================================

  const completeResult =
    await completeFinoraPortableBranchAuthV2CredentialRotationTransaction({
      transactionId,

      transitionedAt:
        new Date().toISOString(),
    });

  if (!completeResult.success) {
    return failure(
      "COMPLETE_FAILED",
      completeResult.error ??
        "Unable to complete the FINORA credential rotation transaction.",
    );
  }

  return success(
    transactionId,
    replacementCredential,
    targetGeneration,
    portableReplaceResult,
  );
}

function isValidSecurityCodeRecoveryRequest(
  request:
    FinoraPortableBranchAuthSecurityCodeRecoveryRequestV2,
): boolean {
  return (
    typeof request ===
      "object" &&
    request !==
      null &&
    typeof request.rotationRequestId ===
      "string" &&
    request.rotationRequestId.length >
      0 &&
    request.rotationRequestId.trim() ===
      request.rotationRequestId &&
    typeof request.username ===
      "string" &&
    request.username.length >
      0 &&
    typeof request.currentPassword ===
      "string" &&
    request.currentPassword.length >
      0 &&
    typeof request.newSecurityCode ===
      "string" &&
    request.newSecurityCode.length >
      0
  );
}

async function recoverPortableBranchAuthSecurityCodeV2Internal(
  input:
    FinoraPortableBranchAuthSecurityCodeRecoveryCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  if (
    !input ||
    typeof input !==
      "object" ||
    !input.request ||
    !input.portableStore ||
    !isValidSecurityCodeRecoveryRequest(
      input.request,
    )
  ) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA Security Code recovery request is required.",
    );
  }

  const request =
    input.request;

  // ==========================================================
  // 1. DURABLE V2 RECOVERY BEFORE CREDENTIAL AUTHENTICATION
  //
  // A previous rotation may have crashed after CONTROL_APPLIED.
  // In that state the old Password verifier is no longer
  // authoritative, so retry MUST reconcile the durable frozen
  // transaction before attempting current-Password auth.
  //
  // Recovery accepts no Password or Security Code and derives
  // no fresh cryptographic material.
  // ==========================================================

  const preAuthRecovery =
    await recoverFinoraPortableBranchAuthCredentialRotationsV2({
      portableStore:
        input.portableStore,
    });

  if (!preAuthRecovery.success) {
    return failure(
      "CONTROL_STORE_FAILED",
      preAuthRecovery.error,
    );
  }

  // ==========================================================
  // 1A. EXACT REQUEST-ID IDEMPOTENT RETRY
  //
  // Recovery itself grants no authentication authority.
  //
  // Only a transaction that:
  // - was recovered by THIS pre-auth recovery operation,
  // - is now durably COMPLETE, and
  // - carries the exact caller-supplied rotationRequestId
  //
  // may be returned as the already-completed logical request.
  //
  // A completed historical transaction that was not recovered
  // during this invocation is deliberately NOT sufficient.
  // ==========================================================

  if (
    preAuthRecovery.data.recoveredCount >
      0
  ) {
    const recoveredTransactionIds =
      new Set(
        preAuthRecovery.data.recoveredTransactions.map(
          (item) =>
            item.transactionId,
        ),
      );

    const recoveredStoreResult =
      await readFinoraControlStore();

    if (
      !recoveredStoreResult.success ||
      !recoveredStoreResult.data
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        recoveredStoreResult.error ??
          "Unable to read Control Store after V2 credential rotation recovery.",
      );
    }

    const exactRecoveredRequest =
      (
        recoveredStoreResult.data
          .portableBranchAuthV2CredentialRotationTransactions ??
        []
      ).filter(
        (transaction) =>
          recoveredTransactionIds.has(
            transaction.transactionId,
          ) &&
          transaction.status ===
            "COMPLETE" &&
          transaction.rotationRequestId ===
            request.rotationRequestId,
      );

    if (
      exactRecoveredRequest.length >
        1
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        "Multiple recovered V2 credential rotations share the same rotationRequestId.",
      );
    }

    if (
      exactRecoveredRequest.length ===
        1
    ) {
      const recoveredTransaction =
        exactRecoveredRequest[0];

      return success(
        recoveredTransaction.transactionId,
        structuredClone(
          recoveredTransaction.replacementCredential,
        ),
        recoveredTransaction.targetGeneration,
        "ALREADY_MATCHED",
      );
    }
  }

  // ==========================================================
  // 2. PASSWORD-FIRST AUTHORITY
  //
  // SECURITY:
  // No Portable Auth read and no Security Code verification occurs
  // before current Password authentication succeeds.
  // ==========================================================

  const authentication =
    await authenticateFinoraBranchCredential({
      username:
        request.username,

      password:
        request.currentPassword,
    });

  if (!authentication.success) {
    if (
      authentication.errorCode ===
        "INVALID_CREDENTIALS"
    ) {
      return failure(
        "INVALID_CREDENTIALS",
        authentication.error,
      );
    }

    if (
      authentication.errorCode ===
        "CONTROL_STORE_FAILED"
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        authentication.error,
      );
    }

    return failure(
      "AUTHENTICATION_FAILED",
      authentication.error,
    );
  }

  const principal =
    authentication.data;

  // ==========================================================
  // 2. AUTHORITATIVE CURRENT CREDENTIAL
  // ==========================================================

  const controlStoreResult =
    await readFinoraControlStore();

  if (
    !controlStoreResult.success ||
    !controlStoreResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      controlStoreResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const matchingCredentials =
    (
      controlStoreResult.data.branchCredentials ??
      []
    ).filter(
      (credential) =>
        credential.credentialId ===
          principal.credentialId &&
        credential.status ===
          "ACTIVE",
    );

  if (
    matchingCredentials.length !==
      1
  ) {
    return failure(
      "CURRENT_CREDENTIAL_INVALID",
      "The authenticated FINORA credential is not uniquely authoritative.",
    );
  }

  const currentCredential =
    matchingCredentials[0];

  const currentGeneration =
    currentCredential.authGeneration ??
    FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION;

  if (
    !Number.isSafeInteger(
      currentGeneration,
    ) ||
    currentGeneration <
      FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION ||
    !credentialMatchesAuthenticatedPrincipal(
      currentCredential,
      principal,
      currentGeneration,
    )
  ) {
    return failure(
      "CURRENT_CREDENTIAL_INVALID",
      "The authenticated FINORA credential state is inconsistent.",
    );
  }

  // ==========================================================
  // 3. CURRENT PORTABLE AUTH
  //
  // This point is intentionally after successful Password auth.
  // ==========================================================

  let currentEnvelope;

  // AUTO-RESUME EXISTING V2 ROTATION

  const pendingRotationResult =
    await readPendingFinoraPortableBranchAuthV2CredentialRotation(
      currentCredential.credentialId,
    );

  if (
    !pendingRotationResult.success ||
    !pendingRotationResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      pendingRotationResult.error ??
        "Unable to inspect unfinished FINORA V2 credential rotation state.",
    );
  }

  const pendingRotation =
    pendingRotationResult.data.transaction;

  if (pendingRotation) {
    if (
      pendingRotation.credentialId !== currentCredential.credentialId ||
      pendingRotation.sourceAuthorizationId !== currentCredential.sourceAuthorizationId ||
      pendingRotation.userId !== currentCredential.userId ||
      pendingRotation.ownerId !== currentCredential.ownerId ||
      pendingRotation.businessId !== currentCredential.businessId ||
      pendingRotation.branchId !== currentCredential.branchId ||
      pendingRotation.canonicalUsername !== currentCredential.canonicalUsername
    ) {
      return failure(
        "TRANSACTION_INVALID",
        "Unfinished FINORA V2 credential rotation does not match the authenticated credential lineage.",
      );
    }

    return resumePortableBranchAuthCredentialRotationV2Internal({
      transaction: pendingRotation,
      portableStore: input.portableStore,
    });
  }
  try {
    currentEnvelope =
      await input.portableStore.read(
        currentCredential.storageMode,
      );
  }
  catch (
    error
  ) {
    return failure(
      "PORTABLE_STORAGE_FAILED",
      getErrorMessage(
        error,
        "Unable to read current Portable Branch Auth state.",
      ),
    );
  }

  if (!currentEnvelope) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISSING",
      "Current Portable Branch Auth state is missing.",
    );
  }

  // ==========================================================
  // 4. PASSWORD-AUTHORIZED SECURITY-CODE RECOVERY
  //
  // FINORA_P1_578KV_PASSWORD_AUTHORIZED_SECURITY_CODE_RECOVERY
  //
  // The historical Security Code is the damaged factor.
  // It is NOT used as recovery authority.
  //
  // Current Password must decrypt the exact persisted V2 envelope.
  // The existing exact Control/Portable lineage gate immediately
  // below remains mandatory before successor derivation.
  // ==========================================================

  let currentPayload;

  try {
    currentPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        currentEnvelope,
        request.currentPassword,
      );
  }
  catch {
    return failure(
      "CURRENT_PORTABLE_AUTH_AUTHENTICATION_FAILED",
      "Current Password or Portable Branch Auth state is invalid.",
    );
  }

    if (
    !currentPortablePayloadMatchesCredential(
      currentPayload,
      currentCredential,
      currentGeneration,
    )
  ) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISMATCH",
      "Current Portable Branch Auth does not match the authenticated credential lineage.",
    );
  }

  // ==========================================================
  // 5. SECURITY-CODE RECOVERY FACTOR CHANGE
  //
  // A fresh Security Code verifier/wrap is created.
  // Current Password + exact current lineage are the authority.
  // ==========================================================

  // 6. FREEZE SUCCESSOR GENERATION
  // ==========================================================

  if (
    !Number.isSafeInteger(
      currentGeneration,
    ) ||
    currentGeneration >=
      Number.MAX_SAFE_INTEGER
  ) {
    return failure(
      "GENERATION_INVALID",
      "FINORA credential generation cannot be advanced safely.",
    );
  }

  const targetGeneration =
    currentGeneration +
    1;

  const preparedAt =
    new Date().toISOString();

  // ==========================================================
  // 7. FRESH REPLACEMENT CRYPTO MATERIAL
  //
  // authStateId / credentialId / sourceAuthorizationId remain
  // immutable lineage identity.
  //
  // Only salts, verifier evidence, encrypted envelope, generation
  // and updatedAt change.
  // ==========================================================

  let material: {
    envelope:
      typeof currentEnvelope;

    passwordVerifier:
      FinoraPortableBranchAuthVerifierV1;

    securityVerifier:
      FinoraPortableBranchAuthVerifierV1;
  };

  try {
    const securityRotation =
      await rotateFinoraPortableBranchAuthV2RecoveryCodeByPassword(
        currentEnvelope,
        request.currentPassword,
        request.newSecurityCode,
        {
          authGeneration:
            targetGeneration,

          updatedAt:
            preparedAt,
        },
      );

    const successorPasswordPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        securityRotation.envelope,
        request.currentPassword,
      );

    const successorSecurityPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
        securityRotation.envelope,
        request.newSecurityCode,
      );

    if (
      JSON.stringify(
        successorPasswordPayload,
      ) !==
      JSON.stringify(
        successorSecurityPayload,
      )
    ) {
      return failure(
        "CURRENT_PORTABLE_AUTH_MISMATCH",
        "Recovered Password and Security Code do not resolve to the same successor Portable Branch Auth payload.",
      );
    }

    if (
      successorPasswordPayload.authGeneration !==
        targetGeneration ||
      successorPasswordPayload.updatedAt !==
        preparedAt
    ) {
      return failure(
        "CURRENT_PORTABLE_AUTH_MISMATCH",
        "Recovered Portable Branch Auth successor generation is invalid.",
      );
    }

    material = {
      envelope:
        securityRotation.envelope,

      passwordVerifier:
        successorPasswordPayload.passwordVerifier,

      securityVerifier:
        securityRotation.securityVerifier,
    };
  }
  catch (
    error
  ) {
    return failure(
      "MATERIAL_DERIVATION_FAILED",
      getErrorMessage(
        error,
        "Unable to derive recovered Security Code Portable Branch Auth V2 material.",
      ),
    );
  }

  const replacementCredential:
    FinoraControlBranchCredential = {
      ...structuredClone(
        currentCredential,
      ),

      authGeneration:
        targetGeneration,

      credentialChangeRequired:
        false,

      verifier:
        toControlCredentialVerifier(
          material.passwordVerifier,
        ),

      securityVerifier:
        toControlCredentialVerifier(
          material.securityVerifier,
        ),

      updatedAt:
        preparedAt,
    };

  const transactionId =
    `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}${randomUUID()}`;

  const preparedTransaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV2 = {
      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,

      transactionId,

      rotationRequestId:
        request.rotationRequestId,

      sourceAuthorizationId:
        currentCredential.sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        structuredClone(
          currentPayload.sourceAuthorizationVerificationEvidence,
        ),

      credentialId:
        currentCredential.credentialId,

      userId:
        currentCredential.userId,

      canonicalUsername:
        currentCredential.canonicalUsername,

      ownerId:
        currentCredential.ownerId,

      businessId:
        currentCredential.businessId,

      branchId:
        currentCredential.branchId,

      storageMode:
        currentCredential.storageMode,

      dataContext:
        currentCredential.dataContext,

      ...(
        currentCredential.demoId ===
          undefined
          ? {}
          : {
              demoId:
                currentCredential.demoId,
            }
      ),

      currentGeneration,

      targetGeneration,

      expectedCredential:
        structuredClone(
          currentCredential,
        ),

      replacementCredential:
        structuredClone(
          replacementCredential,
        ),

      expectedPortableEnvelope:
        structuredClone(
          currentEnvelope,
        ),

      expectedPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256(
          currentEnvelope,
        ),

      replacementPortableEnvelope:
        structuredClone(
          material.envelope,
        ),

      replacementPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256(
          material.envelope,
        ),

      status:
        "PREPARED",

      createdAt:
        preparedAt,

      updatedAt:
        preparedAt,
    };

  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV2(
      preparedTransaction,
    );
  }
  catch (
    error
  ) {
    return failure(
      "TRANSACTION_INVALID",
      getErrorMessage(
        error,
        "Replacement credential rotation transaction is invalid.",
      ),
    );
  }

  // ==========================================================
  // 8. PREPARED Ã¢â‚¬â€ DURABLE CONTROL STORE JOURNAL
  // ==========================================================

  const prepareResult =
    await prepareFinoraPortableBranchAuthV2CredentialRotationTransaction({
      transaction:
        preparedTransaction,
    });

  if (!prepareResult.success) {
    return failure(
      "PREPARE_FAILED",
      prepareResult.error ??
        "Unable to persist the credential rotation transaction.",
    );
  }

  // ==========================================================
  // 9. PORTABLE AUTH CAS
  //
  // Crash after successful CAS but before journal mark is safe:
  // retry sees replacement and returns ALREADY_MATCHED.
  // ==========================================================

  let portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult;

  try {
    portableReplaceResult =
      await input.portableStore.replaceExact(
        currentCredential.storageMode,
        currentEnvelope,
        material.envelope,
      );
  }
  catch (
    error
  ) {
    return failure(
      "PORTABLE_REPLACE_FAILED",
      getErrorMessage(
        error,
        "Unable to replace Portable Branch Auth state.",
      ),
    );
  }

  // ==========================================================
  // 10. PORTABLE_REPLACED
  // ==========================================================

  const portableReplacedResult =
    await markFinoraPortableBranchAuthV2CredentialRotationPortableReplaced({
      transactionId,

      transitionedAt:
        new Date().toISOString(),
    });

  if (!portableReplacedResult.success) {
    return failure(
      "PORTABLE_REPLACED_STATE_FAILED",
      portableReplacedResult.error ??
        "Unable to persist Portable Branch Auth replacement state.",
    );
  }

  // ==========================================================
  // 11. CONTROL_APPLIED
  //
  // B4.4 guarantees replacementCredential + journal transition
  // are persisted in one encrypted Control Store commit.
  //
  // No Device Trust, storage entitlement or enrollment authority
  // mutation occurs here.
  // ==========================================================

  const controlAppliedResult =
    await applyFinoraPortableBranchAuthV2CredentialRotationControlState({
      transactionId,

      transitionedAt:
        new Date().toISOString(),
    });

  if (!controlAppliedResult.success) {
    return failure(
      "CONTROL_APPLY_FAILED",
      controlAppliedResult.error ??
        "Unable to apply replacement FINORA credential state.",
    );
  }

  // ==========================================================
  // 12. COMPLETE
  // ==========================================================

  const completeResult =
    await completeFinoraPortableBranchAuthV2CredentialRotationTransaction({
      transactionId,

      transitionedAt:
        new Date().toISOString(),
    });

  if (!completeResult.success) {
    return failure(
      "COMPLETE_FAILED",
      completeResult.error ??
        "Unable to complete the FINORA credential rotation transaction.",
    );
  }

  return success(
    transactionId,
    replacementCredential,
    targetGeneration,
    portableReplaceResult,
  );
}

/*
 * FINORA_P1_578OB_CONTROL_AUTHENTICATED_RECONVERGENCE
 *
 * Repair-only authority for a dual-wrap-diverged Portable Auth V2 state.
 *
 * The authenticated Control credential is authoritative.
 * The unreadable predecessor Portable Auth envelope is CAS state only.
 * It grants no Password/Security-Code authority and is never decrypted here.
 */
async function reconvergePortableBranchAuthSecurityCodeV2Internal(
  input:
    FinoraPortableBranchAuthSecurityCodeReconvergenceCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  if (
    !input ||
    typeof input !== "object" ||
    !input.request ||
    !input.portableStore ||
    !isValidSecurityCodeRecoveryRequest(
      input.request,
    )
  ) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA Portable Auth reconvergence request is required.",
    );
  }

  const request =
    input.request;

  /*
   * First finish any already-durable transaction.
   * This derives no fresh factor material and grants no authentication.
   */
  const preAuthRecovery =
    await recoverFinoraPortableBranchAuthCredentialRotationsV2({
      portableStore:
        input.portableStore,
    });

  if (!preAuthRecovery.success) {
    return failure(
      "CONTROL_STORE_FAILED",
      preAuthRecovery.error,
    );
  }

  /*
   * Preserve exact-request idempotence after crash recovery.
   */
  if (
    preAuthRecovery.data.recoveredCount >
      0
  ) {
    const recoveredTransactionIds =
      new Set(
        preAuthRecovery.data.recoveredTransactions.map(
          (item) =>
            item.transactionId,
        ),
      );

    const recoveredStoreResult =
      await readFinoraControlStore();

    if (
      !recoveredStoreResult.success ||
      !recoveredStoreResult.data
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        recoveredStoreResult.error ??
          "Unable to read Control Store after reconvergence recovery.",
      );
    }

    const exactRecoveredRequest =
      (
        recoveredStoreResult.data
          .portableBranchAuthV2CredentialRotationTransactions ??
        []
      ).filter(
        (transaction) =>
          recoveredTransactionIds.has(
            transaction.transactionId,
          ) &&
          transaction.status ===
            "COMPLETE" &&
          transaction.rotationRequestId ===
            request.rotationRequestId,
      );

    if (
      exactRecoveredRequest.length >
        1
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        "Multiple recovered V2 mutations share the same rotationRequestId.",
      );
    }

    if (
      exactRecoveredRequest.length ===
        1
    ) {
      const recoveredTransaction =
        exactRecoveredRequest[0];

      return success(
        recoveredTransaction.transactionId,
        structuredClone(
          recoveredTransaction.replacementCredential,
        ),
        recoveredTransaction.targetGeneration,
        "ALREADY_MATCHED",
      );
    }
  }

  /*
   * 1. CONTROL PASSWORD AUTHORITY.
   *
   * No Portable Auth Password/Security-Code verification occurs before this.
   */
  const authentication =
    await authenticateFinoraBranchCredential({
      username:
        request.username,

      password:
        request.currentPassword,
    });

  if (!authentication.success) {
    if (
      authentication.errorCode ===
        "INVALID_CREDENTIALS"
    ) {
      return failure(
        "INVALID_CREDENTIALS",
        authentication.error,
      );
    }

    if (
      authentication.errorCode ===
        "CONTROL_STORE_FAILED"
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        authentication.error,
      );
    }

    return failure(
      "AUTHENTICATION_FAILED",
      authentication.error,
    );
  }

  const principal =
    authentication.data;

  /*
   * 2. Resolve the exact ACTIVE Control credential.
   */
  const controlStoreResult =
    await readFinoraControlStore();

  if (
    !controlStoreResult.success ||
    !controlStoreResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      controlStoreResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore =
    controlStoreResult.data;

  const matchingCredentials =
    (
      controlStore.branchCredentials ??
      []
    ).filter(
      (credential) =>
        credential.credentialId ===
          principal.credentialId &&
        credential.status ===
          "ACTIVE",
    );

  if (
    matchingCredentials.length !==
      1
  ) {
    return failure(
      "CURRENT_CREDENTIAL_INVALID",
      "The authenticated FINORA credential is not uniquely authoritative.",
    );
  }

  const currentCredential =
    matchingCredentials[0];

  const currentGeneration =
    currentCredential.authGeneration ??
    FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION;

  if (
    !Number.isSafeInteger(
      currentGeneration,
    ) ||
    currentGeneration <
      FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION ||
    !credentialMatchesAuthenticatedPrincipal(
      currentCredential,
      principal,
      currentGeneration,
    )
  ) {
    return failure(
      "CURRENT_CREDENTIAL_INVALID",
      "The authenticated FINORA credential state is inconsistent.",
    );
  }

  /*
   * 3. Never create a competing successor while an existing mutation
   * transaction is unfinished.
   */
  const pendingRotationResult =
    await readPendingFinoraPortableBranchAuthV2CredentialRotation(
      currentCredential.credentialId,
    );

  if (
    !pendingRotationResult.success ||
    !pendingRotationResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      pendingRotationResult.error ??
        "Unable to inspect unfinished FINORA V2 credential mutation state.",
    );
  }

  const pendingRotation =
    pendingRotationResult.data.transaction;

  if (pendingRotation) {
    if (
      pendingRotation.credentialId !==
        currentCredential.credentialId ||
      pendingRotation.sourceAuthorizationId !==
        currentCredential.sourceAuthorizationId ||
      pendingRotation.userId !==
        currentCredential.userId ||
      pendingRotation.ownerId !==
        currentCredential.ownerId ||
      pendingRotation.businessId !==
        currentCredential.businessId ||
      pendingRotation.branchId !==
        currentCredential.branchId ||
      pendingRotation.canonicalUsername !==
        currentCredential.canonicalUsername
    ) {
      return failure(
        "TRANSACTION_INVALID",
        "Unfinished FINORA V2 mutation does not match the authenticated credential lineage.",
      );
    }

    return resumePortableBranchAuthCredentialRotationV2Internal({
      transaction:
        pendingRotation,

      portableStore:
        input.portableStore,
    });
  }

  /*
   * 4. Read exact predecessor envelope.
   *
   * DO NOT decrypt it. It is damaged/untrusted authentication state.
   * It exists only as replaceExact CAS predecessor evidence.
   */
  let currentEnvelope;

  try {
    currentEnvelope =
      await input.portableStore.read(
        currentCredential.storageMode,
      );
  }
  catch (
    error
  ) {
    return failure(
      "PORTABLE_STORAGE_FAILED",
      getErrorMessage(
        error,
        "Unable to read current Portable Branch Auth state.",
      ),
    );
  }

  if (!currentEnvelope) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISSING",
      "Current Portable Branch Auth state is missing.",
    );
  }

  /*
   * 7. Freeze successor generation.
   */
  if (
    !Number.isSafeInteger(
      currentGeneration,
    ) ||
    currentGeneration >=
      Number.MAX_SAFE_INTEGER
  ) {
    return failure(
      "GENERATION_INVALID",
      "FINORA credential generation cannot be advanced safely.",
    );
  }

  const targetGeneration =
    currentGeneration +
    1;

  const preparedAt =
    new Date().toISOString();

  /*
   * FINORA_P1_578WY_NATIVE_RECONVERGENCE
   *
   * 5. Resolve retained authorization provenance.
   * Exact 1+1 signed provenance remains preferred.
   * Exact 0+0 requires trusted native binding plus exact ACTIVE
   * Storage Entitlement. Partial/duplicate provenance fails closed.
   */
  const verificationEvidence =
    (
      controlStore
        .branchCredentialAuthorizationVerificationEvidence ??
      []
    ).filter(
      (item) =>
        item.authorizationId ===
          currentCredential.sourceAuthorizationId,
    );

  const portabilityAuthorities =
    (
      controlStore
        .branchCredentialPortabilityAuthorities ??
      []
    ).filter(
      (item) =>
        item.sourceAuthorizationId ===
          currentCredential.sourceAuthorizationId,
    );

  let portableVerificationEvidence:
    FinoraPortableBranchAuthSourceAuthorizationVerificationEvidenceV1;

  if (
    verificationEvidence.length ===
      1 &&
    portabilityAuthorities.length ===
      1
  ) {
    const retainedEvidence =
      verificationEvidence[0];

    const retainedSigner =
      retainedEvidence.verifiedControlSigner;

    if (
      retainedSigner.status ===
        "REVOKED"
    ) {
      return failure(
        "CURRENT_PORTABLE_AUTH_MISMATCH",
        "Revoked Control signer provenance cannot authorize Portable Auth reconvergence.",
      );
    }

    portableVerificationEvidence = {
      authorizationId:
        retainedEvidence.authorizationId,

      packageId:
        retainedEvidence.packageId,

      issuerId:
        retainedEvidence.issuerId,

      sequence:
        retainedEvidence.sequence,

      verifiedControlSigner: {
        issuerId:
          retainedSigner.issuerId,

        signingKeyId:
          retainedSigner.signingKeyId,

        algorithm:
          retainedSigner.algorithm,

        format:
          retainedSigner.format,

        publicKey:
          retainedSigner.publicKey,

        status:
          retainedSigner.status,

        validFrom:
          retainedSigner.validFrom,

        ...(
          retainedSigner.validUntil ===
            undefined
            ? {}
            : {
                validUntil:
                  retainedSigner.validUntil,
              }
        ),
      },

      portabilityAuthorityProof:
        structuredClone(
          portabilityAuthorities[0],
        ),

      verifiedAt:
        retainedEvidence.verifiedAt,

      schemaVersion:
        1,
    };
  }
  else if (
    verificationEvidence.length ===
      0 &&
    portabilityAuthorities.length ===
      0
  ) {
    let nativeBinding;

    try {
      nativeBinding =
        await getFinoraWindowsInstallationBinding();
    }
    catch {
      return failure(
        "CURRENT_PORTABLE_AUTH_MISMATCH",
        "FINORA native device binding could not be verified.",
      );
    }

    if (!nativeBinding) {
      return failure(
        "CURRENT_PORTABLE_AUTH_MISMATCH",
        "FINORA native device binding is unavailable.",
      );
    }

    const entitlementResult =
      await hasActiveFinoraStorageEntitlement(
        currentCredential.userId,
        currentCredential.ownerId,
        currentCredential.businessId,
        currentCredential.branchId,
        currentCredential.storageMode,
        nativeBinding,
      );

    if (!entitlementResult.success) {
      return failure(
        "CONTROL_STORE_FAILED",
        entitlementResult.error ??
          "Unable to verify FINORA storage authority.",
      );
    }

    if (!entitlementResult.data) {
      return failure(
        "CURRENT_PORTABLE_AUTH_MISMATCH",
        "Reconvergence requires the exact ACTIVE native-bound storage entitlement.",
      );
    }

    portableVerificationEvidence = {
      authorizationId:
        currentCredential.sourceAuthorizationId,

      legacyNativeBoundMigrationEvidence: {
        schemaVersion:
          1,

        migrationMethod:
          "PASSWORD_AND_ACTIVE_NATIVE_STORAGE_ENTITLEMENT",

        sourceAuthorizationId:
          currentCredential.sourceAuthorizationId,

        ownerId:
          currentCredential.ownerId,

        businessId:
          currentCredential.businessId,

        branchId:
          currentCredential.branchId,

        userId:
          currentCredential.userId,

        username:
          currentCredential.username,

        storageMode:
          currentCredential.storageMode,

        authGeneration:
          targetGeneration,

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          nativeBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,

        migratedAt:
          preparedAt,
      },

      schemaVersion:
        1,
    };
  }
  else {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISMATCH",
      "Exact retained FINORA authorization provenance is incomplete or ambiguous.",
    );
  }

  if (
    portableVerificationEvidence.authorizationId !==
      currentCredential.sourceAuthorizationId
  ) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISMATCH",
      "Authorization provenance does not match the authenticated credential lineage.",
    );
  }

  /*
   * 6. Resolve existing exact branch-certification material.
   *
   * Never generate a new certification key during reconvergence.
   */
  let branchCertificationKeyMaterial;

  try {
    branchCertificationKeyMaterial =
      await readFinoraWalletBranchCertificationDeviceVault(
        currentCredential.ownerId,
        currentCredential.businessId,
        currentCredential.branchId,
        currentGeneration,
      );

    /*
     * Older/non-portable certification records may not carry generation.
     * The vault's no-generation read still validates exact branch scope.
     */
    if (!branchCertificationKeyMaterial) {
      branchCertificationKeyMaterial =
        await readFinoraWalletBranchCertificationDeviceVault(
          currentCredential.ownerId,
          currentCredential.businessId,
          currentCredential.branchId,
        );
    }
  }
  catch (
    error
  ) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISMATCH",
      getErrorMessage(
        error,
        "Unable to verify exact FINORA Branch Certification material.",
      ),
    );
  }

  if (!branchCertificationKeyMaterial) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISMATCH",
      "Exact FINORA Branch Certification material is unavailable.",
    );
  }

  /*
   * 8. Fresh dual-wrap successor.
   *
   * The predecessor authStateId is unreadable. We therefore create an
   * explicit NEW LOCAL AUTH STATE while preserving credentialId,
   * sourceAuthorizationId and exact branch lineage.
   *
   * walletProofKeyMaterial is intentionally not guessed/copied.
   */
  let material:
    Awaited<
      ReturnType<
        typeof createFinoraPortableBranchAuthEnrollmentMaterialV2
      >
    >;

  try {
    material =
      await createFinoraPortableBranchAuthEnrollmentMaterialV2({
        payload: {
          schemaVersion:
            FINORA_PORTABLE_BRANCH_AUTH_PAYLOAD_SCHEMA_VERSION,

          authStateId:
            `FINORA-PORTABLE-AUTH-STATE-${randomUUID()}`,

          sourceAuthorizationId:
            currentCredential.sourceAuthorizationId,

          sourceAuthorizationVerificationEvidence:
            portableVerificationEvidence,

          branchCertificationKeyMaterial:
            structuredClone(
              branchCertificationKeyMaterial,
            ),

          ownerId:
            currentCredential.ownerId,

          businessId:
            currentCredential.businessId,

          branchId:
            currentCredential.branchId,

          userId:
            currentCredential.userId,

          username:
            currentCredential.username,

          canonicalUsername:
            currentCredential.canonicalUsername,

          fullName:
            currentCredential.fullName,

          role:
            currentCredential.role,

          dataContext:
            currentCredential.dataContext,

          ...(
            currentCredential.demoId ===
              undefined
              ? {}
              : {
                  demoId:
                    currentCredential.demoId,
                }
          ),

          storageMode:
            currentCredential.storageMode,

          authGeneration:
            targetGeneration,

          // FINORA_P1_578XR_PRESERVE_CREDENTIAL_CREATED_AT
          // createdAt is immutable credential lineage. A reconvergence
          // advances generation/updatedAt but must not invent a new
          // credential creation timestamp.
          createdAt:
            currentCredential.createdAt,

          updatedAt:
            preparedAt,
        },

        password:
          request.currentPassword,

        securityCode:
          request.newSecurityCode,
      });

    /*
     * Independently prove BOTH newly generated wraps resolve to exactly
     * the same successor payload.
     */
    const successorPasswordPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        material.envelope,
        request.currentPassword,
      );

    const successorSecurityPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
        material.envelope,
        request.newSecurityCode,
      );

    if (
      JSON.stringify(
        successorPasswordPayload,
      ) !==
      JSON.stringify(
        successorSecurityPayload,
      )
    ) {
      return failure(
        "CURRENT_PORTABLE_AUTH_MISMATCH",
        "Reconverged Password and Security Code do not resolve to the same successor Portable Branch Auth payload.",
      );
    }

    if (
      successorPasswordPayload.authGeneration !==
        targetGeneration ||
      successorPasswordPayload.updatedAt !==
        preparedAt ||
      successorPasswordPayload.sourceAuthorizationId !==
        currentCredential.sourceAuthorizationId ||
      successorPasswordPayload.ownerId !==
        currentCredential.ownerId ||
      successorPasswordPayload.businessId !==
        currentCredential.businessId ||
      successorPasswordPayload.branchId !==
        currentCredential.branchId ||
      successorPasswordPayload.userId !==
        currentCredential.userId ||
      successorPasswordPayload.canonicalUsername !==
        currentCredential.canonicalUsername ||
      successorPasswordPayload.storageMode !==
        currentCredential.storageMode ||
      successorPasswordPayload
        .sourceAuthorizationVerificationEvidence
        .authorizationId !==
        currentCredential.sourceAuthorizationId
    ) {
      return failure(
        "CURRENT_PORTABLE_AUTH_MISMATCH",
        "Fresh Portable Branch Auth reconvergence payload failed exact lineage validation.",
      );
    }
  }
  catch (
    error
  ) {
    return failure(
      "MATERIAL_DERIVATION_FAILED",
      getErrorMessage(
        error,
        "Unable to derive fresh FINORA Portable Branch Auth reconvergence material.",
      ),
    );
  }

  /*
   * 9. Control credential and Portable envelope advance together.
   */
  const replacementCredential:
    FinoraControlBranchCredential = {
      ...structuredClone(
        currentCredential,
      ),

      authGeneration:
        targetGeneration,

      credentialChangeRequired:
        false,

      verifier:
        toControlCredentialVerifier(
          material.passwordVerifier,
        ),

      securityVerifier:
        toControlCredentialVerifier(
          material.securityVerifier,
        ),

      updatedAt:
        preparedAt,
    };

  const transactionId =
    `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}${randomUUID()}`;

  const preparedTransaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV2 = {
      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,

      transactionId,

      rotationRequestId:
        request.rotationRequestId,

      sourceAuthorizationId:
        currentCredential.sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        structuredClone(
          portableVerificationEvidence,
        ),

      // FINORA_P1_578XG_DURABLE_NATIVE_AUTHORITY
      credentialMutationAuthority:
        "CONTROL_AUTHENTICATED_NATIVE_RECONVERGENCE",

      credentialId:
        currentCredential.credentialId,

      userId:
        currentCredential.userId,

      canonicalUsername:
        currentCredential.canonicalUsername,

      ownerId:
        currentCredential.ownerId,

      businessId:
        currentCredential.businessId,

      branchId:
        currentCredential.branchId,

      storageMode:
        currentCredential.storageMode,

      dataContext:
        currentCredential.dataContext,

      ...(
        currentCredential.demoId ===
          undefined
          ? {}
          : {
              demoId:
                currentCredential.demoId,
            }
      ),

      currentGeneration,

      targetGeneration,

      expectedCredential:
        structuredClone(
          currentCredential,
        ),

      replacementCredential:
        structuredClone(
          replacementCredential,
        ),

      expectedPortableEnvelope:
        structuredClone(
          currentEnvelope,
        ),

      expectedPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256(
          currentEnvelope,
        ),

      replacementPortableEnvelope:
        structuredClone(
          material.envelope,
        ),

      replacementPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256(
          material.envelope,
        ),

      status:
        "PREPARED",

      createdAt:
        preparedAt,

      updatedAt:
        preparedAt,
    };

  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV2(
      preparedTransaction,
    );
  }
  catch (
    error
  ) {
    return failure(
      "TRANSACTION_INVALID",
      getErrorMessage(
        error,
        "Reconvergence credential mutation transaction is invalid.",
      ),
    );
  }

  /*
   * 10. Durable PREPARED first, then reuse the existing tested
   * PREPARED -> replaceExact -> PORTABLE_REPLACED ->
   * CONTROL_APPLIED -> COMPLETE state machine.
   */
  const prepareResult =
    await prepareFinoraPortableBranchAuthV2CredentialRotationTransaction({
      transaction:
        preparedTransaction,
    });

  if (!prepareResult.success) {
    return failure(
      "PREPARE_FAILED",
      prepareResult.error ??
        "Unable to prepare FINORA Portable Auth reconvergence transaction.",
    );
  }

  return resumePortableBranchAuthCredentialRotationV2Internal({
    transaction:
      preparedTransaction,

    portableStore:
      input.portableStore,
  });
}



async function resumePortableBranchAuthCredentialRotationV2Internal(
  input:
    FinoraPortableBranchAuthCredentialRotationResumeV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  if (
    !input ||
    typeof input !== "object" ||
    !input.transaction ||
    !input.portableStore
  ) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA V2 credential rotation recovery request is required.",
    );
  }

  const transaction =
    structuredClone(
      input.transaction,
    );

  try {
    validateFinoraPortableBranchAuthCredentialRotationTransactionV2(
      transaction,
    );
  }
  catch (
    error
  ) {
    return failure(
      "TRANSACTION_INVALID",
      getErrorMessage(
        error,
        "Credential rotation recovery transaction is invalid.",
      ),
    );
  }

  let portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult =
      "ALREADY_MATCHED";

  /*
   * PREPARED means the Portable Auth CAS may not have happened,
   * OR it may have succeeded immediately before a process crash.
   *
   * replaceExact handles both safely:
   * expected predecessor -> REPLACED
   * exact frozen successor -> ALREADY_MATCHED
   */
  if (
    transaction.status ===
      "PREPARED"
  ) {
    try {
      portableReplaceResult =
        await input.portableStore.replaceExact(
          transaction.storageMode,
          transaction.expectedPortableEnvelope,
          transaction.replacementPortableEnvelope,
        );
    }
    catch (
      error
    ) {
      return failure(
        "PORTABLE_REPLACE_FAILED",
        getErrorMessage(
          error,
          "Unable to recover Portable Branch Auth replacement state.",
        ),
      );
    }

    const portableReplacedResult =
      await markFinoraPortableBranchAuthV2CredentialRotationPortableReplaced({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date().toISOString(),
      });

    if (!portableReplacedResult.success) {
      return failure(
        "PORTABLE_REPLACED_STATE_FAILED",
        portableReplacedResult.error ??
          "Unable to persist recovered Portable Branch Auth replacement state.",
      );
    }

    transaction.status =
      "PORTABLE_REPLACED";
  }

  if (
    transaction.status ===
      "PORTABLE_REPLACED"
  ) {
    const controlAppliedResult =
      await applyFinoraPortableBranchAuthV2CredentialRotationControlState({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date().toISOString(),
      });

    if (!controlAppliedResult.success) {
      return failure(
        "CONTROL_APPLY_FAILED",
        controlAppliedResult.error ??
          "Unable to recover replacement FINORA credential state.",
      );
    }

    transaction.status =
      "CONTROL_APPLIED";
  }

  if (
    transaction.status ===
      "CONTROL_APPLIED"
  ) {
    const completeResult =
      await completeFinoraPortableBranchAuthV2CredentialRotationTransaction({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date().toISOString(),
      });

    if (!completeResult.success) {
      return failure(
        "COMPLETE_FAILED",
        completeResult.error ??
          "Unable to complete recovered FINORA credential rotation.",
      );
    }

    transaction.status =
      "COMPLETE";
  }

  if (
    transaction.status !==
      "COMPLETE"
  ) {
    return failure(
      "TRANSACTION_INVALID",
      "FINORA V2 credential rotation recovery reached an unsupported state.",
    );
  }

  return success(
    transaction.transactionId,
    structuredClone(
      transaction.replacementCredential,
    ),
    transaction.targetGeneration,
    portableReplaceResult,
  );
}

// ============================================================
// PUBLIC SERIALIZED ENTRYPOINT
// ============================================================

/*
 * FINORA_P1_578KA_PASSWORD_AUTHORIZED_SECURITY_CODE_RECOVERY
 *
 * Deliberately separate from normal ROTATE_V2.
 * This contract exists for recovery when the persisted V2 Security Code
 * factor is unusable but the current Password still proves owner authority.
 *
 * IMPORTANT:
 * The implementation must authenticate the current Password first,
 * decrypt the current V2 envelope with that Password, correlate the exact
 * payload with the authoritative Control credential, derive a replacement
 * Security Code using rotateFinoraPortableBranchAuthV2RecoveryCodeByPassword,
 * and commit only through the existing durable rotation journal + replaceExact
 * CAS + atomic Control apply path.
 *
 * This declaration alone grants no bypass and performs no mutation.
 */
export interface FinoraPortableBranchAuthSecurityCodeRecoveryRequestV2 {
  rotationRequestId: string;
  username: string;
  currentPassword: string;
  newSecurityCode: string;
}

export interface FinoraPortableBranchAuthSecurityCodeRecoveryCoordinatorV2Input {
  request: FinoraPortableBranchAuthSecurityCodeRecoveryRequestV2;
  portableStore: FinoraPortableBranchAuthV2Store;
}
export function recoverFinoraPortableBranchAuthSecurityCodeV2(
  input:
    FinoraPortableBranchAuthSecurityCodeRecoveryCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  return runFinoraPortableBranchAuthV2CredentialMutationSerialized(
    () =>
      recoverPortableBranchAuthSecurityCodeV2Internal(
        input,
      ),
  );
}

export function rotateFinoraPortableBranchAuthCredentialV2(
  input:
    FinoraPortableBranchAuthCredentialRotationCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  return runFinoraPortableBranchAuthV2CredentialMutationSerialized(
    () =>
      rotatePortableBranchAuthCredentialV2Internal(
        input,
      ),
  );
}


export function resumeFinoraPortableBranchAuthCredentialRotationV2(
  input:
    FinoraPortableBranchAuthCredentialRotationResumeV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  return runFinoraPortableBranchAuthV2CredentialMutationSerialized(
    () =>
      resumePortableBranchAuthCredentialRotationV2Internal(
        input,
      ),
  );
}






/*
 * FINORA_P1_578OE_CONTROL_AUTH_RECONVERGENCE_PUBLIC
 */
/*
 * FINORA_P1_578YL_CREATED_AT_ONLY_REPAIR
 *
 * Compatibility repair for the known pre-XR reconvergence defect.
 * Password authenticates Control authority.
 * Password + Security Code must decrypt the same Portable payload.
 * Every normal lineage invariant except createdAt must already match.
 * Only encrypted payload.createdAt is eligible for repair.
 */
export interface FinoraPortableBranchAuthCreatedAtRepairRequestV2 {
  username: string;
  currentPassword: string;
  currentSecurityCode: string;
}

export interface FinoraPortableBranchAuthCreatedAtRepairCoordinatorV2Input {
  request:
    FinoraPortableBranchAuthCreatedAtRepairRequestV2;
  portableStore:
    FinoraPortableBranchAuthV2Store;
}

async function repairPortableBranchAuthCreatedAtV2Internal(
  input:
    FinoraPortableBranchAuthCreatedAtRepairCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  if (
    !input ||
    typeof input !== "object" ||
    !input.request ||
    !input.portableStore ||
    typeof input.request.username !== "string" ||
    input.request.username.trim().length === 0 ||
    typeof input.request.currentPassword !== "string" ||
    input.request.currentPassword.length === 0 ||
    typeof input.request.currentSecurityCode !== "string" ||
    input.request.currentSecurityCode.length === 0
  ) {
    return failure(
      "INVALID_REQUEST",
      "A valid FINORA createdAt repair request is required.",
    );
  }

  const authentication =
    await authenticateFinoraBranchCredential({
      username:
        input.request.username,
      password:
        input.request.currentPassword,
    });

  if (!authentication.success) {
    if (
      authentication.errorCode ===
        "INVALID_CREDENTIALS"
    ) {
      return failure(
        "INVALID_CREDENTIALS",
        authentication.error,
      );
    }

    if (
      authentication.errorCode ===
        "CONTROL_STORE_FAILED"
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        authentication.error,
      );
    }

    return failure(
      "AUTHENTICATION_FAILED",
      authentication.error,
    );
  }

  const principal =
    authentication.data;

  const controlStoreResult =
    await readFinoraControlStore();

  if (
    !controlStoreResult.success ||
    !controlStoreResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      controlStoreResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const matchingCredentials =
    (
      controlStoreResult.data.branchCredentials ??
      []
    ).filter(
      (credential) =>
        credential.credentialId ===
          principal.credentialId &&
        credential.status ===
          "ACTIVE",
    );

  if (
    matchingCredentials.length !==
      1
  ) {
    return failure(
      "CURRENT_CREDENTIAL_INVALID",
      "The authenticated FINORA credential is not uniquely authoritative.",
    );
  }

  const currentCredential =
    matchingCredentials[0];

  const currentGeneration =
    currentCredential.authGeneration ??
    FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION;

  if (
    !Number.isSafeInteger(
      currentGeneration,
    ) ||
    currentGeneration <
      FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION ||
    !credentialMatchesAuthenticatedPrincipal(
      currentCredential,
      principal,
      currentGeneration,
    )
  ) {
    return failure(
      "CURRENT_CREDENTIAL_INVALID",
      "The authenticated FINORA credential state is inconsistent.",
    );
  }

  let currentEnvelope;

  try {
    currentEnvelope =
      await input.portableStore.read(
        currentCredential.storageMode,
      );
  }
  catch (error) {
    return failure(
      "PORTABLE_STORAGE_FAILED",
      getErrorMessage(
        error,
        "Unable to read current FINORA Portable Auth.",
      ),
    );
  }

  if (!currentEnvelope) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISSING",
      "Current FINORA Portable Auth is missing.",
    );
  }

  let passwordPayload;
  let securityPayload;

  try {
    passwordPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        currentEnvelope,
        input.request.currentPassword,
      );

    securityPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
        currentEnvelope,
        input.request.currentSecurityCode,
      );
  }
  catch (error) {
    return failure(
      "CURRENT_PORTABLE_AUTH_AUTHENTICATION_FAILED",
      getErrorMessage(
        error,
        "Current Password or Security Code did not authenticate Portable Auth.",
      ),
    );
  }

  if (
    JSON.stringify(
      passwordPayload,
    ) !==
      JSON.stringify(
        securityPayload,
      )
  ) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISMATCH",
      "Password and Security Code resolved different Portable Auth payloads.",
    );
  }

  /*
   * Prove createdAt is the only mismatch by constructing an in-memory
   * Control credential clone whose createdAt temporarily equals the
   * predecessor payload. The existing exact matcher then checks every
   * other established lineage invariant without being weakened.
   */
  const createdAtNormalizedCredential:
    FinoraControlBranchCredential = {
      ...structuredClone(
        currentCredential,
      ),

      createdAt:
        passwordPayload.createdAt,
    };

  if (
    !currentPortablePayloadMatchesCredential(
      passwordPayload,
      createdAtNormalizedCredential,
      currentGeneration,
    )
  ) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISMATCH",
      "Portable Auth differs from authoritative Control state beyond createdAt; repair refused.",
    );
  }

  /*
   * If exact matcher already succeeds against the real credential,
   * there is nothing to repair.
   */
  if (
    currentPortablePayloadMatchesCredential(
      passwordPayload,
      currentCredential,
      currentGeneration,
    )
  ) {
    return success(
      `P1-578YL-CREATEDAT-${currentCredential.credentialId}`,
      structuredClone(
        currentCredential,
      ),
      currentGeneration,
      "ALREADY_MATCHED",
    );
  }

  if (
    passwordPayload.createdAt ===
      currentCredential.createdAt
  ) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISMATCH",
      "Portable Auth mismatch remains although createdAt already matches; repair refused.",
    );
  }

  let replacementEnvelope;

  try {
    replacementEnvelope =
      await repairFinoraPortableBranchAuthV2CreatedAtByRecoveryCode(
        currentEnvelope,
        input.request.currentSecurityCode,
        currentCredential.createdAt,
      );
  }
  catch (error) {
    return failure(
      "MATERIAL_DERIVATION_FAILED",
      getErrorMessage(
        error,
        "Unable to derive the guarded FINORA createdAt repair.",
      ),
    );
  }

  let repairedPasswordPayload;
  let repairedSecurityPayload;

  try {
    repairedPasswordPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        replacementEnvelope,
        input.request.currentPassword,
      );

    repairedSecurityPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
        replacementEnvelope,
        input.request.currentSecurityCode,
      );
  }
  catch (error) {
    return failure(
      "MATERIAL_DERIVATION_FAILED",
      getErrorMessage(
        error,
        "Repaired Portable Auth failed dual-factor verification.",
      ),
    );
  }

  if (
    JSON.stringify(
      repairedPasswordPayload,
    ) !==
      JSON.stringify(
        repairedSecurityPayload,
      ) ||
    !currentPortablePayloadMatchesCredential(
      repairedPasswordPayload,
      currentCredential,
      currentGeneration,
    )
  ) {
    return failure(
      "CURRENT_PORTABLE_AUTH_MISMATCH",
      "Repaired Portable Auth failed exact authoritative lineage validation.",
    );
  }

  let replaceResult:
    FinoraPortableBranchAuthReplaceResult;

  try {
    replaceResult =
      await input.portableStore.replaceExact(
        currentCredential.storageMode,
        currentEnvelope,
        replacementEnvelope,
      );
  }
  catch (error) {
    return failure(
      "PORTABLE_REPLACE_FAILED",
      getErrorMessage(
        error,
        "Unable to atomically replace FINORA Portable Auth.",
      ),
    );
  }

  return success(
    `P1-578YL-CREATEDAT-${currentCredential.credentialId}`,
    structuredClone(
      currentCredential,
    ),
    currentGeneration,
    replaceResult,
  );
}

export function repairFinoraPortableBranchAuthCreatedAtV2(
  input:
    FinoraPortableBranchAuthCreatedAtRepairCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  return runFinoraPortableBranchAuthV2CredentialMutationSerialized(
    () =>
      repairPortableBranchAuthCreatedAtV2Internal(
        input,
      ),
  );
}

export function reconvergeFinoraPortableBranchAuthSecurityCodeV2(
  input:
    FinoraPortableBranchAuthSecurityCodeReconvergenceCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  return runFinoraPortableBranchAuthV2CredentialMutationSerialized(
    () =>
      reconvergePortableBranchAuthSecurityCodeV2Internal(
        input,
      ),
  );
}
