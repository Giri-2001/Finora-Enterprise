// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH ENROLLMENT COORDINATOR
//
// RESPONSIBILITY:
//
// - Resolve fresh signed one-time credential authority
// - Resume an existing durable enrollment transaction
// - Derive fresh enrollment material exactly once
// - Persist PREPARED before Portable Auth mutation
// - Reconcile/write the exact prepared portable envelope
// - Advance PORTABLE_WRITTEN
// - Atomically apply credential + consume authorization
// - Advance CONTROL_APPLIED -> COMPLETE
//
// SECURITY:
//
// - MAIN PROCESS ONLY.
// - No filesystem root is accepted from the renderer.
// - No plaintext Password / Security Code is persisted.
// - Fresh enrollment uses one SCRYPT derivation pass only.
// - Recovery proves the supplied Password + Security Code against
//   the already-prepared encrypted envelope before advancing.
// - USB storage failure never falls back to LOCAL.
// ============================================================

import {
  finoraPortableBranchAuthSourceAuthorizationVerificationEvidenceEqual,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";
import {
  randomUUID,
} from "node:crypto";

import {
  FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,
} from "./finoraPortableBranchAuthContract.js";

import {
  createFinoraPortableBranchAuthEnrollmentMaterialV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX,
  FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION,
  computeFinoraPortableBranchAuthEnvelopeSha256,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";

import {
  applyFinoraPortableBranchAuthEnrollmentControlState,
  canonicalizeFinoraCredentialUsername,
  completeFinoraPortableBranchAuthEnrollmentTransaction,
  markFinoraPortableBranchAuthEnrollmentWritten,
  prepareFinoraPortableBranchAuthEnrollmentTransaction,
  readFinoraControlStore,
} from "./finoraControlStore.js";

import type {
  FinoraPortableBranchAuthEnrollmentTransactionV1,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";

import type {
  FinoraPortableBranchAuthVerifierV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlBranchCredentialVerifierV1,
} from "./finoraControlStore.js";

// ============================================================
// CONTRACT
// ============================================================

export interface FinoraPortableBranchAuthEnrollmentRequest {
  username:
    string;

  password:
    string;

  securityCode:
    string;
}

export interface FinoraPortableBranchAuthEnrollmentCoordinatorInput {
  request:
    FinoraPortableBranchAuthEnrollmentRequest;

  portableStore:
    FinoraPortableBranchAuthStore;
}

export type FinoraPortableBranchAuthEnrollmentCoordinatorErrorCode =
  | "CONTROL_STORE_FAILED"
  | "AUTHORIZATION_NOT_FOUND"
  | "AUTHORIZATION_AMBIGUOUS"
  | "DURABLE_TRANSACTION_AMBIGUOUS"
  | "RECOVERY_CREDENTIALS_INVALID"
  | "RECOVERY_STATE_INVALID"
  | "MATERIAL_DERIVATION_FAILED"
  | "PREPARE_FAILED"
  | "PORTABLE_STORAGE_FAILED"
  | "PORTABLE_WRITTEN_STATE_FAILED"
  | "CONTROL_APPLY_FAILED"
  | "COMPLETE_FAILED";

export interface FinoraPortableBranchAuthEnrollmentCoordinatorSuccess {
  transaction:
    FinoraPortableBranchAuthEnrollmentTransactionV1;

  credential:
    FinoraControlBranchCredential;

  recovered:
    boolean;
}

export type FinoraPortableBranchAuthEnrollmentCoordinatorResult =
  | {
      success:
        true;

      data:
        FinoraPortableBranchAuthEnrollmentCoordinatorSuccess;
    }
  | {
      success:
        false;

      errorCode:
        FinoraPortableBranchAuthEnrollmentCoordinatorErrorCode;

      error:
        string;
    };

// ============================================================
// SERIALIZATION
// ============================================================
//
// Enrollment is intentionally serialized process-wide.
//
// This prevents two simultaneous recipient requests from deriving
// two different random PREPARED artifacts for one one-time signed
// authorization before either preparation reaches the Control Store.
// ============================================================

let portableEnrollmentQueue:
  Promise<void> =
    Promise.resolve();

// ============================================================
// RESULT HELPERS
// ============================================================

function failure(
  errorCode:
    FinoraPortableBranchAuthEnrollmentCoordinatorErrorCode,
  error:
    string,
): FinoraPortableBranchAuthEnrollmentCoordinatorResult {
  return {
    success:
      false,

    errorCode,

    error,
  };
}

function success(
  transaction:
    FinoraPortableBranchAuthEnrollmentTransactionV1,
  recovered:
    boolean,
): FinoraPortableBranchAuthEnrollmentCoordinatorResult {
  return {
    success:
      true,

    data: {
      transaction,

      credential:
        transaction.credential,

      recovered,
    },
  };
}

// ============================================================
// VERIFIER ADAPTER
//
// Portable Auth derives 64 bytes so it can separate verifier
// evidence from encryption-key material.
//
// Control Store intentionally persists only the first 32-byte
// verifier evidence. No second SCRYPT operation is performed.
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
    left !== undefined &&
    JSON.stringify(
      left,
    ) ===
      JSON.stringify(
        right,
      )
  );
}

// ============================================================
// RECOVERY CORRELATION
// ============================================================

async function validateRecoveryFactorsAndPayload(
  transaction:
    FinoraPortableBranchAuthEnrollmentTransactionV1,
  request:
    FinoraPortableBranchAuthEnrollmentRequest,
): Promise<boolean> {
  let payload;

  try {
    payload =
      await decryptFinoraPortableBranchAuthEnvelopeV1(
        transaction.portableEnvelope,
        request.password,
        request.securityCode,
        {
          expectedScope: {
            ownerId:
              transaction.ownerId,

            businessId:
              transaction.businessId,

            branchId:
              transaction.branchId,
          },
        },
      );
  }
  catch {
    return false;
  }

  const credential =
    transaction.credential;

  const expectedPasswordVerifier =
    toControlCredentialVerifier(
      payload.passwordVerifier,
    );

  const expectedSecurityVerifier =
    toControlCredentialVerifier(
      payload.securityVerifier,
    );

  return (
    finoraPortableBranchAuthSourceAuthorizationVerificationEvidenceEqual(
      payload.sourceAuthorizationVerificationEvidence,
      transaction.sourceAuthorizationVerificationEvidence,
    ) &&
    payload.sourceAuthorizationId ===
      transaction.sourceAuthorizationId &&
    payload.sourceAuthorizationId ===
      credential.sourceAuthorizationId &&
    payload.ownerId ===
      transaction.ownerId &&
    payload.businessId ===
      transaction.businessId &&
    payload.branchId ===
      transaction.branchId &&
    payload.userId ===
      credential.userId &&
    payload.username ===
      credential.username &&
    payload.canonicalUsername ===
      transaction.canonicalUsername &&
    payload.canonicalUsername ===
      credential.canonicalUsername &&
    payload.fullName ===
      credential.fullName &&
    payload.role ===
      credential.role &&
    payload.dataContext ===
      credential.dataContext &&
    payload.demoId ===
      credential.demoId &&
    payload.storageMode ===
      transaction.storageMode &&
    payload.storageMode ===
      credential.storageMode &&
    payload.authGeneration ===
      FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION &&
    payload.createdAt ===
      credential.createdAt &&
    payload.updatedAt ===
      credential.updatedAt &&
    transaction.createdAt ===
      credential.createdAt &&
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
// DURABLE PIPELINE
// ============================================================

async function advanceDurableTransaction(
  transaction:
    FinoraPortableBranchAuthEnrollmentTransactionV1,
  portableStore:
    FinoraPortableBranchAuthStore,
  recovered:
    boolean,
): Promise<
  FinoraPortableBranchAuthEnrollmentCoordinatorResult
> {
  try {
    await portableStore.ensureExact(
      transaction.storageMode,
      transaction.portableEnvelope,
    );
  }
  catch (
    error
  ) {
    return failure(
      "PORTABLE_STORAGE_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to reconcile Portable Branch Auth state.",
    );
  }

  const portableWrittenResult =
    await markFinoraPortableBranchAuthEnrollmentWritten({
      transactionId:
        transaction.transactionId,

      transitionedAt:
        new Date().toISOString(),
    });

  if (
    !portableWrittenResult.success ||
    !portableWrittenResult.data
  ) {
    return failure(
      "PORTABLE_WRITTEN_STATE_FAILED",
      portableWrittenResult.error ??
        "Unable to persist PORTABLE_WRITTEN enrollment state.",
    );
  }

  const controlApplyResult =
    await applyFinoraPortableBranchAuthEnrollmentControlState({
      transactionId:
        transaction.transactionId,

      transitionedAt:
        new Date().toISOString(),
    });

  if (
    !controlApplyResult.success ||
    !controlApplyResult.data
  ) {
    return failure(
      "CONTROL_APPLY_FAILED",
      controlApplyResult.error ??
        "Unable to atomically apply Portable Branch Auth credential state.",
    );
  }

  const completeResult =
    await completeFinoraPortableBranchAuthEnrollmentTransaction({
      transactionId:
        transaction.transactionId,

      transitionedAt:
        new Date().toISOString(),
    });

  if (
    !completeResult.success ||
    !completeResult.data
  ) {
    return failure(
      "COMPLETE_FAILED",
      completeResult.error ??
        "Unable to finalize Portable Branch Auth enrollment transaction.",
    );
  }

  return success(
    completeResult.data.transaction,
    recovered,
  );
}

// ============================================================
// INTERNAL COORDINATOR
// ============================================================

async function enrollFinoraPortableBranchAuthInternal(
  input:
    FinoraPortableBranchAuthEnrollmentCoordinatorInput,
): Promise<
  FinoraPortableBranchAuthEnrollmentCoordinatorResult
> {
  const canonicalUsername =
    canonicalizeFinoraCredentialUsername(
      input.request.username,
    );

  const storeResult =
    await readFinoraControlStore();

  if (
    !storeResult.success ||
    !storeResult.data
  ) {
    return failure(
      "CONTROL_STORE_FAILED",
      storeResult.error ??
        "Unable to load the FINORA Control Store.",
    );
  }

  const controlStore =
    storeResult.data;

  // ----------------------------------------------------------
  // DURABLE RECOVERY FIRST
  //
  // Once PREPARED exists, its exact credential + envelope are
  // authoritative. Never generate fresh salts, IDs or ciphertext.
  // ----------------------------------------------------------

  const durableMatches =
    (
      controlStore.portableBranchAuthEnrollmentTransactions ??
      []
    ).filter(
      (
        transaction,
      ) =>
        transaction.canonicalUsername ===
          canonicalUsername,
    );

  if (
    durableMatches.length >
      1
  ) {
    return failure(
      "DURABLE_TRANSACTION_AMBIGUOUS",
      "Portable Branch Auth enrollment recovery is ambiguous for this username.",
    );
  }

  if (
    durableMatches.length ===
      1
  ) {
    const durableTransaction =
      durableMatches[0];

    const factorsMatch =
      await validateRecoveryFactorsAndPayload(
        durableTransaction,
        input.request,
      );

    if (!factorsMatch) {
      return failure(
        "RECOVERY_CREDENTIALS_INVALID",
        "Password or Security Code does not match the prepared Portable Branch Auth enrollment.",
      );
    }

    return advanceDurableTransaction(
      durableTransaction,
      input.portableStore,
      true,
    );
  }

  // ----------------------------------------------------------
  // FRESH SIGNED AUTHORIZATION
  // ----------------------------------------------------------

  const matchingAuthorizations =
    (
      controlStore.branchCredentialEnrollmentAuthorizations ??
      []
    ).filter(
      (
        authorization,
      ) =>
        canonicalizeFinoraCredentialUsername(
          authorization.username,
        ) ===
          canonicalUsername,
    );

  if (
    matchingAuthorizations.length ===
      0
  ) {
    return failure(
      "AUTHORIZATION_NOT_FOUND",
      "FINORA credential enrollment authorization is missing or already consumed.",
    );
  }

  if (
    matchingAuthorizations.length !==
      1
  ) {
    return failure(
      "AUTHORIZATION_AMBIGUOUS",
      "FINORA credential enrollment authority is ambiguous for this username.",
    );
  }

  const authorization =
    matchingAuthorizations[0];

  const matchingVerificationEvidence =
    (
      controlStore.branchCredentialAuthorizationVerificationEvidence ??
      []
    ).filter(
      (
        evidence,
      ) =>
        evidence.authorizationId ===
          authorization.authorizationId,
    );

  if (
    matchingVerificationEvidence.length ===
      0
  ) {
    return failure(
      "AUTHORIZATION_NOT_FOUND",
      "FINORA credential enrollment signer verification evidence is missing.",
    );
  }

  if (
    matchingVerificationEvidence.length !==
      1
  ) {
    return failure(
      "AUTHORIZATION_AMBIGUOUS",
      "FINORA credential enrollment signer verification evidence is ambiguous.",
    );
  }

  const persistedVerificationEvidence =
    matchingVerificationEvidence[0];

  const persistedVerifiedSigner =
    persistedVerificationEvidence.verifiedControlSigner;

  if (
    persistedVerifiedSigner.status !==
      "ACTIVE" &&
    persistedVerifiedSigner.status !==
      "RETIRED"
  ) {
    return failure(
      "AUTHORIZATION_NOT_FOUND",
      "FINORA credential enrollment signer verification evidence is not eligible for portable lineage.",
    );
  }

  const matchingPortabilityAuthorities =
    (
      controlStore.branchCredentialPortabilityAuthorities ??
      []
    ).filter(
      (
        provenance,
      ) =>
        provenance.sourceAuthorizationId ===
          authorization.authorizationId,
    );

  if (
    matchingPortabilityAuthorities.length ===
      0
  ) {
    return failure(
      "AUTHORIZATION_NOT_FOUND",
      "FINORA credential enrollment portability authority proof is missing.",
    );
  }

  if (
    matchingPortabilityAuthorities.length !==
      1
  ) {
    return failure(
      "AUTHORIZATION_AMBIGUOUS",
      "FINORA credential enrollment portability authority proof is ambiguous.",
    );
  }

  const persistedPortabilityAuthority =
    matchingPortabilityAuthorities[0];

  const portabilityPackage =
    persistedPortabilityAuthority.signedPortabilityAuthorityPackage;

  const portabilityPayload =
    portabilityPackage.payload;

  const portabilityVerifiedSigner =
    persistedPortabilityAuthority.verifiedControlSigner;

  if (
    persistedPortabilityAuthority.sourceAuthorizationId !==
      authorization.authorizationId ||
    portabilityPayload.sourceAuthorizationId !==
      authorization.authorizationId ||
    portabilityPackage.target.ownerId !==
      authorization.ownerId ||
    portabilityPackage.target.businessId !==
      authorization.businessId ||
    portabilityPackage.target.branchId !==
      authorization.branchId ||
    portabilityPayload.ownerId !==
      authorization.ownerId ||
    portabilityPayload.businessId !==
      authorization.businessId ||
    portabilityPayload.branchId !==
      authorization.branchId ||
    portabilityPayload.userId !==
      authorization.userId ||
    portabilityPayload.username !==
      authorization.username ||
    portabilityPayload.role !==
      authorization.role ||
    portabilityPayload.storageMode !==
      authorization.storageMode ||
    portabilityPayload.dataContext !==
      authorization.dataContext ||
    portabilityPayload.sourceAuthorizationMethod !==
      authorization.method ||
    (
      portabilityPayload.demoId ??
      undefined
    ) !==
      (
        authorization.demoId ??
        undefined
      ) ||
    portabilityPackage.issuer.issuerId !==
      persistedVerificationEvidence.issuerId ||
    portabilityPackage.issuer.signingKeyId !==
      persistedVerifiedSigner.signingKeyId ||
    portabilityVerifiedSigner.issuerId !==
      persistedVerifiedSigner.issuerId ||
    portabilityVerifiedSigner.signingKeyId !==
      persistedVerifiedSigner.signingKeyId ||
    portabilityVerifiedSigner.algorithm !==
      persistedVerifiedSigner.algorithm ||
    portabilityVerifiedSigner.format !==
      persistedVerifiedSigner.format ||
    portabilityVerifiedSigner.publicKey !==
      persistedVerifiedSigner.publicKey ||
    portabilityVerifiedSigner.status !==
      persistedVerifiedSigner.status ||
    portabilityVerifiedSigner.validFrom !==
      persistedVerifiedSigner.validFrom ||
    (
      portabilityVerifiedSigner.validUntil ??
      undefined
    ) !==
      (
        persistedVerifiedSigner.validUntil ??
        undefined
      ) ||
    persistedPortabilityAuthority.verifiedAt !==
      persistedVerificationEvidence.verifiedAt
  ) {
    return failure(
      "AUTHORIZATION_NOT_FOUND",
      "FINORA credential enrollment portability authority proof does not match the exact source authorization lineage and verified signer.",
    );
  }

  const sourceAuthorizationVerificationEvidence = {
    authorizationId:
      persistedVerificationEvidence.authorizationId,

    packageId:
      persistedVerificationEvidence.packageId,

    issuerId:
      persistedVerificationEvidence.issuerId,

    sequence:
      persistedVerificationEvidence.sequence,

    verifiedControlSigner: {
      issuerId:
        persistedVerifiedSigner.issuerId,

      signingKeyId:
        persistedVerifiedSigner.signingKeyId,

      algorithm:
        persistedVerifiedSigner.algorithm,

      format:
        persistedVerifiedSigner.format,

      publicKey:
        persistedVerifiedSigner.publicKey,

      status:
        persistedVerifiedSigner.status,

      validFrom:
        persistedVerifiedSigner.validFrom,

      ...(
        persistedVerifiedSigner.validUntil ===
          undefined
          ? {}
          : {
              validUntil:
                persistedVerifiedSigner.validUntil,
            }
      ),
    },

    portabilityAuthorityProof:
      structuredClone(
        persistedPortabilityAuthority,
      ),

    verifiedAt:
      persistedVerificationEvidence.verifiedAt,

    schemaVersion:
      1 as const,
  };

  const preparedAt =
    new Date().toISOString();

  const credentialId =
    `FINORA-CREDENTIAL-${randomUUID()}`;

  const transactionId =
    `${FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX}${randomUUID()}`;

  const authStateId =
    `FINORA-PORTABLE-AUTH-STATE-${randomUUID()}`;

  let material;

  try {
    material =
      await createFinoraPortableBranchAuthEnrollmentMaterialV1({
        authStateId,

        sourceAuthorizationId:
          authorization.authorizationId,

        sourceAuthorizationVerificationEvidence,

        ownerId:
          authorization.ownerId,

        businessId:
          authorization.businessId,

        branchId:
          authorization.branchId,

        userId:
          authorization.userId,

        username:
          authorization.username,

        fullName:
          authorization.fullName,

        role:
          authorization.role,

        dataContext:
          authorization.dataContext,

        ...(
          authorization.demoId ===
            undefined
            ? {}
            : {
                demoId:
                  authorization.demoId,
              }
        ),

        storageMode:
          authorization.storageMode,

        authGeneration:
          FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,

        createdAt:
          preparedAt,

        updatedAt:
          preparedAt,

        password:
          input.request.password,

        securityCode:
          input.request.securityCode,
      });
  }
  catch (
    error
  ) {
    return failure(
      "MATERIAL_DERIVATION_FAILED",
      error instanceof Error
        ? error.message
        : "Unable to derive Portable Branch Auth enrollment material.",
    );
  }

  const credential:
    FinoraControlBranchCredential = {
      credentialId,

      sourceAuthorizationId:
        authorization.authorizationId,

      authGeneration:
        FINORA_PORTABLE_BRANCH_AUTH_INITIAL_GENERATION,

      userId:
        authorization.userId,

      username:
        authorization.username,

      canonicalUsername,

      fullName:
        authorization.fullName,

      role:
        authorization.role,

      ownerId:
        authorization.ownerId,

      businessId:
        authorization.businessId,

      branchId:
        authorization.branchId,

      storageMode:
        authorization.storageMode,

      dataContext:
        authorization.dataContext,

      ...(
        authorization.demoId ===
          undefined
          ? {}
          : {
              demoId:
                authorization.demoId,
            }
      ),

      status:
        "ACTIVE",

      verifier:
        toControlCredentialVerifier(
          material.passwordVerifier,
        ),

      securityVerifier:
        toControlCredentialVerifier(
          material.securityVerifier,
        ),

      createdAt:
        preparedAt,

      updatedAt:
        preparedAt,

      schemaVersion:
        1,
    };

  const preparedTransaction:
    FinoraPortableBranchAuthEnrollmentTransactionV1 = {
      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION,

      transactionId,

      sourceAuthorizationId:
        authorization.authorizationId,

      sourceAuthorizationVerificationEvidence:
        structuredClone(
          sourceAuthorizationVerificationEvidence,
        ),

      canonicalUsername,

      ownerId:
        authorization.ownerId,

      businessId:
        authorization.businessId,

      branchId:
        authorization.branchId,

      storageMode:
        authorization.storageMode,

      status:
        "PREPARED",

      credential,

      portableEnvelope:
        material.envelope,

      portableEnvelopeSha256:
        computeFinoraPortableBranchAuthEnvelopeSha256(
          material.envelope,
        ),

      createdAt:
        preparedAt,

      updatedAt:
        preparedAt,
    };

  const prepareResult =
    await prepareFinoraPortableBranchAuthEnrollmentTransaction({
      transaction:
        preparedTransaction,
    });

  if (
    !prepareResult.success ||
    !prepareResult.data
  ) {
    return failure(
      "PREPARE_FAILED",
      prepareResult.error ??
        "Unable to persist PREPARED Portable Branch Auth enrollment transaction.",
    );
  }

  return advanceDurableTransaction(
    prepareResult.data.transaction,
    input.portableStore,
    false,
  );
}

// ============================================================
// PUBLIC COORDINATOR
// ============================================================

export function enrollFinoraPortableBranchAuth(
  input:
    FinoraPortableBranchAuthEnrollmentCoordinatorInput,
): Promise<
  FinoraPortableBranchAuthEnrollmentCoordinatorResult
> {
  const operation =
    portableEnrollmentQueue.then(
      () =>
        enrollFinoraPortableBranchAuthInternal(
          input,
        ),
      () =>
        enrollFinoraPortableBranchAuthInternal(
          input,
        ),
    );

  portableEnrollmentQueue =
    operation.then(
      () =>
        undefined,
      () =>
        undefined,
    );

  return operation;
}

// ============================================================
// END
// ============================================================