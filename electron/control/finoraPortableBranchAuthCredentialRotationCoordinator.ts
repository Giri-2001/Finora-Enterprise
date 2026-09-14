import {
  randomUUID,
} from "node:crypto";

import {
  authenticateFinoraBranchCredential,
} from "./finoraBranchCredentialAuthenticationService.js";

import type {
  FinoraBranchCredentialAuthenticationSuccess,
} from "./finoraBranchCredentialAuthenticationService.js";

import {
  createFinoraPortableBranchAuthEnrollmentMaterialV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthReplaceResult,
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  applyFinoraPortableBranchAuthCredentialRotationControlState,
  completeFinoraPortableBranchAuthCredentialRotationTransaction,
  markFinoraPortableBranchAuthCredentialRotationPortableReplaced,
  prepareFinoraPortableBranchAuthCredentialRotationTransaction,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlBranchCredentialVerifierV1,
} from "./finoraControlStore.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX,
  FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,
  computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256,
  validateFinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

import type {
  FinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthCredentialRotationRequest {
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

export interface FinoraPortableBranchAuthCredentialRotationCoordinatorInput {
  request:
    FinoraPortableBranchAuthCredentialRotationRequest;

  portableStore:
    FinoraPortableBranchAuthStore;
}

export type FinoraPortableBranchAuthCredentialRotationCoordinatorErrorCode =
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

export interface FinoraPortableBranchAuthCredentialRotationCoordinatorSuccess {
  transactionId:
    string;

  credential:
    FinoraControlBranchCredential;

  authGeneration:
    number;

  portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult;
}

export type FinoraPortableBranchAuthCredentialRotationCoordinatorResult =
  | {
      success:
        true;

      data:
        FinoraPortableBranchAuthCredentialRotationCoordinatorSuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableBranchAuthCredentialRotationCoordinatorErrorCode;

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
    FinoraPortableBranchAuthCredentialRotationCoordinatorErrorCode,
  error:
    string,
): FinoraPortableBranchAuthCredentialRotationCoordinatorResult {
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
): FinoraPortableBranchAuthCredentialRotationCoordinatorResult {
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
    FinoraPortableBranchAuthCredentialRotationRequest,
): boolean {
  return (
    typeof request ===
      "object" &&
    request !==
      null &&
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
        typeof decryptFinoraPortableBranchAuthEnvelopeV1
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

async function rotatePortableBranchAuthCredentialInternal(
  input:
    FinoraPortableBranchAuthCredentialRotationCoordinatorInput,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorResult
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
  // 1. PASSWORD-FIRST AUTHORITY
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
    currentPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV1(
        currentEnvelope,
        request.currentPassword,
        request.currentSecurityCode,
        {
          expectedScope: {
            ownerId:
              currentCredential.ownerId,

            businessId:
              currentCredential.businessId,

            branchId:
              currentCredential.branchId,
          },
        },
      );
  }
  catch {
    return failure(
      "CURRENT_PORTABLE_AUTH_AUTHENTICATION_FAILED",
      "Current Security Code or Portable Branch Auth state is invalid.",
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

  let material;

  try {
    material =
      await createFinoraPortableBranchAuthEnrollmentMaterialV1({
        authStateId:
          currentPayload.authStateId,

        sourceAuthorizationId:
          currentCredential.sourceAuthorizationId,

        sourceAuthorizationVerificationEvidence:
          structuredClone(
            currentPayload.sourceAuthorizationVerificationEvidence,
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

        createdAt:
          currentCredential.createdAt,

        updatedAt:
          preparedAt,

        password:
          replacementPassword,

        securityCode:
          replacementSecurityCode,
      });
  }
  catch (
    error
  ) {
    return failure(
      "MATERIAL_DERIVATION_FAILED",
      getErrorMessage(
        error,
        "Unable to derive replacement Portable Branch Auth material.",
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
    `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}${randomUUID()}`;

  const preparedTransaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV1 = {
      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,

      transactionId,

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
        computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
          currentEnvelope,
        ),

      replacementPortableEnvelope:
        structuredClone(
          material.envelope,
        ),

      replacementPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
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
    validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
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
  // 8. PREPARED — DURABLE CONTROL STORE JOURNAL
  // ==========================================================

  const prepareResult =
    await prepareFinoraPortableBranchAuthCredentialRotationTransaction({
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
    await markFinoraPortableBranchAuthCredentialRotationPortableReplaced({
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
    await applyFinoraPortableBranchAuthCredentialRotationControlState({
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
    await completeFinoraPortableBranchAuthCredentialRotationTransaction({
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

// ============================================================
// PUBLIC SERIALIZED ENTRYPOINT
// ============================================================

export function rotateFinoraPortableBranchAuthCredential(
  input:
    FinoraPortableBranchAuthCredentialRotationCoordinatorInput,
): Promise<
  FinoraPortableBranchAuthCredentialRotationCoordinatorResult
> {
  const operation =
    portableCredentialRotationQueue.then(
      () =>
        rotatePortableBranchAuthCredentialInternal(
          input,
        ),
      () =>
        rotatePortableBranchAuthCredentialInternal(
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