// ============================================================
// FINORA ENTERPRISE OS
// PORTABLE BRANCH AUTH ENROLLMENT COORDINATOR SELF-TEST
// VERSION : 1.0
// STATUS  : Executable Proof
// ============================================================

import {
  app,
  safeStorage,
} from "electron";

import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
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
  issueFinoraBranchCredentialEnrollmentBundle,
} from "../control-center/finoraBranchCredentialEnrollmentBundleIssuer.js";

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
  isFinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

import {
  enrollFinoraPortableBranchAuth,
} from "./finoraPortableBranchAuthEnrollmentCoordinator.js";

import {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

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

/**
 * SELF-TEST ONLY.
 *
 * Deliberately bypasses production persistence validation so this
 * isolated executable proof can inject corrupted / incomplete
 * encrypted Control Store fixtures and prove fail-closed behavior.
 *
 * No production API exposes this capability.
 */
function getRawControlStoreFixtureFile(): string {
  return join(
    app.getPath(
      "userData",
    ),
    "FINORA",
    "control",
    "finora-control.bin",
  );
}

async function persistRawControlStoreFixture(
  value:
    unknown,
): Promise<void> {

  const controlFile =
    getRawControlStoreFixtureFile();

  const controlDirectory =
    join(
      app.getPath(
        "userData",
      ),
      "FINORA",
      "control",
    );

  const temporaryFile =
    `${controlFile}.i6-c4.tmp`;

  await mkdir(
    controlDirectory,
    {
      recursive:
        true,
      mode:
        0o700,
    },
  );

  const plainText =
    JSON.stringify(
      value,
    );

  let encrypted:
    Buffer;

  if (
    await safeStorage.isAsyncEncryptionAvailable()
  ) {
    encrypted =
      await safeStorage.encryptStringAsync(
        plainText,
      );
  }
  else if (
    safeStorage.isEncryptionAvailable()
  ) {
    encrypted =
      safeStorage.encryptString(
        plainText,
      );
  }
  else {
    throw new Error(
      "Secure operating-system encryption is unavailable for the I6-C4 Control Store fixture.",
    );
  }

  await writeFile(
    temporaryFile,
    encrypted,
    {
      mode:
        0o600,
    },
  );

  await rename(
    temporaryFile,
    controlFile,
  );
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

    const portabilityFixtureBundle =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,

        sourceAuthorization:
          credentialAuthorization,
      });

    const portabilityFixturePackage =
      portabilityFixtureBundle.branchPortabilityAuthorityPackage;

    const portabilityVerifiedSigner =
      trustedKeys[0];

    assert(
      portabilityVerifiedSigner !==
        undefined,
      "Trusted Control Center signer fixture is missing.",
    );

    console.log(
      "PASS: real signed portability authority fixture prepared for I6 portability proof",
    );

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

    const authorizeVerificationNow =
      new Date(
        authorizeIssuedAt,
      );

    const credentialPortabilityAuthorityProvenanceCandidate:
      unknown = {
        sourceAuthorizationId:
          authorizationId,

        signedPortabilityAuthorityPackage:
          portabilityFixturePackage,

        verifiedControlSigner:
          structuredClone(
            portabilityVerifiedSigner,
          ),

        verifiedAt:
          authorizeVerificationNow.toISOString(),

        schemaVersion:
          1 as const,
      };

    if (
      !isFinoraBranchCredentialPortabilityAuthorityProvenanceV1(
        credentialPortabilityAuthorityProvenanceCandidate,
      )
    ) {
      throw new Error(
        "Real signed portability authority fixture did not narrow to valid I5C provenance.",
      );
    }

    const credentialPortabilityAuthorityProvenance =
      credentialPortabilityAuthorityProvenanceCandidate;

    console.log(
      "PASS: real signed portability authority narrowed through authoritative I5C provenance validator",
    );

    const authorizeResult =
      await applyFinoraSignedBranchAccessPackage(
        authorizePackage,
        trustedKeys,
        authorizeVerificationNow,
        credentialPortabilityAuthorityProvenance,
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

    const persistedPortabilityAuthority =
      authorizedStore.data.branchCredentialPortabilityAuthorities
        ?.find(
          (
            item,
          ) =>
            item.sourceAuthorizationId ===
              authorizationId,
        );

    assert(
      persistedPortabilityAuthority !==
        undefined &&
      persistedPortabilityAuthority.signedPortabilityAuthorityPackage.packageId ===
        portabilityFixturePackage.packageId &&
      persistedPortabilityAuthority.verifiedControlSigner.issuerId ===
        portabilityVerifiedSigner.issuerId &&
      persistedPortabilityAuthority.verifiedControlSigner.signingKeyId ===
        portabilityVerifiedSigner.signingKeyId &&
      persistedPortabilityAuthority.verifiedControlSigner.publicKey ===
        portabilityVerifiedSigner.publicKey &&
      persistedPortabilityAuthority.verifiedAt ===
        authorizeVerificationNow.toISOString(),
      "Pending authorization did not persist the exact I5C portability provenance.",
    );

    console.log(
      "PASS: pending authorization carries exact reusable I5C portability provenance",
    );

    // ========================================================
    // COORDINATOR FIXTURE
    //
    // Use the exact signed USB authority created above.
    //
    // First call intentionally sees USB disconnected. This must
    // leave one durable PREPARED transaction and must not consume
    // signed authority or add a credential.
    // ========================================================

    const portableUsbRoot =
      join(
        app.getPath(
          "userData",
        ),
        "portable-usb",
      );

    await mkdir(
      portableUsbRoot,
      {
        recursive:
          true,
      },
    );

    let usbConnected =
      false;

    let usbResolverCalls =
      0;

    let localResolverCalls =
      0;

    const portableStore =
      new FinoraPortableBranchAuthStore({
        resolveLocalRoot:
          () => {
            localResolverCalls +=
              1;

            return join(
              app.getPath(
                "userData",
              ),
              "portable-local",
            );
          },

        resolveUsbRoot:
          async () => {
            usbResolverCalls +=
              1;

            return usbConnected
              ? portableUsbRoot
              : null;
          },
      });

    // ========================================================
    // I6-C4 FAIL-CLOSED PORTABILITY PROOF MATRIX
    //
    // These raw writes are TEST-ONLY corruption / incomplete
    // state injection inside isolated Electron userData.
    //
    // Production persistence continues to validate normally.
    // ========================================================

    const validAuthorizedStoreSnapshot =
      structuredClone(
        authorizedStore.data,
      );

    const validAuthorizedStoreJson =
      JSON.stringify(
        validAuthorizedStoreSnapshot,
      );

    const rawControlFile =
      getRawControlStoreFixtureFile();

    // --------------------------------------------------------
    // CASE 1 — MISSING PORTABILITY PROVENANCE
    // --------------------------------------------------------

    const missingProofStore =
      structuredClone(
        validAuthorizedStoreSnapshot,
      );

    missingProofStore.branchCredentialPortabilityAuthorities =
      [];

    await persistRawControlStoreFixture(
      missingProofStore,
    );

    const missingProofBefore =
      await readFinoraControlStore();

    assert(
      missingProofBefore.success &&
        missingProofBefore.data,
      missingProofBefore.error ??
        "Missing-proof fixture was not structurally readable.",
    );

    assert(
      (
        missingProofBefore.data
          .portableBranchAuthEnrollmentTransactions
          ?.length ??
        0
      ) ===
        0,
      "Missing-proof fixture unexpectedly started with a Portable Auth journal.",
    );

    const missingProofBeforeJson =
      JSON.stringify(
        missingProofBefore.data,
      );

    const missingProofBytesBefore =
      await readFile(
        rawControlFile,
      );

    const missingProofResult =
      await enrollFinoraPortableBranchAuth({
        request: {
          username,
          password,
          securityCode,
        },

        portableStore,
      });

    assert(
      !missingProofResult.success &&
        missingProofResult.errorCode ===
          "AUTHORIZATION_NOT_FOUND" &&
        missingProofResult.error.includes(
          "portability authority proof is missing",
        ),
      missingProofResult.success
        ? "C4 missing portability provenance unexpectedly succeeded."
        : `Unexpected missing-proof result: ${missingProofResult.errorCode}: ${missingProofResult.error}`,
    );

    const missingProofAfter =
      await readFinoraControlStore();

    assert(
      missingProofAfter.success &&
        missingProofAfter.data &&
      JSON.stringify(
        missingProofAfter.data,
      ) ===
        missingProofBeforeJson &&
      (
        missingProofAfter.data
          .portableBranchAuthEnrollmentTransactions
          ?.length ??
        0
      ) ===
        0,
      "Missing portability provenance changed durable Control Store state.",
    );

    const missingProofBytesAfter =
      await readFile(
        rawControlFile,
      );

    assert(
      missingProofBytesBefore.equals(
        missingProofBytesAfter,
      ),
      "Missing portability provenance rewrote encrypted Control Store bytes.",
    );

    assert(
      usbResolverCalls ===
        0 &&
      localResolverCalls ===
        0,
      "Missing portability provenance reached portable storage resolution.",
    );

    console.log(
      "PASS: C4 missing portability provenance rejected pre-PREPARED with whole Control Store unchanged",
    );

    // Restore exact valid authoritative baseline.
    await persistRawControlStoreFixture(
      validAuthorizedStoreSnapshot,
    );

    // --------------------------------------------------------
    // CASE 2 — CROSS-RECORD VERIFICATION / PROVENANCE MISMATCH
    //
    // Keep each record structurally valid, but make the source
    // Branch Access verification timestamp disagree with the
    // portability provenance verifiedAt.
    // --------------------------------------------------------

    const mismatchedProofStore =
      structuredClone(
        validAuthorizedStoreSnapshot,
      );

    const mismatchedVerificationEvidence =
      mismatchedProofStore
        .branchCredentialAuthorizationVerificationEvidence
        ?.find(
          (
            item,
          ) =>
            item.authorizationId ===
              authorizationId,
        );

    assert(
      mismatchedVerificationEvidence !==
        undefined,
      "C4 mismatch fixture source verification evidence is missing.",
    );

    mismatchedVerificationEvidence.verifiedAt =
      new Date(
        new Date(
          mismatchedVerificationEvidence.verifiedAt,
        ).getTime() +
          1000,
      ).toISOString();

    await persistRawControlStoreFixture(
      mismatchedProofStore,
    );

    const mismatchBefore =
      await readFinoraControlStore();

    assert(
      mismatchBefore.success &&
        mismatchBefore.data,
      mismatchBefore.error ??
        "Cross-record mismatch fixture was not structurally readable.",
    );

    const mismatchBeforeJson =
      JSON.stringify(
        mismatchBefore.data,
      );

    const mismatchBytesBefore =
      await readFile(
        rawControlFile,
      );

    const mismatchResult =
      await enrollFinoraPortableBranchAuth({
        request: {
          username,
          password,
          securityCode,
        },

        portableStore,
      });

    assert(
      !mismatchResult.success &&
        mismatchResult.errorCode ===
          "AUTHORIZATION_NOT_FOUND" &&
        mismatchResult.error.includes(
          "does not match the exact source authorization lineage and verified signer",
        ),
      mismatchResult.success
        ? "C4 mismatched portability provenance unexpectedly succeeded."
        : `Unexpected mismatched-proof result: ${mismatchResult.errorCode}: ${mismatchResult.error}`,
    );

    const mismatchAfter =
      await readFinoraControlStore();

    assert(
      mismatchAfter.success &&
        mismatchAfter.data &&
      JSON.stringify(
        mismatchAfter.data,
      ) ===
        mismatchBeforeJson &&
      (
        mismatchAfter.data
          .portableBranchAuthEnrollmentTransactions
          ?.length ??
        0
      ) ===
        0,
      "Mismatched portability provenance changed durable Control Store state.",
    );

    const mismatchBytesAfter =
      await readFile(
        rawControlFile,
      );

    assert(
      mismatchBytesBefore.equals(
        mismatchBytesAfter,
      ),
      "Mismatched portability provenance rewrote encrypted Control Store bytes.",
    );

    assert(
      usbResolverCalls ===
        0 &&
      localResolverCalls ===
        0,
      "Mismatched portability provenance reached portable storage resolution.",
    );

    console.log(
      "PASS: C4 cross-record portability signer/lineage mismatch rejected pre-PREPARED with whole Control Store unchanged",
    );

    // Restore exact valid authoritative baseline.
    await persistRawControlStoreFixture(
      validAuthorizedStoreSnapshot,
    );

    // --------------------------------------------------------
    // CASE 3 — AMBIGUOUS / DUPLICATE PORTABILITY PROVENANCE
    //
    // Production APIs cannot create this state: the Control
    // Store duplicate guard rejects it.
    //
    // Inject encrypted corruption directly and prove the
    // authoritative reader rejects it before coordinator use.
    // --------------------------------------------------------

    const ambiguousProofStore =
      structuredClone(
        validAuthorizedStoreSnapshot,
      );

    assert(
      persistedPortabilityAuthority !==
        undefined,
      "C4 ambiguous fixture portability provenance is missing.",
    );

    ambiguousProofStore.branchCredentialPortabilityAuthorities =
      [
        structuredClone(
          persistedPortabilityAuthority,
        ),
        structuredClone(
          persistedPortabilityAuthority,
        ),
      ];

    await persistRawControlStoreFixture(
      ambiguousProofStore,
    );

    const ambiguousBytesBefore =
      await readFile(
        rawControlFile,
      );

    const ambiguousRead =
      await readFinoraControlStore();

    const ambiguousReadError =
      ambiguousRead.success
        ? undefined
        : ambiguousRead.error;

    assert(
      !ambiguousRead.success &&
        typeof ambiguousReadError ===
          "string" &&
        ambiguousReadError.includes(
          "package validation failed",
        ),
      ambiguousRead.success
        ? "Duplicate portability provenance unexpectedly passed authoritative Control Store validation."
        : `Unexpected ambiguous-store read failure: ${ambiguousReadError ?? "<missing error>"}`,
    );

    const ambiguousCoordinatorResult =
      await enrollFinoraPortableBranchAuth({
        request: {
          username,
          password,
          securityCode,
        },

        portableStore,
      });

    assert(
      !ambiguousCoordinatorResult.success,
      "Coordinator unexpectedly consumed duplicate / ambiguous portability provenance.",
    );

    const ambiguousBytesAfter =
      await readFile(
        rawControlFile,
      );

    assert(
      ambiguousBytesBefore.equals(
        ambiguousBytesAfter,
      ),
      "Ambiguous portability corruption was rewritten during fail-closed handling.",
    );

    assert(
      usbResolverCalls ===
        0 &&
      localResolverCalls ===
        0,
      "Ambiguous portability corruption reached portable storage resolution.",
    );

    console.log(
      "PASS: C4 duplicate portability provenance rejected by authoritative Control Store validation before coordinator consumption",
    );

    // --------------------------------------------------------
    // RESTORE VALID BASELINE AND PROVE ZERO NEGATIVE RESIDUE
    // --------------------------------------------------------

    await persistRawControlStoreFixture(
      validAuthorizedStoreSnapshot,
    );

    const restoredAuthorizedStore =
      await readFinoraControlStore();

    assert(
      restoredAuthorizedStore.success &&
        restoredAuthorizedStore.data &&
      JSON.stringify(
        restoredAuthorizedStore.data,
      ) ===
        validAuthorizedStoreJson &&
      (
        restoredAuthorizedStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.length ??
        0
      ) ===
        0,
      "C4 negative matrix did not restore the exact valid pre-enrollment Control Store baseline.",
    );

    assert(
      usbResolverCalls ===
        0 &&
      localResolverCalls ===
        0,
      "C4 fail-closed matrix touched portable storage before positive enrollment.",
    );

    console.log(
      "PASS: C4 fail-closed matrix left zero PREPARED journal, zero credential mutation and zero portable-storage access",
    );

    // ========================================================
    // FRESH PATH -> PREPARED -> USB FAILURE
    // ========================================================

    const disconnectedResult =
      await enrollFinoraPortableBranchAuth({
        request: {
          username,

          password,

          securityCode,
        },

        portableStore,
      });

    assert(
      !disconnectedResult.success &&
        disconnectedResult.errorCode ===
          "PORTABLE_STORAGE_FAILED",
      disconnectedResult.success
        ? "Disconnected USB enrollment unexpectedly succeeded."
        : `Unexpected disconnected result: ${disconnectedResult.errorCode}: ${disconnectedResult.error}`,
    );

    console.log(
      "PASS: fresh coordinator path fails closed when authorized USB is disconnected",
    );

    const preparedStore =
      await readFinoraControlStore();

    assert(
      preparedStore.success &&
        preparedStore.data,
      preparedStore.error ??
        "Unable to read PREPARED coordinator state.",
    );

    const preparedTransactions =
      preparedStore.data
        .portableBranchAuthEnrollmentTransactions ??
      [];

    assert(
      preparedTransactions.length ===
        1 &&
        preparedTransactions[0].status ===
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
      "USB failure did not preserve PREPARED + pending authority + zero credential state.",
    );

    const preparedTransaction =
      preparedTransactions[0];

    const preparedPortabilityProof =
      preparedTransaction
        .sourceAuthorizationVerificationEvidence
        .portabilityAuthorityProof;

    assert(
      preparedPortabilityProof !==
        undefined &&
      JSON.stringify(
        preparedPortabilityProof,
      ) ===
        JSON.stringify(
          persistedPortabilityAuthority,
        ) &&
      preparedPortabilityProof.signedPortabilityAuthorityPackage.packageId ===
        portabilityFixturePackage.packageId &&
      preparedPortabilityProof.sourceAuthorizationId ===
        authorizationId,
      "PREPARED transaction did not snapshot the exact persisted portability proof.",
    );

    console.log(
      "PASS: PREPARED transaction snapshots exact I6 portability authority proof",
    );

    const preparedTransactionId =
      preparedTransaction.transactionId;

    const preparedCredentialId =
      preparedTransaction.credential.credentialId;

    const preparedEnvelopeSnapshot =
      JSON.stringify(
        preparedTransaction.portableEnvelope,
      );

    const preparedPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV1(
        preparedTransaction.portableEnvelope,
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

    const encryptedPortabilityProof =
      preparedPayload
        .sourceAuthorizationVerificationEvidence
        .portabilityAuthorityProof;

    assert(
      encryptedPortabilityProof !==
        undefined &&
      JSON.stringify(
        encryptedPortabilityProof,
      ) ===
        JSON.stringify(
          preparedPortabilityProof,
        ) &&
      encryptedPortabilityProof.signedPortabilityAuthorityPackage.packageId ===
        portabilityFixturePackage.packageId &&
      encryptedPortabilityProof.signedPortabilityAuthorityPackage.payload.sourceAuthorizationId ===
        authorizationId &&
      encryptedPortabilityProof.verifiedControlSigner.issuerId ===
        portabilityVerifiedSigner.issuerId &&
      encryptedPortabilityProof.verifiedControlSigner.signingKeyId ===
        portabilityVerifiedSigner.signingKeyId &&
      encryptedPortabilityProof.verifiedControlSigner.publicKey ===
        portabilityVerifiedSigner.publicKey &&
      encryptedPortabilityProof.verifiedAt ===
        authorizeVerificationNow.toISOString(),
      "Encrypted Portable Branch Auth did not preserve exact signed portability package + signer evidence.",
    );

    console.log(
      "PASS: encrypted Portable Auth preserves exact signed portability package + signer evidence",
    );

    console.log(
      "PASS: fresh coordinator persists PREPARED before portable storage mutation",
    );

    // ========================================================
    // WRONG RECOVERY FACTORS MUST FAIL BEFORE STORAGE MUTATION
    // ========================================================

    const wrongRecoveryResult =
      await enrollFinoraPortableBranchAuth({
        request: {
          username,

          password:
            `${password}-WRONG`,

          securityCode,
        },

        portableStore,
      });

    assert(
      !wrongRecoveryResult.success &&
        wrongRecoveryResult.errorCode ===
          "RECOVERY_CREDENTIALS_INVALID",
      wrongRecoveryResult.success
        ? "Wrong recovery factors unexpectedly succeeded."
        : `Unexpected wrong-factor result: ${wrongRecoveryResult.errorCode}: ${wrongRecoveryResult.error}`,
    );

    console.log(
      "PASS: wrong recovery factors fail closed against prepared encrypted envelope",
    );

    const afterWrongRecovery =
      await readFinoraControlStore();

    assert(
      afterWrongRecovery.success &&
        afterWrongRecovery.data,
      afterWrongRecovery.error ??
        "Unable to read state after wrong recovery factors.",
    );

    const afterWrongTransactions =
      afterWrongRecovery.data
        .portableBranchAuthEnrollmentTransactions ??
      [];

    assert(
      afterWrongTransactions.length ===
        1 &&
        afterWrongTransactions[0].status ===
          "PREPARED" &&
        afterWrongTransactions[0].transactionId ===
          preparedTransactionId &&
        JSON.stringify(
          afterWrongTransactions[0].portableEnvelope,
        ) ===
          preparedEnvelopeSnapshot &&
        (
          afterWrongRecovery.data
            .branchCredentialEnrollmentAuthorizations
            ?.length ??
          0
        ) ===
          1 &&
        (
          afterWrongRecovery.data
            .branchCredentials
            ?.length ??
          0
        ) ===
          0,
      "Wrong recovery factors changed durable enrollment state.",
    );

    console.log(
      "PASS: wrong recovery factors leave journal, authority and credentials unchanged",
    );

    // ========================================================
    // USB RETURNS -> RECOVER EXACT PREPARED ARTIFACTS
    // ========================================================

    usbConnected =
      true;

    const recoveryResult =
      await enrollFinoraPortableBranchAuth({
        request: {
          username,

          password,

          securityCode,
        },

        portableStore,
      });

    assert(
      recoveryResult.success &&
        recoveryResult.data,
      recoveryResult.success
        ? "Coordinator recovery returned no data."
        : `${recoveryResult.errorCode}: ${recoveryResult.error}`,
    );

    assert(
      recoveryResult.data.recovered ===
        true &&
        recoveryResult.data.transaction.status ===
          "COMPLETE" &&
        recoveryResult.data.transaction.transactionId ===
          preparedTransactionId &&
        recoveryResult.data.credential.credentialId ===
          preparedCredentialId,
      "Coordinator recovery did not complete the exact prepared transaction.",
    );

    console.log(
      "PASS: correct recovery resumes exact PREPARED transaction to COMPLETE",
    );

    // ========================================================
    // EXACT PORTABLE ENVELOPE MUST BE THE PREPARED ENVELOPE
    // ========================================================

    const persistedPortableEnvelope =
      await portableStore.read(
        "USB",
      );

    assert(
      persistedPortableEnvelope !==
        null &&
        JSON.stringify(
          persistedPortableEnvelope,
        ) ===
          preparedEnvelopeSnapshot,
      "Recovered Portable Auth state differs from PREPARED envelope.",
    );

    console.log(
      "PASS: recovery persists exact prepared portable envelope without regeneration",
    );

    // ========================================================
    // FINAL ATOMIC CONTROL STATE
    // ========================================================

    const completeStore =
      await readFinoraControlStore();

    assert(
      completeStore.success &&
        completeStore.data,
      completeStore.error ??
        "Unable to read completed coordinator state.",
    );

    const completeTransactions =
      completeStore.data
        .portableBranchAuthEnrollmentTransactions ??
      [];

    const completeCredentials =
      completeStore.data
        .branchCredentials ??
      [];

    assert(
      completeTransactions.length ===
        1 &&
        completeTransactions[0].status ===
          "COMPLETE" &&
        completeTransactions[0].transactionId ===
          preparedTransactionId &&
        completeTransactions[0].credential.credentialId ===
          preparedCredentialId &&
        completeCredentials.length ===
          1 &&
        completeCredentials[0].credentialId ===
          preparedCredentialId &&
        completeCredentials[0].sourceAuthorizationId ===
          authorizationId &&
        (
          completeStore.data
            .branchCredentialEnrollmentAuthorizations
            ?.length ??
          0
        ) ===
          0,
      "Completed coordinator state is not exactly one transaction + one credential + consumed authority.",
    );

    console.log(
      "PASS: CONTROL_APPLIED atomically produced one credential and consumed signed authority",
    );

    // ========================================================
    // RETRY AFTER AUTHORIZATION CONSUMPTION
    //
    // Durable COMPLETE journal must remain sufficient authority
    // for idempotent finalization retry after the one-time signed
    // enrollment authorization has already been consumed.
    // ========================================================

    const completedRetry =
      await enrollFinoraPortableBranchAuth({
        request: {
          username,

          password,

          securityCode,
        },

        portableStore,
      });

    assert(
      completedRetry.success &&
        completedRetry.data &&
        completedRetry.data.recovered ===
          true &&
        completedRetry.data.transaction.status ===
          "COMPLETE" &&
        completedRetry.data.transaction.transactionId ===
          preparedTransactionId &&
        completedRetry.data.credential.credentialId ===
          preparedCredentialId,
      completedRetry.success
        ? "Completed retry returned incorrect recovery state."
        : `${completedRetry.errorCode}: ${completedRetry.error}`,
    );

    console.log(
      "PASS: COMPLETE retry succeeds after signed authorization consumption",
    );

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
        finalStore.data,
      finalStore.error ??
        "Unable to read final coordinator state.",
    );

    assert(
      (
        finalStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.length ??
        0
      ) ===
        1 &&
        finalStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.[0]
          .transactionId ===
          preparedTransactionId &&
        finalStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.[0]
          .status ===
          "COMPLETE" &&
        (
          finalStore.data
            .branchCredentials
            ?.length ??
          0
        ) ===
          1 &&
        finalStore.data
          .branchCredentials
          ?.[0]
          .credentialId ===
          preparedCredentialId &&
        (
          finalStore.data
            .branchCredentialEnrollmentAuthorizations
            ?.length ??
          0
        ) ===
          0,
      "Completed retry created duplicate or divergent durable state.",
    );

    console.log(
      "PASS: completed retry preserves exactly one transaction and one credential",
    );

    // ========================================================
    // USB MODE MUST NEVER CONSULT LOCAL ROOT
    // ========================================================

    assert(
      localResolverCalls ===
        0,
      `USB coordinator path consulted LOCAL root ${localResolverCalls} time(s).`,
    );

    assert(
      usbResolverCalls >=
        2,
      "USB resolver was not exercised by disconnected + recovery paths.",
    );

    console.log(
      "PASS: USB enrollment and recovery have zero LOCAL fallback",
    );

    console.log(
      "",
    );

    console.log(
      "PASS: PHASE 5.6E3D3E3A2 PORTABLE BRANCH AUTH ENROLLMENT COORDINATOR EXECUTABLE PROOF",
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