// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH CONTROL STORE MUTATION SELF-TEST
// VERSION : 1.0
// STATUS  : Executable Proof
// ============================================================

import {
  createFinoraPortableBranchAuthTestSourceAuthorizationEvidence,
} from "./finoraPortableBranchAuthTestEvidence.js";

import {
  app,
} from "electron";

import {
  mkdir,
  mkdtemp,
  rm,
} from "node:fs/promises";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  getFinoraControlCenterPublicIdentity,
} from "../control-center/finoraControlCenterKeyVault.js";

import {
  signFinoraBranchAccessPackage,
} from "../control-center/finoraBranchAccessIssuer.js";

import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchAccessGrantPayload,
  FinoraBranchAccessPackageTarget,
  FinoraBranchCredentialEnrollmentAuthorization,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  applyFinoraPortableBranchAuthEnrollmentControlState,
  completeFinoraPortableBranchAuthEnrollmentTransaction,
  markFinoraPortableBranchAuthEnrollmentCertificationMigrated,
  markFinoraPortableBranchAuthEnrollmentWritten,
  prepareFinoraPortableBranchAuthEnrollmentTransaction,
  readFinoraControlStore,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import type {
  FinoraControlBranchCredential,
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  applyFinoraSignedBranchAccessPackage,
} from "./finoraBranchAccessPackageApplyService.js";

import {
  createFinoraPortableBranchAuthEnvelopeV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX,
  FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION,
  computeFinoraPortableBranchAuthEnvelopeSha256,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";

import type {
  FinoraPortableBranchAuthEnrollmentTransactionV1,
} from "./finoraPortableBranchAuthEnrollmentTransaction.js";

// ============================================================
// HELPERS
// ============================================================

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

function expectSuccess(
  label:
    string,
  result: {
    success:
      boolean;

    error?:
      string;
  },
): void {
  assert(
    result.success,
    result.error ??
      `${label}: expected success.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

function expectFailure(
  label:
    string,
  result: {
    success:
      boolean;

    error?:
      string;
  },
): void {
  assert(
    !result.success,
    `${label}: expected failure.`,
  );

  console.log(
    `PASS: ${label}`,
  );
}

function addDays(
  timestamp:
    string,
  days:
    number,
): string {
  return new Date(
    Date.parse(
      timestamp,
    ) +
      days *
        24 *
        60 *
        60 *
        1000,
  ).toISOString();
}

function cloneJson<T>(
  value:
    T,
): T {
  return JSON.parse(
    JSON.stringify(
      value,
    ),
  ) as T;
}

// ============================================================
// SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  let temporaryUserData:
    string |
    undefined;

  try {
    assert(
      !app.isReady(),
      "Self-test must configure userData before Electron readiness.",
    );

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-portable-auth-mutation-",
        ),
      );

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // ========================================================
    // NATIVE INSTALLATION BINDING
    // ========================================================

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0 &&
      nativeBinding.bindingKeyId.length >
        0 &&
      nativeBinding.publicKeyFingerprint.length >
        0,
      "Native installation binding is incomplete.",
    );

    console.log(
      "PASS: isolated native installation binding created",
    );

    // ========================================================
    // INSTALLATION IDENTITY
    // ========================================================

    const now =
      new Date();

    const issueIssuedAt =
      now.toISOString();

    const createdAt =
      new Date(
        now.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const ownerId =
      "OWNER-PORTABLE-MUTATION-SELFTEST";

    const businessId =
      "BUSINESS-PORTABLE-MUTATION-SELFTEST";

    const branchId =
      "BRANCH-PORTABLE-MUTATION-SELFTEST";

    const userId =
      "USER-PORTABLE-MUTATION-SELFTEST";

    const grantId =
      "GRANT-PORTABLE-MUTATION-SELFTEST";

    const authorizationId =
      "FINORA-CREDENTIAL-ENROLLMENT-USB-ADMIN-SELFTEST";

    const username =
      "admin";

    const password =
      "admin123";

    const securityCode =
      "FINORA-Security@8421";

    const installation:
      FinoraControlInstallationIdentity =
      {
        installationId:
          nativeBinding.installationId,

        ownerId,

        businessId,

        branchId,

        businessCode:
          "PMA01",

        branchCode:
          "P01",

        createdAt,

        updatedAt:
          createdAt,

        schemaVersion:
          1,
      };

    const installationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    expectSuccess(
      "isolated installation identity persisted",
      installationResult,
    );

    // ========================================================
    // TRUST CONTROL CENTER SIGNER
    // ========================================================

    const publicIdentity =
      await getFinoraControlCenterPublicIdentity();

    const trustedKeys:
      FinoraBranchTrustedControlPublicKey[] =
      [
        {
          issuerId:
            publicIdentity.issuerId,

          signingKeyId:
            publicIdentity.signingKeyId,

          algorithm:
            "ECDSA_P256_SHA256",

          format:
            "SPKI_DER_BASE64",

          publicKey:
            publicIdentity.publicKeySpkiDerBase64,

          status:
            "ACTIVE",

          validFrom:
            new Date(
              now.getTime() -
                24 *
                  60 *
                  60 *
                  1000,
            ).toISOString(),
        },
      ];

    const target:
      FinoraBranchAccessPackageTarget =
      {
        ownerId,

        businessId,

        branchId,

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          "SHA-256",

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      };

    // ========================================================
    // ACTIVE REGISTERED USB ACCESS
    // ========================================================

    const validFrom =
      createdAt;

    const validUntil =
      addDays(
        validFrom,
        365,
      );

    const accessGrant:
      FinoraBranchAccessGrantPayload =
      {
        grantId,

        userId,

        ownerId,

        businessId,

        branchId,

        storageMode:
          "USB",

        accessType:
          "REGISTERED",

        administrativeStatus:
          "ACTIVE",

        validity: {
          validFrom,
          validUntil,
        },

        registrationPayment: {
          amount:
            2000,

          currency:
            "INR",

          paymentMode:
            "CASH",

          paidAt:
            validFrom,

          remarks:
            "Portable Auth mutation self-test.",

          refundable:
            false,
        },

        registrationCycle:
          1,

        createdAt,

        updatedAt:
          issueIssuedAt,

        schemaVersion:
          1,
      };

    const issuePackage =
      await signFinoraBranchAccessPackage({
        packageId:
          "PACKAGE-PORTABLE-MUTATION-ISSUE",

        sequence:
          1,

        issuedAt:
          issueIssuedAt,

        target,

        payload: {
          action:
            "ISSUE",

          accessGrant,

          issuedAt:
            issueIssuedAt,

          schemaVersion:
            1,
        },
      });

    const issueResult =
      await applyFinoraSignedBranchAccessPackage(
        issuePackage,
        trustedKeys,
        new Date(
          issueIssuedAt,
        ),
      );

    expectSuccess(
      "signed ISSUE seeded ACTIVE REGISTERED USB access",
      issueResult,
    );

    // ========================================================
    // SIGNED AUTHORIZE_CREDENTIAL
    // ========================================================

    const authorizeIssuedAt =
      new Date(
        now.getTime() +
          1000,
      ).toISOString();

    const credentialAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization =
      {
        authorizationId,

        userId,

        username,

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        ownerId,

        businessId,

        branchId,

        storageMode:
          "USB",

        dataContext:
          "REAL",

        method:
          FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,

        oneTime:
          true,

        schemaVersion:
          1,
      };

    const authorizePackage =
      await signFinoraBranchAccessPackage({
        packageId:
          "PACKAGE-PORTABLE-MUTATION-AUTHORIZE",

        sequence:
          2,

        issuedAt:
          authorizeIssuedAt,

        target,

        payload: {
          action:
            "AUTHORIZE_CREDENTIAL",

          credentialEnrollment:
            credentialAuthorization,

          issuedAt:
            authorizeIssuedAt,

          schemaVersion:
            1,
        },
      });

    const authorizeResult =
      await applyFinoraSignedBranchAccessPackage(
        authorizePackage,
        trustedKeys,
        new Date(
          authorizeIssuedAt,
        ),
      );

    expectSuccess(
      "signed AUTHORIZE_CREDENTIAL persisted pending authority",
      authorizeResult,
    );

    const authorizedStore =
      await readFinoraControlStore();

    assert(
      authorizedStore.success &&
        authorizedStore.data,
      authorizedStore.error ??
        "Unable to read authorized Control Store.",
    );

    assert(
      (
        authorizedStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        1 &&
      (
        authorizedStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        0 &&
      (
        authorizedStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.length ??
        0
      ) ===
        0,
      "Authorized fixture did not start with one authority and zero credential/journal records.",
    );

    console.log(
      "PASS: mutation fixture begins with one pending authority",
    );

    // ========================================================
    // PRE-GENERATE EXACT PORTABLE ENVELOPE + CREDENTIAL
    // ========================================================

    const portableCreatedAt =
      new Date(
        now.getTime() +
          2000,
      ).toISOString();

    const envelope =
      await createFinoraPortableBranchAuthEnvelopeV1({
        authStateId:
          "PORTABLE-MUTATION-AUTH-STATE-000001",

        sourceAuthorizationId:
          "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",

        sourceAuthorizationVerificationEvidence:
          createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
            "FINORA-SOURCE-AUTHORIZATION-SELFTEST-000001",
          ),

        ownerId,

        businessId,

        branchId,

        userId,

        username,

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        dataContext:
          "REAL",

        storageMode:
          "USB",

        authGeneration:
          1,

        createdAt:
          portableCreatedAt,

        updatedAt:
          portableCreatedAt,

        password,

        securityCode,
      });

    const portablePayload =
      await decryptFinoraPortableBranchAuthEnvelopeV1(
        envelope,
        password,
        securityCode,
        {
          expectedScope: {
            ownerId,
            businessId,
            branchId,
          },
        },
      );

    const credential:
      FinoraControlBranchCredential =
      {
        schemaVersion:
          1,

        credentialId:
          "FINORA-CREDENTIAL-PORTABLE-MUTATION-000001",

        sourceAuthorizationId:
          authorizationId,

        userId,

        username,

        canonicalUsername:
          "admin",

        fullName:
          "FINORA Admin",

        role:
          "ADMIN",

        ownerId,

        businessId,

        branchId,

        storageMode:
          "USB",

        dataContext:
          "REAL",

        status:
          "ACTIVE",

        verifier: {
          algorithm:
            portablePayload.passwordVerifier.algorithm,

          saltEncoding:
            "BASE64",

          salt:
            portablePayload.passwordVerifier.salt,

          derivedKeyEncoding:
            "BASE64",

          derivedKey:
            portablePayload.passwordVerifier.verifier,

          keyLength:
            32,

          N:
            portablePayload.passwordVerifier.N,

          r:
            portablePayload.passwordVerifier.r,

          p:
            portablePayload.passwordVerifier.p,
        },

        securityVerifier: {
          algorithm:
            portablePayload.securityVerifier.algorithm,

          saltEncoding:
            "BASE64",

          salt:
            portablePayload.securityVerifier.salt,

          derivedKeyEncoding:
            "BASE64",

          derivedKey:
            portablePayload.securityVerifier.verifier,

          keyLength:
            32,

          N:
            portablePayload.securityVerifier.N,

          r:
            portablePayload.securityVerifier.r,

          p:
            portablePayload.securityVerifier.p,
        },

        createdAt:
          portableCreatedAt,

        updatedAt:
          portableCreatedAt,
      };

    const transaction:
      FinoraPortableBranchAuthEnrollmentTransactionV1 =
      {
        schemaVersion:
          FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_SCHEMA_VERSION,

        transactionId:
          `${FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX}MUTATION-000001`,

        sourceAuthorizationId:
          authorizationId,

        sourceAuthorizationVerificationEvidence:
          createFinoraPortableBranchAuthTestSourceAuthorizationEvidence(
            authorizationId,
          ),

        canonicalUsername:
          "admin",

        ownerId,

        businessId,

        branchId,

        storageMode:
          "USB",

        status:
          "PREPARED",

        branchCertificationProvenance: {
          requestId:
            "FINORA-ENROLLMENT-MUTATION-CERT-000001",

          responseId:
            "FINORA-ENROLLMENT-RESPONSE-MUTATION-CERT-000001",

          certificationKeyId:
            "FINORA-BRANCH-CERT-0123456789ABCDEF0123456789ABCDEF",
        },

        credential,

        portableEnvelope:
          envelope,

        portableEnvelopeSha256:
          computeFinoraPortableBranchAuthEnvelopeSha256(
            envelope,
          ),

        createdAt:
          portableCreatedAt,

        updatedAt:
          portableCreatedAt,
      };

    // ========================================================
    // PREPARED
    // ========================================================

    const prepareResult =
      await prepareFinoraPortableBranchAuthEnrollmentTransaction({
        transaction,
      });

    expectSuccess(
      "PREPARED durable transaction persisted",
      prepareResult,
    );

    const preparedStore =
      await readFinoraControlStore();

    assert(
      preparedStore.success &&
        preparedStore.data,
      preparedStore.error ??
        "Unable to read PREPARED store.",
    );

    assert(
      preparedStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.length ===
        1 &&
      preparedStore.data
        .portableBranchAuthEnrollmentTransactions[
          0
        ].status ===
        "PREPARED" &&
      (
        preparedStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        1 &&
      (
        preparedStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        0,
      "PREPARED persistence changed credential/authorization state.",
    );

    console.log(
      "PASS: PREPARED preserves pending authority and zero credentials",
    );

    // ========================================================
    // SAME PREPARED RETRY
    // ========================================================

    const prepareRetry =
      await prepareFinoraPortableBranchAuthEnrollmentTransaction({
        transaction:
          cloneJson(
            transaction,
          ),
      });

    expectSuccess(
      "same PREPARED retry is idempotent",
      prepareRetry,
    );

    const afterPrepareRetry =
      await readFinoraControlStore();

    assert(
      afterPrepareRetry.success &&
        afterPrepareRetry.data &&
      afterPrepareRetry.data
        .portableBranchAuthEnrollmentTransactions
        ?.length ===
        1,
      "Same PREPARED retry created duplicate journal entries.",
    );

    console.log(
      "PASS: PREPARED retry does not duplicate journal",
    );

    // ========================================================
    // DIFFERENT TRANSACTION FOR SAME AUTHORITY MUST FAIL
    // ========================================================

    const conflictingTransaction =
      cloneJson(
        transaction,
      );

    conflictingTransaction.transactionId =
      `${FINORA_PORTABLE_BRANCH_AUTH_ENROLLMENT_TRANSACTION_ID_PREFIX}MUTATION-CONFLICT`;

    const conflictResult =
      await prepareFinoraPortableBranchAuthEnrollmentTransaction({
        transaction:
          conflictingTransaction,
      });

    expectFailure(
      "same authorization cannot create second durable transaction",
      conflictResult,
    );

    // ========================================================
    // PORTABLE_WRITTEN
    // ========================================================

    const portableWrittenAt =
      new Date(
        now.getTime() +
          3000,
      ).toISOString();

    const writtenResult =
      await markFinoraPortableBranchAuthEnrollmentWritten({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          portableWrittenAt,
      });

    expectSuccess(
      "PREPARED advances to PORTABLE_WRITTEN",
      writtenResult,
    );

    const writtenStore =
      await readFinoraControlStore();

    assert(
      writtenStore.success &&
        writtenStore.data,
      writtenStore.error ??
        "Unable to read PORTABLE_WRITTEN store.",
    );

    assert(
      writtenStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "PORTABLE_WRITTEN" &&
      writtenStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .portableWrittenAt ===
        portableWrittenAt &&
      (
        writtenStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        1 &&
      (
        writtenStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        0,
      "PORTABLE_WRITTEN changed Control credential state prematurely.",
    );

    console.log(
      "PASS: PORTABLE_WRITTEN persists before Control credential mutation",
    );

    // ========================================================
    // PORTABLE_WRITTEN RETRY
    // ========================================================

    const writtenRetry =
      await markFinoraPortableBranchAuthEnrollmentWritten({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date(
            now.getTime() +
              3500,
          ).toISOString(),
      });

    expectSuccess(
      "repeated PORTABLE_WRITTEN transition is idempotent",
      writtenRetry,
    );

    const afterWrittenRetry =
      await readFinoraControlStore();

    assert(
      afterWrittenRetry.success &&
        afterWrittenRetry.data &&
      afterWrittenRetry.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .portableWrittenAt ===
        portableWrittenAt,
      "PORTABLE_WRITTEN retry rewrote durable transition evidence.",
    );

    console.log(
      "PASS: PORTABLE_WRITTEN retry preserves first transition evidence",
    );

    // ========================================================
    // CONTROL_APPLIED FAILURE INJECTION
    //
    // persistControlStorePackage writes:
    // finora-control.bin.tmp -> rename -> finora-control.bin.
    //
    // Making the temporary path a directory forces the write
    // to fail after in-memory mutation but before disk commit.
    // ========================================================

    const controlDirectory =
      join(
        temporaryUserData,
        "FINORA",
        "control",
      );

    const controlTemporaryFile =
      join(
        controlDirectory,
        "finora-control.bin.tmp",
      );

    await rm(
      controlTemporaryFile,
      {
        recursive:
          true,
        force:
          true,
      },
    );

    await mkdir(
      controlTemporaryFile,
      {
        recursive:
          false,
      },
    );

    const controlAppliedAt =
      new Date(
        now.getTime() +
          4000,
      ).toISOString();

    const failedControlApply =
      await applyFinoraPortableBranchAuthEnrollmentControlState({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          controlAppliedAt,
      });

    expectFailure(
      "forced CONTROL_APPLIED persistence failure surfaces failure",
      failedControlApply,
    );

    await rm(
      controlTemporaryFile,
      {
        recursive:
          true,
        force:
          true,
      },
    );

    const afterFailedControlApply =
      await readFinoraControlStore();

    assert(
      afterFailedControlApply.success &&
        afterFailedControlApply.data,
      afterFailedControlApply.error ??
        "Unable to read state after forced Control persistence failure.",
    );

    assert(
      afterFailedControlApply.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "PORTABLE_WRITTEN" &&
      (
        afterFailedControlApply.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        1 &&
      (
        afterFailedControlApply.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        0,
      "Failed CONTROL_APPLIED commit leaked a partial durable mutation.",
    );

    console.log(
      "PASS: failed CONTROL_APPLIED commit leaves journal + authority + credential atomically unchanged",
    );

    // ========================================================
    // CONTROL_APPLIED SUCCESS
    // ========================================================

    const controlApply =
      await applyFinoraPortableBranchAuthEnrollmentControlState({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          controlAppliedAt,
      });

    expectSuccess(
      "PORTABLE_WRITTEN advances to CONTROL_APPLIED",
      controlApply,
    );

    const controlAppliedStore =
      await readFinoraControlStore();

    assert(
      controlAppliedStore.success &&
        controlAppliedStore.data,
      controlAppliedStore.error ??
        "Unable to read CONTROL_APPLIED store.",
    );

    assert(
      controlAppliedStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "CONTROL_APPLIED" &&
      controlAppliedStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .controlAppliedAt ===
        controlAppliedAt &&
      (
        controlAppliedStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        0 &&
      (
        controlAppliedStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        1 &&
      controlAppliedStore.data
        .branchCredentials
        ?.[0]
        .credentialId ===
        credential.credentialId &&
      controlAppliedStore.data
        .branchCredentials
        ?.[0]
        .sourceAuthorizationId ===
        authorizationId,
      "CONTROL_APPLIED did not atomically consume authority and persist exact credential.",
    );

    console.log(
      "PASS: CONTROL_APPLIED atomically adds credential, consumes authority and advances journal",
    );

    // ========================================================
    // CONTROL_APPLIED RETRY AFTER AUTHORIZATION CONSUMPTION
    // ========================================================

    const controlRetry =
      await applyFinoraPortableBranchAuthEnrollmentControlState({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date(
            now.getTime() +
              4500,
          ).toISOString(),
      });

    expectSuccess(
      "CONTROL_APPLIED retry succeeds after authorization consumption",
      controlRetry,
    );

    const afterControlRetry =
      await readFinoraControlStore();

    assert(
      afterControlRetry.success &&
        afterControlRetry.data &&
      (
        afterControlRetry.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        1 &&
      (
        afterControlRetry.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        0 &&
      afterControlRetry.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .controlAppliedAt ===
        controlAppliedAt,
      "CONTROL_APPLIED retry duplicated credential or rewrote first transition evidence.",
    );

    console.log(
      "PASS: CONTROL_APPLIED retry produces no duplicate credential",
    );

    // ========================================================
    // CERTIFICATION-AWARE DIRECT COMPLETE MUST FAIL
    // ========================================================

    const prematureCompleteAt =
      new Date(
        now.getTime() +
          6000,
      ).toISOString();

    const prematureComplete =
      await completeFinoraPortableBranchAuthEnrollmentTransaction({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          prematureCompleteAt,
      });

    expectFailure(
      "certification-aware CONTROL_APPLIED cannot skip durable migration evidence",
      prematureComplete,
    );

    const afterPrematureComplete =
      await readFinoraControlStore();

    assert(
      afterPrematureComplete.success &&
        afterPrematureComplete.data &&
      afterPrematureComplete.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "CONTROL_APPLIED" &&
      afterPrematureComplete.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .certificationMigratedAt ===
        undefined &&
      afterPrematureComplete.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .completedAt ===
        undefined,
      "Rejected certification-aware direct COMPLETE mutated durable journal state.",
    );

    console.log(
      "PASS: rejected direct COMPLETE leaves CONTROL_APPLIED journal unchanged",
    );

    // ========================================================
    // FORCED CERTIFICATION_MIGRATED PERSISTENCE FAILURE
    // ========================================================

    const certificationMigratedAt =
      new Date(
        now.getTime() +
          5000,
      ).toISOString();

    await mkdir(
      controlTemporaryFile,
      {
        recursive:
          false,
      },
    );

    const failedCertificationMigration =
      await markFinoraPortableBranchAuthEnrollmentCertificationMigrated({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          certificationMigratedAt,
      });

    expectFailure(
      "forced CERTIFICATION_MIGRATED persistence failure surfaces failure",
      failedCertificationMigration,
    );

    await rm(
      controlTemporaryFile,
      {
        recursive:
          true,
        force:
          true,
      },
    );

    const afterFailedCertificationMigration =
      await readFinoraControlStore();

    assert(
      afterFailedCertificationMigration.success &&
        afterFailedCertificationMigration.data &&
      afterFailedCertificationMigration.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "CONTROL_APPLIED" &&
      afterFailedCertificationMigration.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .certificationMigratedAt ===
        undefined &&
      (
        afterFailedCertificationMigration.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        0 &&
      (
        afterFailedCertificationMigration.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        1,
      "Failed CERTIFICATION_MIGRATED commit leaked partial durable mutation.",
    );

    console.log(
      "PASS: failed CERTIFICATION_MIGRATED commit leaves journal + credential + consumed authority atomically unchanged",
    );

    // ========================================================
    // CERTIFICATION_MIGRATED SUCCESS
    // ========================================================

    const certificationMigration =
      await markFinoraPortableBranchAuthEnrollmentCertificationMigrated({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          certificationMigratedAt,
      });

    expectSuccess(
      "CONTROL_APPLIED advances to CERTIFICATION_MIGRATED",
      certificationMigration,
    );

    const certificationMigratedStore =
      await readFinoraControlStore();

    assert(
      certificationMigratedStore.success &&
        certificationMigratedStore.data,
      certificationMigratedStore.error ??
        "Unable to read CERTIFICATION_MIGRATED store.",
    );

    const migratedTransaction =
      certificationMigratedStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0];

    assert(
      migratedTransaction?.status ===
        "CERTIFICATION_MIGRATED" &&
      migratedTransaction.certificationMigratedAt ===
        certificationMigratedAt &&
      migratedTransaction.branchCertificationProvenance?.requestId ===
        "FINORA-ENROLLMENT-MUTATION-CERT-000001" &&
      migratedTransaction.branchCertificationProvenance?.responseId ===
        "FINORA-ENROLLMENT-RESPONSE-MUTATION-CERT-000001" &&
      migratedTransaction.branchCertificationProvenance?.certificationKeyId ===
        "FINORA-BRANCH-CERT-0123456789ABCDEF0123456789ABCDEF" &&
      (
        certificationMigratedStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        0 &&
      (
        certificationMigratedStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        1,
      "CERTIFICATION_MIGRATED did not durably preserve exact non-secret provenance and existing Control state.",
    );

    console.log(
      "PASS: CERTIFICATION_MIGRATED durably persists exact provenance without credential or authority mutation",
    );

    // ========================================================
    // CERTIFICATION_MIGRATED RETRY
    // ========================================================

    const certificationMigrationRetry =
      await markFinoraPortableBranchAuthEnrollmentCertificationMigrated({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date(
            now.getTime() +
              5500,
          ).toISOString(),
      });

    expectSuccess(
      "CERTIFICATION_MIGRATED retry is idempotent",
      certificationMigrationRetry,
    );

    const afterCertificationMigrationRetry =
      await readFinoraControlStore();

    assert(
      afterCertificationMigrationRetry.success &&
        afterCertificationMigrationRetry.data &&
      afterCertificationMigrationRetry.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "CERTIFICATION_MIGRATED" &&
      afterCertificationMigrationRetry.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .certificationMigratedAt ===
        certificationMigratedAt &&
      (
        afterCertificationMigrationRetry.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        1 &&
      (
        afterCertificationMigrationRetry.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        0,
      "CERTIFICATION_MIGRATED retry rewrote first evidence or Control state.",
    );

    console.log(
      "PASS: CERTIFICATION_MIGRATED retry preserves first durable migration evidence",
    );

    // ========================================================
    // RECOVERY-STYLE EARLIER TRANSITION RETRIES
    // ========================================================

    const writtenAfterMigration =
      await markFinoraPortableBranchAuthEnrollmentWritten({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date(
            now.getTime() +
              5600,
          ).toISOString(),
      });

    expectSuccess(
      "PORTABLE_WRITTEN retry succeeds after CERTIFICATION_MIGRATED",
      writtenAfterMigration,
    );

    const controlAfterMigration =
      await applyFinoraPortableBranchAuthEnrollmentControlState({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date(
            now.getTime() +
              5700,
          ).toISOString(),
      });

    expectSuccess(
      "CONTROL_APPLIED retry succeeds after CERTIFICATION_MIGRATED",
      controlAfterMigration,
    );

    const afterRecoveryStyleRetries =
      await readFinoraControlStore();

    assert(
      afterRecoveryStyleRetries.success &&
        afterRecoveryStyleRetries.data &&
      afterRecoveryStyleRetries.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "CERTIFICATION_MIGRATED" &&
      afterRecoveryStyleRetries.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .certificationMigratedAt ===
        certificationMigratedAt,
      "Earlier transition retries regressed CERTIFICATION_MIGRATED evidence.",
    );

    console.log(
      "PASS: recovery-style earlier transition retries preserve CERTIFICATION_MIGRATED evidence",
    );

    // ========================================================
    // COMPLETE
    // ========================================================

    const completedAt =
      new Date(
        now.getTime() +
          6000,
      ).toISOString();

    const completeResult =
      await completeFinoraPortableBranchAuthEnrollmentTransaction({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          completedAt,
      });

    expectSuccess(
      "CERTIFICATION_MIGRATED advances to COMPLETE",
      completeResult,
    );

    const completeStore =
      await readFinoraControlStore();

    assert(
      completeStore.success &&
        completeStore.data,
      completeStore.error ??
        "Unable to read COMPLETE store.",
    );

    assert(
      completeStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "COMPLETE" &&
      completeStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .completedAt ===
        completedAt &&
      completeStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .certificationMigratedAt ===
        certificationMigratedAt &&
      completeStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .branchCertificationProvenance
        ?.certificationKeyId ===
        "FINORA-BRANCH-CERT-0123456789ABCDEF0123456789ABCDEF" &&
      (
        completeStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        1 &&
      (
        completeStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        0,
      "COMPLETE state is inconsistent.",
    );

    console.log(
      "PASS: COMPLETE preserves one credential and consumed authority",
    );

    // ========================================================
    // COMPLETE RETRY
    // ========================================================

    const completeRetry =
      await completeFinoraPortableBranchAuthEnrollmentTransaction({
        transactionId:
          transaction.transactionId,

        transitionedAt:
          new Date(
            now.getTime() +
              7000,
          ).toISOString(),
      });

    expectSuccess(
      "repeated COMPLETE transition is idempotent",
      completeRetry,
    );

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
        finalStore.data,
      finalStore.error ??
        "Unable to read final Control Store.",
    );

    assert(
      finalStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.length ===
        1 &&
      finalStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .status ===
        "COMPLETE" &&
      finalStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .completedAt ===
        completedAt &&
      finalStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .certificationMigratedAt ===
        certificationMigratedAt &&
      finalStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0]
        .branchCertificationProvenance
        ?.responseId ===
        "FINORA-ENROLLMENT-RESPONSE-MUTATION-CERT-000001" &&
      (
        finalStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        1 &&
      (
        finalStore.data
          .branchCredentialEnrollmentAuthorizations
          ?.length ??
        0
      ) ===
        0,
      "Final retry changed durable enrollment outcome.",
    );

    console.log(
      "PASS: COMPLETE retry preserves exactly one final outcome",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: PHASE 5.6E3D3D2C ATOMIC PORTABLE AUTH JOURNAL MUTATION EXECUTABLE PROOF",
    );
  }
  finally {
    if (
      temporaryUserData !==
        undefined
    ) {
      await rm(
        temporaryUserData,
        {
          recursive:
            true,
          force:
            true,
        },
      );

      console.log(
        "PASS: isolated mutation self-test userData deleted",
      );
    }
  }
}

void runSelfTest().then(
  () => {
    app.exit(
      0,
    );
  },
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

    if (
      app.isReady()
    ) {
      app.exit(
        1,
      );

      return;
    }

    process.exitCode =
      1;
  },
);

// ============================================================
// END
// ============================================================