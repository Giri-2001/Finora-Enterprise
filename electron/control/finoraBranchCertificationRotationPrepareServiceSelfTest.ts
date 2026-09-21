import assert from "node:assert/strict";

import {
  prepareFinoraBranchCertificationRotation,
} from "./finoraBranchCertificationRotationPrepareService.js";

import type {
  FinoraBranchCertificationRotationPrepareServiceDependencies,
  FinoraBranchCertificationRotationPreparePortableStore,
} from "./finoraBranchCertificationRotationPrepareService.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
  toFinoraBranchCertificationPublicKey,
} from "./finoraBranchCertificationCrypto.js";
import {
  generateFinoraWindowsInstallationBindingMaterial,
  toFinoraWindowsInstallationBindingPublic,
} from "./finoraInstallationBindingCrypto.js";

import type {
  FinoraPortableBranchAuthEnvelopeV1,
  FinoraPortableBranchAuthPayloadV1,
} from "./finoraPortableBranchAuthContract.js";

import type {
  FinoraBranchCertificationRotationPendingRecordV1,
  PersistFinoraBranchCertificationRotationPendingInput,
} from "./finoraBranchCertificationRotationPendingStore.js";

const ownerId =
  "OWNER-PREPARE-TEST";

const businessId =
  "BUSINESS-PREPARE-TEST";

const branchId =
  "BRANCH-PREPARE-TEST";

const userId =
  "USER-PREPARE-TEST";

const username =
  "owner";

const portableFingerprint =
  "a".repeat(
    64,
  );

const nativeBindingMaterial =
  generateFinoraWindowsInstallationBindingMaterial(
    new Date(
      "2026-09-20T07:00:00.000Z",
    ),
  );

const nativeBinding =
  toFinoraWindowsInstallationBindingPublic(
    nativeBindingMaterial,
  );

const nativeFingerprint =
  nativeBinding.publicKeyFingerprint;
const previousMaterial =
  generateFinoraBranchCertificationKeyMaterial(
    new Date(
      "2026-09-20T09:00:00.000Z",
    ),
  );

const previousPublic =
  toFinoraBranchCertificationPublicKey(
    previousMaterial,
  );

const alternatePreviousMaterial =
  generateFinoraBranchCertificationKeyMaterial(
    new Date(
      "2026-09-20T09:01:00.000Z",
    ),
  );

const envelope =
  {} as
    FinoraPortableBranchAuthEnvelopeV1;

function buildPayload():
  FinoraPortableBranchAuthPayloadV1 {

  return {
    schemaVersion:
      1,

    authStateId:
      "AUTH-STATE-PREPARE-TEST",

    sourceAuthorizationId:
      "SOURCE-AUTH-PREPARE-TEST",

    sourceAuthorizationVerificationEvidence:
      {} as never,

    ownerId,

    businessId,

    branchId,

    userId,

    username,

    canonicalUsername:
      username,

    fullName:
      "Owner Prepare Test",

    role:
      "ADMIN",

    dataContext:
      "REAL",

    storageMode:
      "USB",

    passwordVerifier:
      {} as never,

    securityVerifier:
      {} as never,

    authGeneration:
      4,

    createdAt:
      "2026-09-20T08:00:00.000Z",

    updatedAt:
      "2026-09-20T08:30:00.000Z",
  };
}

function buildCompleteTransaction(
  certificationKeyId:
    string,
) {

  return {
    schemaVersion:
      1,

    transactionId:
      "TRANSACTION-" +
      certificationKeyId,

    sourceAuthorizationId:
      "SOURCE-" +
      certificationKeyId,

    sourceAuthorizationVerificationEvidence:
      {},

    canonicalUsername:
      username,

    ownerId,

    businessId,

    branchId,

    storageMode:
      "USB",

    status:
      "COMPLETE",

    branchCertificationProvenance: {
      requestId:
        "ENROLLMENT-REQUEST-" +
        certificationKeyId,

      responseId:
        "ENROLLMENT-RESPONSE-" +
        certificationKeyId,

      certificationKeyId,
    },

    credential:
      {},

    portableEnvelope:
      envelope,

    portableEnvelopeSha256:
      "c".repeat(
        64,
      ),

    createdAt:
      "2026-09-20T08:00:00.000Z",

    updatedAt:
      "2026-09-20T08:10:00.000Z",

    portableWrittenAt:
      "2026-09-20T08:02:00.000Z",

    controlAppliedAt:
      "2026-09-20T08:04:00.000Z",

    certificationMigratedAt:
      "2026-09-20T08:06:00.000Z",

    completedAt:
      "2026-09-20T08:10:00.000Z",
  };
}

function toPendingRecord(
  input:
    PersistFinoraBranchCertificationRotationPendingInput,
):
  FinoraBranchCertificationRotationPendingRecordV1 {

  return {
    state:
      "PENDING_CONTROL_CENTER_APPROVAL",

    requestId:
      input.requestId,

    ownerId:
      input.ownerId,

    businessId:
      input.businessId,

    branchId:
      input.branchId,

    installationId:
      input.installationId,

    bindingKeyId:
      input.bindingKeyId,

    fingerprintAlgorithm:
      input.fingerprintAlgorithm,

    publicKeyFingerprint:
      input.publicKeyFingerprint,

    authStateId:
      input.authStateId,

    authGeneration:
      input.authGeneration,

    portableAuthFingerprintAlgorithm:
      input.portableAuthFingerprintAlgorithm,

    portableAuthFingerprint:
      input.portableAuthFingerprint,

    ...(
      input.previousCertificationKeyId ===
        undefined
        ? {}
        : {
            previousCertificationKeyId:
              input.previousCertificationKeyId,
          }
    ),

    replacementCertificationKeyMaterial:
      {
        ...input.replacementCertificationKeyMaterial,
      },

    recoveryReason:
      input.recoveryReason,

    requestedAt:
      input.requestedAt,

    schemaVersion:
      1,
  };
}

async function run():
  Promise<void> {

  let payload =
    buildPayload();

  let pending:
    FinoraBranchCertificationRotationPendingRecordV1 |
    undefined;

  let persistCount =
    0;

  let requestIdCount =
    0;

  let transactions:
    unknown[] = [
      buildCompleteTransaction(
        previousPublic.keyId,
      ),
      buildCompleteTransaction(
        previousPublic.keyId,
      ),
    ];

  const portableStore:
    FinoraBranchCertificationRotationPreparePortableStore = {

      read:
        async (
          storageMode,
        ) => {

          assert.equal(
            storageMode,
            "USB",
          );

          return envelope;
        },
    };

  const dependencies =
    {
      resolveOperationalSessionContext:
        async () =>
          ({
            success:
              true,

            data: {
              session:
                {},

              principal: {
                authGeneration:
                  4,

                userId,

                username,

                ownerId,

                businessId,

                branchId,

                storageMode:
                  "USB",

                dataContext:
                  "REAL",
              },
            },
          }),

      readControlStore:
        async () =>
          ({
            success:
              true,

            data: {
              portableBranchAuthEnrollmentTransactions:
                transactions,
            },
          }),

      getInstallationBinding:
        async () =>
          ({
            ...nativeBinding,
          }),

      decryptPortableAuth:
        async () =>
          payload,

      createPortableAuthFingerprint:
        () =>
          portableFingerprint,

      generateCertificationKeyMaterial:
        generateFinoraBranchCertificationKeyMaterial,

      toCertificationPublicKey:
        toFinoraBranchCertificationPublicKey,

      loadPending:
        async () =>
          pending,

      persistPending:
        async (
          input:
            PersistFinoraBranchCertificationRotationPendingInput,
        ) => {

          persistCount +=
            1;

          pending =
            toPendingRecord(
              input,
            );

          return pending;
        },

      createRequestId:
        () => {

          requestIdCount +=
            1;

          return (
            "FIN-BCR-REQ-PREPARE-TEST-" +
            requestIdCount
          );
        },

      now:
        () =>
          new Date(
            "2026-09-20T10:00:00.000Z",
          ),
    } as unknown as
      FinoraBranchCertificationRotationPrepareServiceDependencies;

  const first =
    await prepareFinoraBranchCertificationRotation(
      {
        sessionId:
          "SESSION-PREPARE-TEST",

        password:
          "Password-Prepare-Test",

        securityCode:
          "Security-Code-Prepare-Test",
      },
      portableStore,
      dependencies,
    );

  assert.equal(
    first.success,
    true,
  );

  if (!first.success) {
    throw new Error(
      "Expected first Prepare Rotation request to succeed.",
    );
  }

  assert.equal(
    first.data.recoveredExistingPending,
    false,
  );

  assert.equal(
    first.data.previousCertificationKeyId,
    previousPublic.keyId,
  );

  assert.equal(
    first.data.requestFile.request.previousCertificationKeyId,
    previousPublic.keyId,
  );

  assert.equal(
    first.data.requestFile.request.requestId,
    first.data.requestId,
  );

  assert.equal(
    first.data.authGeneration,
    4,
  );

  assert.equal(
    first.data.portableAuthFingerprint,
    portableFingerprint,
  );

  assert.equal(
    JSON.stringify(
      first.data.requestFile,
    ).includes(
      "privateKey",
    ),
    false,
  );

  assert.equal(
    persistCount,
    1,
  );

  assert.equal(
    requestIdCount,
    1,
  );

  console.log(
    "PASS: exact session + Portable Auth + native binding prepared protected replacement custody",
  );

  console.log(
    "PASS: unambiguous durable local certification provenance included as optional keyId",
  );

  console.log(
    "PASS: replacement private key excluded from request/result boundary",
  );

  const repeated =
    await prepareFinoraBranchCertificationRotation(
      {
        sessionId:
          "SESSION-PREPARE-TEST",

        password:
          "Password-Prepare-Test",

        securityCode:
          "Security-Code-Prepare-Test",
      },
      portableStore,
      dependencies,
    );

  assert.equal(
    repeated.success,
    true,
  );

  if (!repeated.success) {
    throw new Error(
      "Expected repeated Prepare Rotation request to succeed.",
    );
  }

  assert.equal(
    repeated.data.recoveredExistingPending,
    true,
  );

  assert.equal(
    repeated.data.requestId,
    first.data.requestId,
  );

  assert.equal(
    persistCount,
    1,
  );

  assert.equal(
    requestIdCount,
    1,
  );

  assert.equal(
    repeated.data.replacementCertificationPublicKey.keyId,
    first.data.replacementCertificationPublicKey.keyId,
  );

  console.log(
    "PASS: exact existing pending custody reused idempotently without fresh key generation",
  );

  pending =
    undefined;

  transactions = [
    buildCompleteTransaction(
      previousPublic.keyId,
    ),
    buildCompleteTransaction(
      alternatePreviousMaterial.keyId,
    ),
  ];

  const ambiguous =
    await prepareFinoraBranchCertificationRotation(
      {
        sessionId:
          "SESSION-PREPARE-TEST",

        password:
          "Password-Prepare-Test",

        securityCode:
          "Security-Code-Prepare-Test",
      },
      portableStore,
      dependencies,
    );

  assert.equal(
    ambiguous.success,
    true,
  );

  if (!ambiguous.success) {
    throw new Error(
      "Expected ambiguous-provenance Prepare Rotation request to succeed without optional keyId.",
    );
  }

  assert.equal(
    ambiguous.data.previousCertificationKeyId,
    undefined,
  );

  assert.equal(
    ambiguous.data.requestFile.request.previousCertificationKeyId,
    undefined,
  );

  console.log(
    "PASS: ambiguous local certification provenance omits optional previous keyId instead of guessing",
  );

  pending =
    undefined;

  const persistBeforeAuthorityPresent =
    persistCount;

  payload = {
    ...buildPayload(),

    branchCertificationKeyMaterial:
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          "2026-09-20T09:30:00.000Z",
        ),
      ),
  };

  const authorityPresent =
    await prepareFinoraBranchCertificationRotation(
      {
        sessionId:
          "SESSION-PREPARE-TEST",

        password:
          "Password-Prepare-Test",

        securityCode:
          "Security-Code-Prepare-Test",
      },
      portableStore,
      dependencies,
    );

  assert.equal(
    authorityPresent.success,
    false,
  );

  if (authorityPresent.success) {
    throw new Error(
      "Expected existing Branch Certification private authority to reject legacy recovery rotation.",
    );
  }

  assert.equal(
    authorityPresent.errorCode,
    "CERTIFICATION_AUTHORITY_PRESENT",
  );

  assert.equal(
    persistCount,
    persistBeforeAuthorityPresent,
  );

  console.log(
    "PASS: existing Portable Branch Certification private authority rejects unnecessary legacy rotation",
  );

  payload =
    buildPayload();

  const authenticationFailureDependencies = {
    ...dependencies,

    decryptPortableAuth:
      async () => {
        throw new Error(
          "INVALID_CREDENTIALS",
        );
      },
  } as unknown as
    FinoraBranchCertificationRotationPrepareServiceDependencies;

  const authenticationFailure =
    await prepareFinoraBranchCertificationRotation(
      {
        sessionId:
          "SESSION-PREPARE-TEST",

        password:
          "Wrong Password",

        securityCode:
          "Wrong Security Code",
      },
      portableStore,
      authenticationFailureDependencies,
    );

  assert.equal(
    authenticationFailure.success,
    false,
  );

  if (authenticationFailure.success) {
    throw new Error(
      "Expected authentication failure.",
    );
  }

  assert.equal(
    authenticationFailure.errorCode,
    "AUTHENTICATION_FAILED",
  );

  console.log(
    "PASS: Password/Security Code decrypt failure is fail-closed before pending custody",
  );

  const mismatchedPayloadDependencies = {
    ...dependencies,

    decryptPortableAuth:
      async () =>
        ({
          ...buildPayload(),

          branchId:
            "OTHER-BRANCH",
        }),
  } as unknown as
    FinoraBranchCertificationRotationPrepareServiceDependencies;

  const scopeMismatch =
    await prepareFinoraBranchCertificationRotation(
      {
        sessionId:
          "SESSION-PREPARE-TEST",

        password:
          "Password-Prepare-Test",

        securityCode:
          "Security-Code-Prepare-Test",
      },
      portableStore,
      mismatchedPayloadDependencies,
    );

  assert.equal(
    scopeMismatch.success,
    false,
  );

  if (scopeMismatch.success) {
    throw new Error(
      "Expected Portable Auth scope mismatch failure.",
    );
  }

  assert.equal(
    scopeMismatch.errorCode,
    "PORTABLE_AUTH_MISMATCH",
  );

  console.log(
    "PASS: wrong Portable Auth branch scope rejected before rotation custody",
  );

  console.log(
    "============================================================",
  );

  console.log(
    "PASS: A5-M18D-B3-B2 OWNER PREPARE ROTATION SERVICE EXECUTABLE PROOF",
  );

  console.log(
    "============================================================",
  );
}

void run();