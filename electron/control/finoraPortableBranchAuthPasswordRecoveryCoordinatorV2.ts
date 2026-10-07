import {
  randomUUID,
} from "node:crypto";

import {
  recoverFinoraPortableBranchAuthCredentialRotationsV2,
} from "./finoraPortableBranchAuthCredentialRotationRecoveryServiceV2.js";

import {
  runFinoraPortableBranchAuthV2CredentialMutationSerialized,
} from "./finoraPortableBranchAuthCredentialMutationQueueV2.js";

import {
  decryptFinoraPortableBranchAuthEnvelopeV2WithPassword,
  decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode,
  rotateFinoraPortableBranchAuthV2PasswordByRecoveryCode,
} from "./finoraPortableBranchAuthV2Crypto.js";

import type {
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthReplaceResult,
  FinoraPortableBranchAuthV2Store,
} from "./finoraPortableBranchAuthV2Store.js";

import {
  applyFinoraPortableBranchAuthV2CredentialRotationControlState,
  canonicalizeFinoraCredentialUsername,
  completeFinoraPortableBranchAuthV2CredentialRotationTransaction,
  markFinoraPortableBranchAuthV2CredentialRotationPortableReplaced,
  prepareFinoraPortableBranchAuthV2CredentialRotationTransaction,
  readFinoraControlStore,
  readPendingFinoraPortableBranchAuthV2CredentialRotation,
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
  resetFinoraOwnerPasswordOnServer,
} from "./finoraServerPasswordResetClient.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthPasswordRecoveryRequestV2 {
  /**
   * Stable identity generated once for one logical Forgot Password
   * submission and reused if that same submission is retried.
   *
   * Never derive this value from Password or Security Code.
   */
  recoveryRequestId:
    string;

  username:
    string;

  currentSecurityCode:
    string;

  newPassword:
    string;
}

export interface FinoraPortableBranchAuthPasswordRecoveryCoordinatorV2Input {
  request:
    FinoraPortableBranchAuthPasswordRecoveryRequestV2;

  portableStore:
    FinoraPortableBranchAuthV2Store;
}

export type FinoraPortableBranchAuthPasswordRecoveryCoordinatorV2ErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_CREDENTIALS"
  | "CONTROL_STORE_FAILED"
  | "CURRENT_CREDENTIAL_INVALID"
  | "CURRENT_PORTABLE_AUTH_MISSING"
  | "CURRENT_PORTABLE_AUTH_AUTHENTICATION_FAILED"
  | "CURRENT_PORTABLE_AUTH_MISMATCH"
  | "NEW_PASSWORD_MUST_DIFFER"
  | "GENERATION_INVALID"
  | "MATERIAL_DERIVATION_FAILED"
  | "SERVER_REJECTED"
  | "SERVER_UNAVAILABLE"
  | "SERVER_RESPONSE_INVALID"
  | "TRANSACTION_INVALID"
  | "PREPARE_FAILED"
  | "PORTABLE_REPLACE_FAILED"
  | "PORTABLE_REPLACED_STATE_FAILED"
  | "CONTROL_APPLY_FAILED"
  | "COMPLETE_FAILED";

export interface FinoraPortableBranchAuthPasswordRecoverySuccessV2 {
  transactionId:
    string;

  credential:
    FinoraControlBranchCredential;

  authGeneration:
    number;

  portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult;

  serverAlreadyApplied:
    boolean;
}

export type FinoraPortableBranchAuthPasswordRecoveryResultV2 =
  | {
      success:
        true;

      data:
        FinoraPortableBranchAuthPasswordRecoverySuccessV2;
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableBranchAuthPasswordRecoveryCoordinatorV2ErrorCode;

      error:
        string;
    };

// ============================================================
// RESULT HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthPasswordRecoveryCoordinatorV2ErrorCode,
  error:
    string,
): FinoraPortableBranchAuthPasswordRecoveryResultV2 {
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
  serverAlreadyApplied:
    boolean,
): FinoraPortableBranchAuthPasswordRecoveryResultV2 {
  return {
    success:
      true,

    data: {
      transactionId,
      credential,
      authGeneration,
      portableReplaceResult,
      serverAlreadyApplied,
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
// REQUEST VALIDATION
// ============================================================

function isValidRequest(
  request:
    FinoraPortableBranchAuthPasswordRecoveryRequestV2,
): boolean {
  return (
    typeof request ===
      "object" &&
    request !==
      null &&
    typeof request.recoveryRequestId ===
      "string" &&
    request.recoveryRequestId.length >
      0 &&
    request.recoveryRequestId.trim() ===
      request.recoveryRequestId &&
    typeof request.username ===
      "string" &&
    request.username.trim().length >
      0 &&
    typeof request.currentSecurityCode ===
      "string" &&
    request.currentSecurityCode.length >
      0 &&
    typeof request.newPassword ===
      "string" &&
    request.newPassword.length >=
      8 &&
    request.newPassword.length <=
      128 &&
    request.newPassword.trim().length >
      0
  );
}

// ============================================================
// PORTABLE -> CONTROL VERIFIER ADAPTER
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
// PORTABLE PAYLOAD <-> CONTROL CREDENTIAL CORRELATION
// ============================================================

function currentPortablePayloadMatchesCredential(
  payload:
    Awaited<
      ReturnType<
        typeof decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode
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
// INTERNAL RECOVERY
// ============================================================

async function recoverPasswordBySecurityCodeInternal(
  input:
    FinoraPortableBranchAuthPasswordRecoveryCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthPasswordRecoveryResultV2
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
      "A valid FINORA Forgot Password request is required.",
    );
  }

  const request =
    input.request;

  const canonicalUsername =
    canonicalizeFinoraCredentialUsername(
      request.username,
    );

  if (canonicalUsername.length === 0) {
    return failure(
      "INVALID_REQUEST",
      "A valid User ID is required.",
    );
  }

  // ==========================================================
  // 1. RECOVER ANY PREVIOUS DURABLE V2 ROTATIONS FIRST
  //
  // This recovery uses frozen verifier/envelope material only.
  // It receives no Password or Security Code.
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

  /*
   * Exact request-id retry after a crash:
   *
   * Only a transaction recovered by THIS invocation can be
   * returned before current Security Code authentication.
   *
   * Historical COMPLETE records alone are not authentication
   * authority.
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
          "Unable to read Control Store after credential recovery.",
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
            request.recoveryRequestId &&
          transaction.canonicalUsername ===
            canonicalUsername,
      );

    if (
      exactRecoveredRequest.length >
        1
    ) {
      return failure(
        "CONTROL_STORE_FAILED",
        "Multiple recovered Forgot Password transactions share the same recoveryRequestId.",
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
        true,
      );
    }
  }

  // ==========================================================
  // 2. RESOLVE EXACT ACTIVE CREDENTIAL BY CANONICAL USERNAME
  //
  // Forgot Password deliberately does NOT authenticate the old
  // Password. Security Code is the recovery authority.
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
        credential.status ===
          "ACTIVE" &&
        credential.canonicalUsername ===
          canonicalUsername,
    );

  if (
    matchingCredentials.length !==
      1
  ) {
    return failure(
      "INVALID_CREDENTIALS",
      "User ID or Security Code is invalid.",
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
    currentGeneration >=
      Number.MAX_SAFE_INTEGER
  ) {
    return failure(
      "GENERATION_INVALID",
      "FINORA credential generation cannot be advanced safely.",
    );
  }

  // Recovery above should have reconciled every unfinished V2
  // rotation before we derive any fresh successor material.
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
        "Unable to inspect unfinished FINORA credential rotation state.",
    );
  }

  if (
    pendingRotationResult.data.transaction
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      "An unfinished FINORA credential rotation remains after recovery.",
    );
  }

  // ==========================================================
  // 3. READ CURRENT PORTABLE AUTH
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
      "CURRENT_PORTABLE_AUTH_MISSING",
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
  // 4. SECURITY CODE AUTHENTICATION
  //
  // No current Password is requested or required.
  // ==========================================================

  let currentPayload;

  try {
    currentPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithRecoveryCode(
        currentEnvelope,
        request.currentSecurityCode,
      );
  }
  catch {
    return failure(
      "INVALID_CREDENTIALS",
      "User ID or Security Code is invalid.",
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
      "Current Portable Branch Auth does not match the authoritative credential lineage.",
    );
  }

  // ==========================================================
  // 5. REJECT A TRUE NO-OP
  //
  // This check does NOT require the old Password.
  //
  // If the proposed new Password already opens the CURRENT local
  // envelope, it is already the current Password and should not
  // consume another credential generation.
  //
  // In the important crash window where server reset succeeded
  // but local state is still the predecessor, this check fails
  // to decrypt locally and the retry correctly continues.
  // ==========================================================

  try {
    const proposedPasswordPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV2WithPassword(
        currentEnvelope,
        request.newPassword,
      );

    if (
      JSON.stringify(
        proposedPasswordPayload,
      ) ===
        JSON.stringify(
          currentPayload,
        )
    ) {
      return failure(
        "NEW_PASSWORD_MUST_DIFFER",
        "New Password must differ from the current Password.",
      );
    }
  }
  catch {
    // Expected when the proposed Password is genuinely new.
  }

  const targetGeneration =
    currentGeneration +
    1;

  const preparedAt =
    new Date().toISOString();

  // ==========================================================
  // 6. DERIVE COMPLETE LOCAL SUCCESSOR IN MEMORY ONLY
  //
  // Security Code authorizes Password replacement.
  //
  // The Security Code itself does NOT rotate, therefore the
  // existing security verifier remains authoritative.
  // ==========================================================

  let passwordRotation;

  try {
    passwordRotation =
      await rotateFinoraPortableBranchAuthV2PasswordByRecoveryCode(
        currentEnvelope,
        request.currentSecurityCode,
        request.newPassword,
        {
          authGeneration:
            targetGeneration,

          updatedAt:
            preparedAt,
        },
      );
  }
  catch (
    error
  ) {
    return failure(
      "MATERIAL_DERIVATION_FAILED",
      getErrorMessage(
        error,
        "Unable to derive replacement Password material.",
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
          passwordRotation.passwordVerifier,
        ),

      /*
       * Forgot Password must preserve the Security Code exactly.
       * No new security verifier is created.
       */
      securityVerifier:
        structuredClone(
          currentCredential.securityVerifier,
        ),

      updatedAt:
        preparedAt,
    };

  // ==========================================================
  // 7. SERVER FIRST
  //
  // CRITICAL:
  // Do NOT persist PREPARED before server success.
  //
  // Otherwise generic durable recovery could commit local
  // successor state after the server rejected the reset.
  //
  // D19 made the server endpoint idempotent after successful
  // Security Code authentication, so the server-success /
  // pre-PREPARED crash window can be retried safely.
  // ==========================================================

  const serverReset =
    await resetFinoraOwnerPasswordOnServer({
      username:
        currentCredential.username,

      securityCode:
        request.currentSecurityCode,

      newPassword:
        request.newPassword,
    });

  if (!serverReset.success) {
    if (
      serverReset.errorCode ===
        "INVALID_CREDENTIALS"
    ) {
      return failure(
        "INVALID_CREDENTIALS",
        serverReset.error,
      );
    }

    if (
      serverReset.errorCode ===
        "SERVER_UNAVAILABLE"
    ) {
      return failure(
        "SERVER_UNAVAILABLE",
        serverReset.error,
      );
    }

    if (
      serverReset.errorCode ===
        "INVALID_SERVER_RESPONSE"
    ) {
      return failure(
        "SERVER_RESPONSE_INVALID",
        serverReset.error,
      );
    }

    return failure(
      "SERVER_REJECTED",
      serverReset.error,
    );
  }

  // ==========================================================
  // 8. FREEZE DURABLE LOCAL TRANSACTION
  //
  // This is intentionally AFTER server success.
  // ==========================================================

  const transactionId =
    `${FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}${randomUUID()}`;

  const preparedTransaction:
    FinoraPortableBranchAuthCredentialRotationTransactionV2 = {
      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_V2_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,

      transactionId,

      /*
       * Existing V2 journal field is reused intentionally so all
       * generic crash recovery remains compatible.
       */
      rotationRequestId:
        request.recoveryRequestId,

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
          passwordRotation.envelope,
        ),

      replacementPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthV2CredentialRotationEnvelopeSha256(
          passwordRotation.envelope,
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
        "Forgot Password credential rotation transaction is invalid.",
      ),
    );
  }

  const prepareResult =
    await prepareFinoraPortableBranchAuthV2CredentialRotationTransaction({
      transaction:
        preparedTransaction,
    });

  if (!prepareResult.success) {
    return failure(
      "PREPARE_FAILED",
      prepareResult.error ??
        "Unable to persist the Forgot Password credential rotation transaction.",
    );
  }

  // ==========================================================
  // 9. PORTABLE AUTH CAS
  // ==========================================================

  let portableReplaceResult:
    FinoraPortableBranchAuthReplaceResult;

  try {
    portableReplaceResult =
      await input.portableStore.replaceExact(
        currentCredential.storageMode,
        currentEnvelope,
        passwordRotation.envelope,
      );
  }
  catch (
    error
  ) {
    return failure(
      "PORTABLE_REPLACE_FAILED",
      getErrorMessage(
        error,
        "Unable to replace Portable Branch Auth Password state.",
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
        "Unable to apply replacement FINORA Password credential state.",
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
        "Unable to complete the FINORA Forgot Password transaction.",
    );
  }

  return success(
    transactionId,
    replacementCredential,
    targetGeneration,
    portableReplaceResult,
    serverReset.alreadyApplied,
  );
}

// ============================================================
// PUBLIC SERIALIZED ENTRYPOINT
// ============================================================

export function recoverFinoraPortableBranchAuthPasswordV2(
  input:
    FinoraPortableBranchAuthPasswordRecoveryCoordinatorV2Input,
): Promise<
  FinoraPortableBranchAuthPasswordRecoveryResultV2
> {
  return runFinoraPortableBranchAuthV2CredentialMutationSerialized(
    () =>
      recoverPasswordBySecurityCodeInternal(
        input,
      ),
  );
}

// ============================================================
// END
// ============================================================