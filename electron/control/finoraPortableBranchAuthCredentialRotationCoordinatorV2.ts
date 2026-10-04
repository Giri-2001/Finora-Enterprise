import {
  randomUUID,
} from "node:crypto";

import {
  authenticateFinoraBranchCredential,
} from "./finoraBranchCredentialAuthenticationService.js";
import {
  recoverFinoraPortableBranchAuthCredentialRotationsV2,
} from "./finoraPortableBranchAuthCredentialRotationRecoveryServiceV2.js";

import type {
  FinoraBranchCredentialAuthenticationSuccess,
} from "./finoraBranchCredentialAuthenticationService.js";

import {
  decryptFinoraPortableBranchAuthEnvelopeV2WithPassword,
  decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode,
  rotateFinoraPortableBranchAuthV2PasswordByRecoveryCode,
  rotateFinoraPortableBranchAuthV2RecoveryCodeByPassword,
} from "./finoraPortableBranchAuthV2Crypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
} from "./finoraPortableBranchAuthContract.js";

import type {
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

// ============================================================
// CONTRACT
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

let portableCredentialRotationQueue:
  Promise<void> =
  Promise.resolve();

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
  // 8. PREPARED â€” DURABLE CONTROL STORE JOURNAL
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

export function rotateFinoraPortableBranchAuthCredentialV2(
  input:
    FinoraPortableBranchAuthCredentialRotationCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  const operation =
    portableCredentialRotationQueue.then(
      () =>
        rotatePortableBranchAuthCredentialV2Internal(
          input,
        ),
      () =>
        rotatePortableBranchAuthCredentialV2Internal(
          input,
        ),
    );

  portableCredentialRotationQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}


export function resumeFinoraPortableBranchAuthCredentialRotationV2(
  input:
    FinoraPortableBranchAuthCredentialRotationResumeV2Input,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorV2Result
> {
  const operation =
    portableCredentialRotationQueue.then(
      () =>
        resumePortableBranchAuthCredentialRotationV2Internal(
          input,
        ),
      () =>
        resumePortableBranchAuthCredentialRotationV2Internal(
          input,
        ),
    );

  portableCredentialRotationQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}




