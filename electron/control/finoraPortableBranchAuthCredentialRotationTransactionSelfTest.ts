// ============================================================
// FINORA ENTERPRISE OS
// CREDENTIAL ROTATION TRANSACTION SELF-TEST
// ============================================================

import {
  createFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX,
  FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,
  canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction,
  computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256,
  validateFinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

import type {
  FinoraPortableBranchAuthCredentialRotationTransactionV1,
} from "./finoraPortableBranchAuthCredentialRotationTransaction.js";

import type {
  FinoraControlBranchCredential,
} from "./finoraControlStore.js";

function assert(
  condition:
    unknown,
  message:
    string,
): asserts condition {
  if (!condition) {
    throw new Error(
      message,
    );
  }
}

function expectFailure(
  label:
    string,
  action:
    () => void,
): void {
  try {
    action();
  }
  catch {
    console.log(
      `PASS: ${label}`,
    );

    return;
  }

  throw new Error(
    `${label}: expected rejection.`,
  );
}

function clone(
  value:
    FinoraPortableBranchAuthCredentialRotationTransactionV1,
): FinoraPortableBranchAuthCredentialRotationTransactionV1 {
  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as
    FinoraPortableBranchAuthCredentialRotationTransactionV1;
}

async function main():
  Promise<void> {
  const sourceAuthorizationId =
    "FINORA-SOURCE-AUTH-ROTATION-000001";

  const evidence =
    createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
      sourceAuthorizationId,
    );

  const expectedEnvelope =
    await createFinoraPortableBranchAuthEnvelopeV1({
      authStateId:
        "FINORA-PORTABLE-AUTH-ROTATION-STATE-000001",

      sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        evidence,

      ownerId:
        "OWNER-ROTATION-000001",

      businessId:
        "BUSINESS-ROTATION-000001",

      branchId:
        "BRANCH-ROTATION-000001",

      userId:
        "USER-ROTATION-000001",

      username:
        "admin",

      fullName:
        "FINORA Admin",

      role:
        "ADMIN",

      dataContext:
        "REAL",

      storageMode:
        "LOCAL",

      authGeneration:
        1,

      createdAt:
        "2026-09-13T03:00:00.000Z",

      updatedAt:
        "2026-09-13T03:00:00.000Z",

      password:
        "Old-Password-123",

      securityCode:
        "Old-Security-Code-9876",
    });

  const replacementEnvelope =
    await createFinoraPortableBranchAuthEnvelopeV1({
      authStateId:
        "FINORA-PORTABLE-AUTH-ROTATION-STATE-000001",

      sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        evidence,

      ownerId:
        "OWNER-ROTATION-000001",

      businessId:
        "BUSINESS-ROTATION-000001",

      branchId:
        "BRANCH-ROTATION-000001",

      userId:
        "USER-ROTATION-000001",

      username:
        "admin",

      fullName:
        "FINORA Admin",

      role:
        "ADMIN",

      dataContext:
        "REAL",

      storageMode:
        "LOCAL",

      authGeneration:
        2,

      createdAt:
        "2026-09-13T03:00:00.000Z",

      updatedAt:
        "2026-09-13T03:01:00.000Z",

      password:
        "New-Password-456",

      securityCode:
        "New-Security-Code-6543",
    });

  const expectedCredential:
    FinoraControlBranchCredential = {
      schemaVersion:
        1,

      credentialId:
        "FINORA-CREDENTIAL-ROTATION-000001",

      sourceAuthorizationId,

      authGeneration:
        1,

      userId:
        "USER-ROTATION-000001",

      username:
        "admin",

      canonicalUsername:
        "admin",

      fullName:
        "FINORA Admin",

      role:
        "ADMIN",

      ownerId:
        "OWNER-ROTATION-000001",

      businessId:
        "BUSINESS-ROTATION-000001",

      branchId:
        "BRANCH-ROTATION-000001",

      storageMode:
        "LOCAL",

      dataContext:
        "REAL",

      status:
        "ACTIVE",

      verifier: {
        algorithm:
          "SCRYPT",

        saltEncoding:
          "BASE64",

        salt:
          "AAAAAAAAAAAAAAAAAAAAAA==",

        derivedKeyEncoding:
          "BASE64",

        derivedKey:
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",

        keyLength:
          32,

        N:
          32768,

        r:
          8,

        p:
          1,
      },

      securityVerifier: {
        algorithm:
          "SCRYPT",

        saltEncoding:
          "BASE64",

        salt:
          "AQEBAQEBAQEBAQEBAQEBAQ==",

        derivedKeyEncoding:
          "BASE64",

        derivedKey:
          "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",

        keyLength:
          32,

        N:
          32768,

        r:
          8,

        p:
          1,
      },

      createdAt:
        "2026-09-13T02:00:00.000Z",

      updatedAt:
        "2026-09-13T02:00:00.000Z",
    };

  const replacementCredential:
    FinoraControlBranchCredential = {
      ...expectedCredential,

      authGeneration:
        2,

      verifier: {
        ...expectedCredential.verifier,

        salt:
          "AgICAgICAgICAgICAgICAg==",

        derivedKey:
          "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI=",
      },

      securityVerifier: {
        ...expectedCredential.securityVerifier!,

        salt:
          "AwMDAwMDAwMDAwMDAwMDAw==",

        derivedKey:
          "AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM=",
      },

      updatedAt:
        "2026-09-13T03:01:00.000Z",
    };

  const prepared:
    FinoraPortableBranchAuthCredentialRotationTransactionV1 = {
      schemaVersion:
        FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_SCHEMA_VERSION,

      transactionId:
        `${FINORA_PORTABLE_BRANCH_AUTH_CREDENTIAL_ROTATION_TRANSACTION_ID_PREFIX}SELFTEST-000001`,

      sourceAuthorizationId,

      sourceAuthorizationVerificationEvidence:
        evidence,

      credentialId:
        expectedCredential.credentialId,

      userId:
        expectedCredential.userId,

      canonicalUsername:
        expectedCredential.canonicalUsername,

      ownerId:
        expectedCredential.ownerId,

      businessId:
        expectedCredential.businessId,

      branchId:
        expectedCredential.branchId,

      storageMode:
        expectedCredential.storageMode,

      dataContext:
        expectedCredential.dataContext,

      currentGeneration:
        1,

      targetGeneration:
        2,

      expectedCredential,

      replacementCredential,

      expectedPortableEnvelope:
        expectedEnvelope,

      expectedPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
          expectedEnvelope,
        ),

      replacementPortableEnvelope:
        replacementEnvelope,

      replacementPortableEnvelopeSha256:
        computeFinoraPortableBranchAuthCredentialRotationEnvelopeSha256(
          replacementEnvelope,
        ),

      status:
        "PREPARED",

      createdAt:
        "2026-09-13T03:01:00.000Z",

      updatedAt:
        "2026-09-13T03:01:00.000Z",
    };

  validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
    prepared,
  );

  console.log(
    "PASS: valid PREPARED generation 1 -> 2 rotation transaction",
  );

  const portableReplaced =
    clone(
      prepared,
    );

  portableReplaced.status =
    "PORTABLE_REPLACED";

  portableReplaced.portableReplacedAt =
    "2026-09-13T03:02:00.000Z";

  portableReplaced.updatedAt =
    "2026-09-13T03:02:00.000Z";

  validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
    portableReplaced,
  );

  console.log(
    "PASS: valid PORTABLE_REPLACED transaction",
  );

  const controlApplied =
    clone(
      portableReplaced,
    );

  controlApplied.status =
    "CONTROL_APPLIED";

  controlApplied.controlAppliedAt =
    "2026-09-13T03:03:00.000Z";

  controlApplied.updatedAt =
    "2026-09-13T03:03:00.000Z";

  validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
    controlApplied,
  );

  console.log(
    "PASS: valid CONTROL_APPLIED transaction",
  );

  const complete =
    clone(
      controlApplied,
    );

  complete.status =
    "COMPLETE";

  complete.completedAt =
    "2026-09-13T03:04:00.000Z";

  complete.updatedAt =
    "2026-09-13T03:04:00.000Z";

  validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
    complete,
  );

  console.log(
    "PASS: valid COMPLETE transaction",
  );

  assert(
    canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction(
      "PREPARED",
      "PORTABLE_REPLACED",
    ),
    "PREPARED -> PORTABLE_REPLACED transition rejected.",
  );

  assert(
    canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction(
      "PORTABLE_REPLACED",
      "CONTROL_APPLIED",
    ),
    "PORTABLE_REPLACED -> CONTROL_APPLIED transition rejected.",
  );

  assert(
    canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction(
      "CONTROL_APPLIED",
      "COMPLETE",
    ),
    "CONTROL_APPLIED -> COMPLETE transition rejected.",
  );

  assert(
    !canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction(
      "PREPARED",
      "CONTROL_APPLIED",
    ) &&
    !canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction(
      "PREPARED",
      "COMPLETE",
    ) &&
    !canAdvanceFinoraPortableBranchAuthCredentialRotationTransaction(
      "PORTABLE_REPLACED",
      "COMPLETE",
    ),
    "Illegal rotation transition was accepted.",
  );

  console.log(
    "PASS: rotation state machine permits only sequential transitions",
  );

  const sameGeneration =
    clone(
      prepared,
    );

  sameGeneration.targetGeneration =
    1;

  sameGeneration.replacementCredential.authGeneration =
    1;

  expectFailure(
    "same generation rejected",
    () =>
      validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
        sameGeneration,
      ),
  );

  const skippedGeneration =
    clone(
      prepared,
    );

  skippedGeneration.targetGeneration =
    3;

  skippedGeneration.replacementCredential.authGeneration =
    3;

  expectFailure(
    "generation skip rejected",
    () =>
      validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
        skippedGeneration,
      ),
  );

  const rollbackGeneration =
    clone(
      prepared,
    );

  rollbackGeneration.currentGeneration =
    2;

  rollbackGeneration.targetGeneration =
    1;

  rollbackGeneration.expectedCredential.authGeneration =
    2;

  rollbackGeneration.replacementCredential.authGeneration =
    1;

  expectFailure(
    "generation rollback rejected",
    () =>
      validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
        rollbackGeneration,
      ),
  );

  const wrongReplacementGeneration =
    clone(
      prepared,
    );

  wrongReplacementGeneration.replacementCredential.authGeneration =
    9;

  expectFailure(
    "replacement credential generation mismatch rejected",
    () =>
      validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
        wrongReplacementGeneration,
      ),
  );

  const identityDrift =
    clone(
      prepared,
    );

  identityDrift.replacementCredential.branchId =
    "OTHER-BRANCH";

  expectFailure(
    "immutable credential identity drift rejected",
    () =>
      validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
        identityDrift,
      ),
  );

  const noVerifierRotation =
    clone(
      prepared,
    );

  noVerifierRotation.replacementCredential.verifier =
    JSON.parse(
      JSON.stringify(
        noVerifierRotation.expectedCredential.verifier,
      ),
    );

  noVerifierRotation.replacementCredential.securityVerifier =
    JSON.parse(
      JSON.stringify(
        noVerifierRotation.expectedCredential.securityVerifier,
      ),
    );

  expectFailure(
    "generation-only mutation without verifier rotation rejected",
    () =>
      validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
        noVerifierRotation,
      ),
  );

  const badExpectedDigest =
    clone(
      prepared,
    );

  badExpectedDigest.expectedPortableEnvelopeSha256 =
    "0".repeat(
      64,
    );

  expectFailure(
    "expected envelope digest tamper rejected",
    () =>
      validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
        badExpectedDigest,
      ),
  );

  const badReplacementDigest =
    clone(
      prepared,
    );

  badReplacementDigest.replacementPortableEnvelopeSha256 =
    "f".repeat(
      64,
    );

  expectFailure(
    "replacement envelope digest tamper rejected",
    () =>
      validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
        badReplacementDigest,
      ),
  );

  const illegalPreparedTimestamp =
    clone(
      prepared,
    );

  illegalPreparedTimestamp.portableReplacedAt =
    "2026-09-13T03:02:00.000Z";

  expectFailure(
    "PREPARED later-state timestamp rejected",
    () =>
      validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
        illegalPreparedTimestamp,
      ),
  );

  const legacyExpectedCredential =
    clone(
      prepared,
    );

  delete legacyExpectedCredential.expectedCredential.authGeneration;

  validateFinoraPortableBranchAuthCredentialRotationTransactionV1(
    legacyExpectedCredential,
  );

  console.log(
    "PASS: legacy missing expected authGeneration normalizes to initial generation 1",
  );

  console.log(
    "",
  );

  console.log(
    "PASS: D4E4I8-B4.3 CREDENTIAL ROTATION TRANSACTION CONTRACT EXECUTABLE PROOF",
  );
}

void main().catch(
  (
    error,
  ) => {
    console.error(
      "",
    );

    console.error(
      "SELF-TEST FAILED",
    );

    console.error(
      error,
    );

    process.exitCode =
      1;
  },
);