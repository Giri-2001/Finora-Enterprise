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
  isFinoraBranchCredentialPortabilityAuthorityProvenanceV1,
} from "./finoraBranchCredentialPortabilityAuthorityProvenance.js";

import {
  enrollFinoraPortableBranchAuth,
} from "./finoraPortableBranchAuthEnrollmentCoordinator.js";

import {
  bootstrapFinoraLegacySecurityCode,
} from "./finoraLegacySecurityCodeBootstrapCoordinator.js";

import {
  FinoraPortableBranchAuthStore,
} from "./finoraPortableBranchAuthStore.js";

import {
  authorizeFinoraCurrentBranchDevice,
  checkFinoraCurrentBranchDeviceTrust,
} from "./finoraBranchDeviceTrustAuthority.js";

import {
  createFinoraPortableBranchAuthEnvelopeV1,
  decryptFinoraPortableBranchAuthEnvelopeV1,
} from "./finoraPortableBranchAuthCrypto.js";

import {
  generateFinoraBranchCertificationKeyMaterial,
} from "./finoraBranchCertificationCrypto.js";

import {
  bindFinoraBranchCertificationBootstrapToBranch,
  getFinoraBranchCertificationBootstrapStorePath,
  destroyFinoraBranchCertificationBootstrapAfterMigration,
  loadFinoraBranchCertificationBootstrap,
  persistFinoraBranchCertificationBootstrapGenerated,
} from "./finoraBranchCertificationBootstrapStore.js";

import {
  generateFinoraWindowsInstallationBindingMaterial,
} from "./finoraInstallationBindingCrypto.js";

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
    // CASE 1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â MISSING PORTABILITY PROVENANCE
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
    // CASE 2 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â CROSS-RECORD VERIFICATION / PROVENANCE MISMATCH
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
    // CASE 3 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â AMBIGUOUS / DUPLICATE PORTABILITY PROVENANCE
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
    // BRANCH CERTIFICATION CUSTODY FAIL-CLOSED MATRIX
    // ========================================================

    const certificationResolverCallsBefore =
      usbResolverCalls;

    const missingCertificationResult =
      await enrollFinoraPortableBranchAuth({
        request: {
          username,

          password,

          securityCode,
        },

        portableStore,
      });

    assert(
      !missingCertificationResult.success &&
        missingCertificationResult.errorCode ===
          "AUTHORIZATION_NOT_FOUND",
      missingCertificationResult.success
        ? "Enrollment unexpectedly succeeded without Branch Certification bootstrap custody."
        : `Unexpected missing-certification result: ${missingCertificationResult.errorCode}: ${missingCertificationResult.error}`,
    );

    console.log(
      "PASS: missing Branch Certification bootstrap custody fails closed pre-PREPARED",
    );

    const branchCertificationNativeBinding =
      generateFinoraWindowsInstallationBindingMaterial(
        new Date(
          "2026-09-17T02:00:00.000Z",
        ),
        "FINORA-INSTALLATION-PORTABLE-AUTH-CERT-SELFTEST",
      );

    const branchCertificationKeyMaterial =
      generateFinoraBranchCertificationKeyMaterial(
        new Date(
          "2026-09-17T02:01:00.000Z",
        ),
      );

    const branchCertificationRequestId =
      "FINORA-ENROLLMENT-PORTABLE-AUTH-CERT-SELFTEST-001";

    const branchCertificationResponseId =
      "FINORA-ENROLLMENT-RESPONSE-PORTABLE-AUTH-CERT-SELFTEST-001";

    const branchCertificationGeneratedInput = {
      requestId:
        branchCertificationRequestId,

      installationId:
        branchCertificationNativeBinding.installationId,

      bindingKeyId:
        branchCertificationNativeBinding.bindingKeyId,

      fingerprintAlgorithm:
        branchCertificationNativeBinding.fingerprintAlgorithm,

      publicKeyFingerprint:
        branchCertificationNativeBinding.publicKeyFingerprint,

      certificationKeyMaterial:
        branchCertificationKeyMaterial,

      generatedAt:
        branchCertificationKeyMaterial.createdAt,
    };

    await persistFinoraBranchCertificationBootstrapGenerated(
      branchCertificationGeneratedInput,
    );

    const unboundCertificationResult =
      await enrollFinoraPortableBranchAuth({
        request: {
          username,

          password,

          securityCode,
        },

        portableStore,
      });

    assert(
      !unboundCertificationResult.success &&
        unboundCertificationResult.errorCode ===
          "AUTHORIZATION_NOT_FOUND",
      unboundCertificationResult.success
        ? "Enrollment unexpectedly succeeded with GENERATED_FOR_REQUEST Branch Certification custody."
        : `Unexpected unbound-certification result: ${unboundCertificationResult.errorCode}: ${unboundCertificationResult.error}`,
    );

    console.log(
      "PASS: unbound Branch Certification bootstrap custody fails closed pre-PREPARED",
    );

    await bindFinoraBranchCertificationBootstrapToBranch({
      requestId:
        branchCertificationRequestId,

      responseId:
        branchCertificationResponseId,

      ownerId,

      businessId,

      branchId:
        `${branchId}-CERT-MISMATCH`,

      boundAt:
        "2026-09-17T02:02:00.000Z",
    });

    const mismatchedCertificationResult =
      await enrollFinoraPortableBranchAuth({
        request: {
          username,

          password,

          securityCode,
        },

        portableStore,
      });

    assert(
      !mismatchedCertificationResult.success &&
        mismatchedCertificationResult.errorCode ===
          "AUTHORIZATION_NOT_FOUND",
      mismatchedCertificationResult.success
        ? "Enrollment unexpectedly succeeded with mismatched Branch Certification scope."
        : `Unexpected mismatched-certification result: ${mismatchedCertificationResult.errorCode}: ${mismatchedCertificationResult.error}`,
    );

    console.log(
      "PASS: mismatched Branch Certification branch scope fails closed pre-PREPARED",
    );

    const certificationFailClosedStore =
      await readFinoraControlStore();

    assert(
      certificationFailClosedStore.success &&
        certificationFailClosedStore.data,
      certificationFailClosedStore.error ??
        "Unable to read Control Store after Branch Certification fail-closed matrix.",
    );

    assert(
      (
        certificationFailClosedStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.length ??
        0
      ) ===
        0 &&
      (
        certificationFailClosedStore.data
          .branchCredentials
          ?.length ??
        0
      ) ===
        0 &&
      usbResolverCalls ===
        certificationResolverCallsBefore &&
      localResolverCalls ===
        0,
      "Branch Certification fail-closed matrix mutated durable enrollment or portable storage.",
    );

    console.log(
      "PASS: Branch Certification fail-closed matrix leaves zero PREPARED state and zero portable-storage access",
    );

    // TEST-ONLY reset after deliberate wrong-scope immutable bind.
    // Production migration/destruction authority is not exercised here.
    await rm(
      getFinoraBranchCertificationBootstrapStorePath(),
      {
        force:
          true,
      },
    );

    await persistFinoraBranchCertificationBootstrapGenerated(
      branchCertificationGeneratedInput,
    );

    const boundBranchCertification =
      await bindFinoraBranchCertificationBootstrapToBranch({
        requestId:
          branchCertificationRequestId,

        responseId:
          branchCertificationResponseId,

        ownerId,

        businessId,

        branchId,

        boundAt:
          "2026-09-17T02:03:00.000Z",
      });

    assert(
      boundBranchCertification.state ===
        "BRANCH_BOUND_AFTER_RESPONSE" &&
      boundBranchCertification.branchBinding?.responseId ===
        branchCertificationResponseId &&
      boundBranchCertification.branchBinding?.ownerId ===
        ownerId &&
      boundBranchCertification.branchBinding?.businessId ===
        businessId &&
      boundBranchCertification.branchBinding?.branchId ===
        branchId &&
      boundBranchCertification.certificationKeyMaterial.keyId ===
        branchCertificationKeyMaterial.keyId &&
      boundBranchCertification.certificationKeyMaterial.privateKey ===
        branchCertificationKeyMaterial.privateKey,
      "Positive Branch Certification binding did not preserve exact custody.",
    );

    console.log(
      "PASS: exact BRANCH_BOUND_AFTER_RESPONSE certification custody prepared for Portable Auth enrollment",
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

    assert(
      preparedTransaction.branchCertificationProvenance
        ?.requestId ===
        branchCertificationRequestId &&
      preparedTransaction.branchCertificationProvenance
        ?.responseId ===
        branchCertificationResponseId &&
      preparedTransaction.branchCertificationProvenance
        ?.certificationKeyId ===
        branchCertificationKeyMaterial.keyId,
      "PREPARED transaction did not snapshot exact Branch Certification migration provenance.",
    );

    console.log(
      "PASS: PREPARED transaction snapshots exact Branch Certification migration provenance",
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

    assert(
      preparedPayload.branchCertificationKeyMaterial !==
        undefined &&
      JSON.stringify(
        preparedPayload.branchCertificationKeyMaterial,
      ) ===
        JSON.stringify(
          branchCertificationKeyMaterial,
        ),
      "Encrypted Portable Auth did not preserve exact bound Branch Certification authority.",
    );

    console.log(
      "PASS: encrypted Portable Auth contains exact bound Branch Certification private authority",
    );

    const preparedEnvelopeJson =
      JSON.stringify(
        preparedTransaction.portableEnvelope,
      );

    const preparedTransactionJson =
      JSON.stringify(
        preparedTransaction,
      );

    const preparedControlStoreJson =
      JSON.stringify(
        preparedStore.data,
      );

    assert(
      !preparedEnvelopeJson.includes(
        branchCertificationKeyMaterial.privateKey,
      ) &&
      !preparedTransactionJson.includes(
        branchCertificationKeyMaterial.privateKey,
      ) &&
      !preparedControlStoreJson.includes(
        branchCertificationKeyMaterial.privateKey,
      ),
      "Branch Certification private authority leaked outside encrypted Portable Auth payload.",
    );

    console.log(
      "PASS: Branch Certification private authority is absent from outer envelope, journal and Control Store plaintext",
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
    // 3D3D1E EXPLICIT CRASH MATRIX
    //
    // Each crash case is executed in its own Electron process
    // with isolated userData. The default self-test continues
    // through the ordinary production finalization path.
    // ========================================================

    const crashMatrixCase =
      process.env.FINORA_3D3D1E_CRASH_CASE;

    if (
      crashMatrixCase ===
        "A"
    ) {
      // ------------------------------------------------------
      // A. Bootstrap disappears BEFORE durable migration.
      //
      // Recovery may advance Portable + Control state, but it
      // must fail closed before CERTIFICATION_MIGRATED/COMPLETE.
      // ------------------------------------------------------

      usbConnected =
        true;

      await rm(
        getFinoraBranchCertificationBootstrapStorePath(),
        {
          force:
            true,
        },
      );

      const crashAResult =
        await enrollFinoraPortableBranchAuth({
          request: {
            username,

            password,

            securityCode,
          },

          portableStore,
        });

      assert(
        !crashAResult.success &&
          crashAResult.errorCode ===
            "CERTIFICATION_BOOTSTRAP_DESTRUCTION_FAILED",
        crashAResult.success
          ? "Crash A unexpectedly completed without pre-migration Bootstrap custody."
          : `Unexpected Crash A result: ${crashAResult.errorCode}: ${crashAResult.error}`,
      );

      const crashAStore =
        await readFinoraControlStore();

      assert(
        crashAStore.success &&
          crashAStore.data,
        crashAStore.error ??
          "Unable to inspect Crash A durable state.",
      );

      const crashATransaction =
        crashAStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.[0];

      assert(
        crashATransaction !==
          undefined &&
        crashATransaction.transactionId ===
          preparedTransactionId &&
        crashATransaction.status ===
          "CONTROL_APPLIED" &&
        crashATransaction.certificationMigratedAt ===
          undefined &&
        (
          crashAStore.data
            .branchCredentials
            ?.length ??
          0
        ) ===
          1 &&
        (
          crashAStore.data
            .branchCredentialEnrollmentAuthorizations
            ?.length ??
          0
        ) ===
          0,
        "Crash A did not fail closed at CONTROL_APPLIED before durable certification migration.",
      );

      const crashABootstrap =
        await loadFinoraBranchCertificationBootstrap();

      assert(
        crashABootstrap ===
          undefined,
        "Crash A unexpectedly recreated missing Bootstrap custody.",
      );

      console.log(
        "PASS: crash A missing Bootstrap before durable migration fails closed without CERTIFICATION_MIGRATED or COMPLETE",
      );

      return;
    }

    if (
      crashMatrixCase ===
        "B" ||
      crashMatrixCase ===
        "C"
    ) {
      // ------------------------------------------------------
      // Build the exact durable crash point:
      // PORTABLE_WRITTEN -> CONTROL_APPLIED ->
      // CERTIFICATION_MIGRATED.
      // ------------------------------------------------------

      usbConnected =
        true;

      await portableStore.ensureExact(
        preparedTransaction.storageMode,
        preparedTransaction.portableEnvelope,
      );

      const crashPortableWritten =
        await markFinoraPortableBranchAuthEnrollmentWritten({
          transactionId:
            preparedTransactionId,

          transitionedAt:
            new Date().toISOString(),
        });

      assert(
        crashPortableWritten.success &&
          crashPortableWritten.data,
        crashPortableWritten.error ??
          "Unable to build crash fixture PORTABLE_WRITTEN state.",
      );

      const crashControlApplied =
        await applyFinoraPortableBranchAuthEnrollmentControlState({
          transactionId:
            preparedTransactionId,

          transitionedAt:
            new Date().toISOString(),
        });

      assert(
        crashControlApplied.success &&
          crashControlApplied.data,
        crashControlApplied.error ??
          "Unable to build crash fixture CONTROL_APPLIED state.",
      );

      const crashMigrated =
        await markFinoraPortableBranchAuthEnrollmentCertificationMigrated({
          transactionId:
            preparedTransactionId,

          transitionedAt:
            new Date().toISOString(),
        });

      assert(
        crashMigrated.success &&
          crashMigrated.data,
        crashMigrated.error ??
          "Unable to build crash fixture CERTIFICATION_MIGRATED state.",
      );

      const crashMigratedTransaction =
        crashMigrated.data.transaction;

      assert(
        crashMigratedTransaction.status ===
          "CERTIFICATION_MIGRATED" &&
        crashMigratedTransaction.certificationMigratedAt !==
          undefined &&
        crashMigratedTransaction.branchCertificationProvenance
          ?.requestId ===
          branchCertificationRequestId &&
        crashMigratedTransaction.branchCertificationProvenance
          ?.responseId ===
          branchCertificationResponseId &&
        crashMigratedTransaction.branchCertificationProvenance
          ?.certificationKeyId ===
          branchCertificationKeyMaterial.keyId,
        "Crash fixture did not reach exact durable CERTIFICATION_MIGRATED state.",
      );

      if (
        crashMatrixCase ===
          "B"
      ) {
        // ----------------------------------------------------
        // B. Crash AFTER migration evidence, BEFORE destroy.
        //
        // Bootstrap still exists. Coordinator retry must use
        // durable provenance to destroy it and reach COMPLETE.
        // ----------------------------------------------------

        const crashBBootstrapBeforeRetry =
          await loadFinoraBranchCertificationBootstrap();

        assert(
          crashBBootstrapBeforeRetry !==
            undefined &&
          crashBBootstrapBeforeRetry.state ===
            "BRANCH_BOUND_AFTER_RESPONSE" &&
          crashBBootstrapBeforeRetry.requestId ===
            branchCertificationRequestId &&
          crashBBootstrapBeforeRetry.branchBinding?.responseId ===
            branchCertificationResponseId &&
          crashBBootstrapBeforeRetry.certificationKeyMaterial.keyId ===
            branchCertificationKeyMaterial.keyId,
          "Crash B fixture lost exact Bootstrap custody before retry.",
        );

        const crashBRetry =
          await enrollFinoraPortableBranchAuth({
            request: {
              username,

              password,

              securityCode,
            },

            portableStore,
          });

        assert(
          crashBRetry.success &&
            crashBRetry.data &&
            crashBRetry.data.recovered ===
              true &&
            crashBRetry.data.transaction.status ===
              "COMPLETE" &&
            crashBRetry.data.transaction.transactionId ===
              preparedTransactionId,
          crashBRetry.success
            ? "Crash B retry returned incorrect completed state."
            : `Crash B retry failed: ${crashBRetry.errorCode}: ${crashBRetry.error}`,
        );

        const crashBBootstrapAfterRetry =
          await loadFinoraBranchCertificationBootstrap();

        assert(
          crashBBootstrapAfterRetry ===
            undefined,
          "Crash B retry reached COMPLETE without destroying Bootstrap custody.",
        );

        console.log(
          "PASS: crash B retry from CERTIFICATION_MIGRATED destroys exact Bootstrap custody and reaches COMPLETE",
        );

        return;
      }

      // ------------------------------------------------------
      // C. Crash AFTER destroy, BEFORE COMPLETE.
      //
      // We execute the production destruction authority using
      // the already-durable migration evidence, but deliberately
      // do not call COMPLETE. Coordinator retry must accept the
      // absent Bootstrap only because migration was already
      // durable, then reach COMPLETE.
      // ------------------------------------------------------

      const crashCProvenance =
        crashMigratedTransaction.branchCertificationProvenance;

      const crashCMigratedAt =
        crashMigratedTransaction.certificationMigratedAt;

      assert(
        crashCProvenance !==
          undefined &&
        crashCMigratedAt !==
          undefined,
        "Crash C fixture lacks durable migration evidence.",
      );

      const crashCDestroyed =
        await destroyFinoraBranchCertificationBootstrapAfterMigration({
          requestId:
            crashCProvenance.requestId,

          responseId:
            crashCProvenance.responseId,

          ownerId:
            crashMigratedTransaction.ownerId,

          businessId:
            crashMigratedTransaction.businessId,

          branchId:
            crashMigratedTransaction.branchId,

          certificationKeyId:
            crashCProvenance.certificationKeyId,

          migratedAt:
            crashCMigratedAt,
        });

      assert(
        crashCDestroyed,
        "Crash C fixture could not destroy exact Bootstrap custody after durable migration.",
      );

      const crashCBootstrapBeforeRetry =
        await loadFinoraBranchCertificationBootstrap();

      assert(
        crashCBootstrapBeforeRetry ===
          undefined,
        "Crash C fixture retained Bootstrap after production destruction.",
      );

      const crashCStoreBeforeRetry =
        await readFinoraControlStore();

      assert(
        crashCStoreBeforeRetry.success &&
          crashCStoreBeforeRetry.data &&
          crashCStoreBeforeRetry.data
            .portableBranchAuthEnrollmentTransactions
            ?.[0]
            .status ===
            "CERTIFICATION_MIGRATED",
        crashCStoreBeforeRetry.error ??
          "Crash C fixture did not preserve CERTIFICATION_MIGRATED before retry.",
      );

      const crashCRetry =
        await enrollFinoraPortableBranchAuth({
          request: {
            username,

            password,

            securityCode,
          },

          portableStore,
        });

      assert(
        crashCRetry.success &&
          crashCRetry.data &&
          crashCRetry.data.recovered ===
            true &&
          crashCRetry.data.transaction.status ===
            "COMPLETE" &&
          crashCRetry.data.transaction.transactionId ===
            preparedTransactionId,
        crashCRetry.success
          ? "Crash C retry returned incorrect completed state."
          : `Crash C retry failed: ${crashCRetry.errorCode}: ${crashCRetry.error}`,
      );

      const crashCBootstrapAfterRetry =
        await loadFinoraBranchCertificationBootstrap();

      assert(
        crashCBootstrapAfterRetry ===
          undefined,
        "Crash C retry recreated already-destroyed Bootstrap custody.",
      );

      console.log(
        "PASS: crash C retry after Bootstrap destruction but before COMPLETE uses durable migration evidence and reaches COMPLETE",
      );

      return;
    }

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
        recoveryResult.data.transaction.certificationMigratedAt !==
          undefined &&
        recoveryResult.data.transaction.branchCertificationProvenance
          ?.requestId ===
          branchCertificationRequestId &&
        recoveryResult.data.transaction.branchCertificationProvenance
          ?.responseId ===
          branchCertificationResponseId &&
        recoveryResult.data.transaction.branchCertificationProvenance
          ?.certificationKeyId ===
          branchCertificationKeyMaterial.keyId &&
        recoveryResult.data.credential.credentialId ===
          preparedCredentialId,
      "Coordinator recovery did not complete the exact prepared transaction.",
    );

    console.log(
      "PASS: correct recovery resumes exact PREPARED transaction to COMPLETE",
    );

    console.log(
      "PASS: recovery COMPLETE contains durable Branch Certification migration evidence",
    );

    const certificationAfterRecovery =
      await loadFinoraBranchCertificationBootstrap();

    assert(
      certificationAfterRecovery ===
        undefined,
      "Certification-aware COMPLETE retained bootstrap custody after durable migration.",
    );

    console.log(
      "PASS: certification-aware COMPLETE destroys bootstrap custody only after durable migration evidence",
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
        completeTransactions[0].certificationMigratedAt !==
          undefined &&
        completeTransactions[0].branchCertificationProvenance
          ?.requestId ===
          branchCertificationRequestId &&
        completeTransactions[0].branchCertificationProvenance
          ?.responseId ===
          branchCertificationResponseId &&
        completeTransactions[0].branchCertificationProvenance
          ?.certificationKeyId ===
          branchCertificationKeyMaterial.keyId &&
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

    console.log(
      "PASS: completed coordinator state preserves exact Branch Certification migration evidence",
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
        finalStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.[0]
          .certificationMigratedAt !==
          undefined &&
        finalStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.[0]
          .branchCertificationProvenance
          ?.requestId ===
          branchCertificationRequestId &&
        finalStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.[0]
          .branchCertificationProvenance
          ?.responseId ===
          branchCertificationResponseId &&
        finalStore.data
          .portableBranchAuthEnrollmentTransactions
          ?.[0]
          .branchCertificationProvenance
          ?.certificationKeyId ===
          branchCertificationKeyMaterial.keyId &&
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

    console.log(
      "PASS: completed retry preserves exact Branch Certification migration evidence",
    );

    // ========================================================
    // UPDATE COMPATIBILITY RECOVERY MATRIX
    // ========================================================

    const recoveryTransaction =
      finalStore.data
        .portableBranchAuthEnrollmentTransactions
        ?.[0];

    const recoveryCredential =
      finalStore.data
        .branchCredentials
        ?.[0];

    assert(
      recoveryTransaction !== undefined &&
      recoveryTransaction.status === "COMPLETE" &&
      recoveryCredential !== undefined &&
      recoveryCredential.credentialId === preparedCredentialId,
      "Recovery fixture is missing exact COMPLETE enrollment evidence.",
    );

    assert(
      recoveryCredential.storageMode === "USB",
      "Recovery fixture unexpectedly changed storage mode.",
    );

    const recoveryPrincipal = {
      credentialId:
        recoveryCredential.credentialId,

      sourceAuthorizationId:
        recoveryCredential.sourceAuthorizationId,

      authGeneration:
        recoveryCredential.authGeneration ?? 1,

      userId:
        recoveryCredential.userId,

      username:
        recoveryCredential.username,

      fullName:
        recoveryCredential.fullName,

      role:
        recoveryCredential.role,

      ownerId:
        recoveryCredential.ownerId,

      businessId:
        recoveryCredential.businessId,

      branchId:
        recoveryCredential.branchId,

      storageMode:
        recoveryCredential.storageMode,

      dataContext:
        recoveryCredential.dataContext,

      ...(
        recoveryCredential.demoId === undefined
          ? {}
          : {
              demoId:
                recoveryCredential.demoId,
            }
      ),

      authenticatedAt:
        new Date().toISOString(),
    };

    usbConnected =
      true;

    const recoveryPortableAuthFile =
      join(
        portableUsbRoot,
        "FINORA",
        "auth",
        "finora-branch-auth.bin",
      );

    await rm(
      recoveryPortableAuthFile,
      {
        force:
          true,
      },
    );

    assert(
      await portableStore.read("USB") === null,
      "Unknown-device recovery fixture did not remove physical Portable Auth.",
    );

    const recoveredUnknownCheck =
      await checkFinoraCurrentBranchDeviceTrust({
        principal:
          recoveryPrincipal,

        portableStore,
      });

    assert(
      recoveredUnknownCheck.success &&
      recoveredUnknownCheck.status === "SECURITY_CODE_REQUIRED",
      "Missing Portable Auth was not recovered into the unknown-device Security Code challenge.",
    );

    const recoveredEnvelopeForUnknownDevice =
      await portableStore.read("USB");

    assert(
      recoveredEnvelopeForUnknownDevice !== null &&
      JSON.stringify(recoveredEnvelopeForUnknownDevice) ===
        JSON.stringify(recoveryTransaction.portableEnvelope),
      "Unknown-device recovery did not restore the exact completed enrollment envelope.",
    );

    console.log(
      "PASS: missing Portable Auth recovers exact COMPLETE envelope and unknown device requires Security Code",
    );

    const recoveredUnknownAuthorization =
      await authorizeFinoraCurrentBranchDevice({
        principal:
          recoveryPrincipal,

        portableStore,

        password,
        securityCode,
      });

    assert(
      recoveredUnknownAuthorization.success,
      recoveredUnknownAuthorization.success
        ? "Unexpected unknown-device authorization result."
        : recoveredUnknownAuthorization.error,
    );

    console.log(
      "PASS: correct Security Code authorizes recovered unknown device",
    );

    await rm(
      recoveryPortableAuthFile,
      {
        force:
          true,
      },
    );

    assert(
      await portableStore.read("USB") === null,
      "Trusted-device update fixture did not remove physical Portable Auth.",
    );

    const recoveredTrustedCheck =
      await checkFinoraCurrentBranchDeviceTrust({
        principal:
          recoveryPrincipal,

        portableStore,
      });

    assert(
      recoveredTrustedCheck.success &&
      recoveredTrustedCheck.status === "TRUSTED",
      "Trusted device did not survive missing Portable Auth after update recovery.",
    );

    const recoveredEnvelopeForTrustedDevice =
      await portableStore.read("USB");

    assert(
      recoveredEnvelopeForTrustedDevice !== null &&
      JSON.stringify(recoveredEnvelopeForTrustedDevice) ===
        JSON.stringify(recoveryTransaction.portableEnvelope),
      "Trusted-device recovery did not restore the exact completed enrollment envelope.",
    );

    console.log(
      "PASS: trusted device survives update-time Portable Auth loss without a new Security Code challenge",
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

    const certificationAfterCompletedRetry =
      await loadFinoraBranchCertificationBootstrap();

    assert(
      certificationAfterCompletedRetry ===
        undefined,
      "COMPLETE retry recreated or retained already-destroyed Branch Certification bootstrap custody.",
    );

    console.log(
      "PASS: COMPLETE retry accepts already-destroyed bootstrap only with durable migration evidence",
    );

    console.log(
      "",
    );

    // ========================================================
    // LEGACY SECURITY CODE BOOTSTRAP REGRESSION MATRIX
    // ========================================================

    usbConnected =
      true;

    const legacyBootstrapSecurityCode =
      "FINORA-Legacy-Security@8421";

    const legacyOriginalStoreResult =
      await readFinoraControlStore();

    assert(
      legacyOriginalStoreResult.success &&
        legacyOriginalStoreResult.data,
      legacyOriginalStoreResult.error ??
        "Unable to read legacy-bootstrap source Control Store.",
    );

    const legacyOriginalStoreSnapshot =
      structuredClone(
        legacyOriginalStoreResult.data,
      );

    const legacyOriginalEnvelope =
      await portableStore.read(
        "USB",
      );

    assert(
      legacyOriginalEnvelope !==
        null,
      "Legacy-bootstrap source Portable Auth is missing.",
    );

    const legacyBaselineStore =
      structuredClone(
        legacyOriginalStoreSnapshot,
      );

    const legacyCredentialIndex =
      (legacyBaselineStore.branchCredentials ?? []).findIndex(
        (item) =>
          item.canonicalUsername ===
            username.trim().toLowerCase(),
      );

    assert(
      legacyCredentialIndex >=
        0,
      "Legacy-bootstrap source credential was not found.",
    );

    const legacyCredential =
      legacyBaselineStore.branchCredentials![legacyCredentialIndex];

    const legacySourceGeneration =
      legacyCredential.authGeneration ??
      1;

    delete legacyCredential.securityVerifier;

    // Positive legacy-bootstrap fixture requires the same exact
    // ACTIVE native-bound Storage Entitlement enforced in production.
    legacyBaselineStore.storageEntitlements =
      [
        ...(legacyBaselineStore.storageEntitlements ?? []).filter(
          (item) =>
            !(
              item.userId === legacyCredential.userId &&
              item.ownerId === legacyCredential.ownerId &&
              item.businessId === legacyCredential.businessId &&
              item.branchId === legacyCredential.branchId &&
              item.storageMode === legacyCredential.storageMode
            ),
        ),
        {
          entitlementId:
            "FINORA-LEGACY-BOOTSTRAP-SELFTEST-STORAGE",
          userId:
            legacyCredential.userId,
          ownerId:
            legacyCredential.ownerId,
          businessId:
            legacyCredential.businessId,
          branchId:
            legacyCredential.branchId,
          installationId:
            nativeBinding.installationId,
          bindingKeyId:
            nativeBinding.bindingKeyId,
          fingerprintAlgorithm:
            nativeBinding.fingerprintAlgorithm,
          publicKeyFingerprint:
            nativeBinding.publicKeyFingerprint,
          storageMode:
            legacyCredential.storageMode,
          status:
            "ACTIVE",
          activatedAt:
            legacyCredential.createdAt,
          createdAt:
            legacyCredential.createdAt,
          updatedAt:
            legacyCredential.updatedAt,
          schemaVersion:
            1,
        },
      ];

    console.log(
      "PASS: legacy bootstrap fixture carries exact ACTIVE native-bound storage authority",
    );

    const legacyBootstrapPortableFile =
      join(
        portableUsbRoot,
        "FINORA",
        "auth",
        "finora-branch-auth.bin",
      );

    await persistRawControlStoreFixture(
      legacyBaselineStore,
    );

    await rm(
      legacyBootstrapPortableFile,
      {
        force:
          true,
      },
    );

    assert(
      await portableStore.read("USB") ===
        null,
      "Legacy-bootstrap success fixture did not remove predecessor Portable Auth.",
    );

    const legacyBootstrapResult =
      await bootstrapFinoraLegacySecurityCode(
        {
          username,
          password,
          securityCode:
            legacyBootstrapSecurityCode,
        },
        portableStore,
      );

    assert(
      legacyBootstrapResult.success &&
        legacyBootstrapResult.data.authGeneration ===
          legacySourceGeneration +
            1 &&
        legacyBootstrapResult.data.portableResult ===
          "WRITTEN",
      legacyBootstrapResult.success
        ? "Legacy bootstrap returned unexpected success state."
        : `${legacyBootstrapResult.errorCode}: ${legacyBootstrapResult.error}`,
    );

    const afterLegacyBootstrap =
      await readFinoraControlStore();

    assert(
      afterLegacyBootstrap.success &&
        afterLegacyBootstrap.data,
      afterLegacyBootstrap.error ??
        "Unable to read successful legacy-bootstrap Control Store.",
    );

    const bootstrappedCredential =
      afterLegacyBootstrap.data.branchCredentials?.find(
        (item) =>
          item.credentialId ===
            legacyCredential.credentialId,
      );

    assert(
      bootstrappedCredential !==
        undefined &&
      bootstrappedCredential.securityVerifier !==
        undefined &&
      bootstrappedCredential.authGeneration ===
        legacySourceGeneration +
          1,
      "Successful legacy bootstrap did not persist Security Code verifier + generation.",
    );

    const successfulLegacyEnvelope =
      await portableStore.read(
        "USB",
      );

    assert(
      successfulLegacyEnvelope !==
        null,
      "Successful legacy bootstrap did not persist Portable Auth.",
    );

    const successfulLegacyPayload =
      await decryptFinoraPortableBranchAuthEnvelopeV1(
        successfulLegacyEnvelope,
        password,
        legacyBootstrapSecurityCode,
        {
          expectedScope: {
            ownerId,
            businessId,
            branchId,
          },
        },
      );

    assert(
      successfulLegacyPayload.authGeneration ===
        legacySourceGeneration +
          1 &&
      successfulLegacyPayload.sourceAuthorizationId ===
        legacyCredential.sourceAuthorizationId &&
      successfulLegacyPayload.sourceAuthorizationVerificationEvidence.portabilityAuthorityProof !==
        undefined,
      "Successful legacy bootstrap Portable Auth lost generation or signed portability provenance.",
    );

    console.log(
      "PASS: legacy credential + missing Portable Auth bootstraps Security Code with signed provenance",
    );

    // --------------------------------------------------------
    // INTERRUPTED AFTER PORTABLE WRITE, BEFORE CONTROL COMMIT
    // --------------------------------------------------------

    await persistRawControlStoreFixture(
      legacyBaselineStore,
    );

    const interruptedBefore =
      await readFinoraControlStore();

    assert(
      interruptedBefore.success &&
        interruptedBefore.data &&
      interruptedBefore.data.branchCredentials?.[legacyCredentialIndex]?.securityVerifier ===
        undefined,
      "Interrupted legacy fixture did not restore pre-bootstrap credential state.",
    );

    const interruptedRetry =
      await bootstrapFinoraLegacySecurityCode(
        {
          username,
          password,
          securityCode:
            legacyBootstrapSecurityCode,
        },
        portableStore,
      );

    assert(
      interruptedRetry.success &&
        interruptedRetry.data.portableResult ===
          "ALREADY_MATCHED" &&
        interruptedRetry.data.authGeneration ===
          legacySourceGeneration +
            1,
      interruptedRetry.success
        ? "Interrupted legacy retry returned unexpected success state."
        : `${interruptedRetry.errorCode}: ${interruptedRetry.error}`,
    );

    const interruptedAfter =
      await readFinoraControlStore();

    assert(
      interruptedAfter.success &&
        interruptedAfter.data &&
      interruptedAfter.data.branchCredentials?.[legacyCredentialIndex]?.securityVerifier !==
        undefined &&
      interruptedAfter.data.branchCredentials?.[legacyCredentialIndex]?.authGeneration ===
        legacySourceGeneration +
          1,
      "Interrupted legacy retry did not complete exact credential commit.",
    );

    console.log(
      "PASS: interrupted legacy bootstrap resumes from exact persisted Portable Auth envelope",
    );

    // --------------------------------------------------------
    // WRONG SECURITY CODE AGAINST INTERRUPTED ENVELOPE
    // --------------------------------------------------------

    await persistRawControlStoreFixture(
      legacyBaselineStore,
    );

    const wrongCodeBefore =
      await readFinoraControlStore();

    assert(
      wrongCodeBefore.success &&
        wrongCodeBefore.data,
      wrongCodeBefore.error ??
        "Unable to read wrong-code legacy baseline.",
    );

    const wrongCodeBeforeJson =
      JSON.stringify(
        wrongCodeBefore.data,
      );

    const wrongLegacyCodeResult =
      await bootstrapFinoraLegacySecurityCode(
        {
          username,
          password,
          securityCode:
            `${legacyBootstrapSecurityCode}-WRONG`,
        },
        portableStore,
      );

    assert(
      !wrongLegacyCodeResult.success &&
        wrongLegacyCodeResult.errorCode ===
          "PORTABLE_AUTH_MISMATCH",
      wrongLegacyCodeResult.success
        ? "Wrong interrupted Security Code unexpectedly completed legacy bootstrap."
        : `Unexpected wrong-code result: ${wrongLegacyCodeResult.errorCode}: ${wrongLegacyCodeResult.error}`,
    );

    const wrongCodeAfter =
      await readFinoraControlStore();

    assert(
      wrongCodeAfter.success &&
        wrongCodeAfter.data &&
      JSON.stringify(wrongCodeAfter.data) ===
        wrongCodeBeforeJson,
      "Wrong legacy Security Code mutated authoritative Control Store.",
    );

    console.log(
      "PASS: wrong Security Code cannot complete interrupted legacy bootstrap",
    );

    // --------------------------------------------------------
    // MISSING SIGNED PORTABILITY PROVENANCE
    // --------------------------------------------------------

    const missingLegacyProofStore =
      structuredClone(
        legacyBaselineStore,
      );

    missingLegacyProofStore.branchCredentialPortabilityAuthorities =
      [];

    await persistRawControlStoreFixture(
      missingLegacyProofStore,
    );

    await rm(
      legacyBootstrapPortableFile,
      { force: true },
    );

    const missingLegacyProofResult =
      await bootstrapFinoraLegacySecurityCode(
        {
          username,
          password,
          securityCode:
            legacyBootstrapSecurityCode,
        },
        portableStore,
      );

    assert(
      !missingLegacyProofResult.success &&
        missingLegacyProofResult.errorCode ===
          "SIGNED_PROVENANCE_UNAVAILABLE" &&
      await portableStore.read("USB") ===
        null,
      missingLegacyProofResult.success
        ? "Legacy bootstrap unexpectedly succeeded without signed portability provenance."
        : `Unexpected missing-provenance result: ${missingLegacyProofResult.errorCode}: ${missingLegacyProofResult.error}`,
    );

    console.log(
      "PASS: legacy bootstrap requires exact retained signed portability provenance",
    );

    // --------------------------------------------------------
    // REVOKED CONTROL SIGNER PROVENANCE
    // --------------------------------------------------------

    const revokedLegacySignerStore =
      structuredClone(
        legacyBaselineStore,
      );

    const revokedEvidence =
      revokedLegacySignerStore.branchCredentialAuthorizationVerificationEvidence?.find(
        (item) =>
          item.authorizationId ===
            legacyCredential.sourceAuthorizationId,
      );

    const revokedPortability =
      revokedLegacySignerStore.branchCredentialPortabilityAuthorities?.find(
        (item) =>
          item.sourceAuthorizationId ===
            legacyCredential.sourceAuthorizationId,
      );

    assert(
      revokedEvidence !==
        undefined &&
      revokedPortability !==
        undefined,
      "Revoked-signer legacy fixture is missing retained provenance.",
    );

    revokedEvidence.verifiedControlSigner.status =
      "REVOKED";

    revokedPortability.verifiedControlSigner.status =
      "REVOKED";

    await persistRawControlStoreFixture(
      revokedLegacySignerStore,
    );

    const revokedLegacySignerResult =
      await bootstrapFinoraLegacySecurityCode(
        {
          username,
          password,
          securityCode:
            legacyBootstrapSecurityCode,
        },
        portableStore,
      );

    assert(
      !revokedLegacySignerResult.success &&
        (
          revokedLegacySignerResult.errorCode ===
            "SIGNED_PROVENANCE_UNAVAILABLE" ||
          revokedLegacySignerResult.errorCode ===
            "CONTROL_STORE_FAILED"
        ) &&
      await portableStore.read("USB") ===
        null,
      revokedLegacySignerResult.success
        ? "Legacy bootstrap unexpectedly accepted revoked signer provenance."
        : `Unexpected revoked-signer result: ${revokedLegacySignerResult.errorCode}: ${revokedLegacySignerResult.error}`,
    );

    console.log(
      "PASS: revoked Control signer provenance cannot bootstrap legacy Security Code",
    );

    // --------------------------------------------------------
    // ACTIVE NATIVE-BOUND STORAGE AUTHORITY REQUIRED
    // --------------------------------------------------------

    const noStorageAuthorityStore =
      structuredClone(
        legacyBaselineStore,
      );

    noStorageAuthorityStore.storageEntitlements =
      [];

    await persistRawControlStoreFixture(
      noStorageAuthorityStore,
    );

    const noStorageAuthorityResult =
      await bootstrapFinoraLegacySecurityCode(
        {
          username,
          password,
          securityCode:
            legacyBootstrapSecurityCode,
        },
        portableStore,
      );

    assert(
      !noStorageAuthorityResult.success &&
        noStorageAuthorityResult.errorCode ===
          "STORAGE_ENTITLEMENT_DENIED" &&
      await portableStore.read("USB") ===
        null,
      noStorageAuthorityResult.success
        ? "Legacy bootstrap unexpectedly succeeded without exact native-bound storage authority."
        : `Unexpected storage-authority result: ${noStorageAuthorityResult.errorCode}: ${noStorageAuthorityResult.error}`,
    );

    console.log(
      "PASS: legacy bootstrap requires exact ACTIVE native-bound storage authority",
    );

    // --------------------------------------------------------
    // RESTORE HEALTHY FIXTURE
    // --------------------------------------------------------

    await persistRawControlStoreFixture(
      legacyOriginalStoreSnapshot,
    );

    await rm(
      legacyBootstrapPortableFile,
      { force: true },
    );

    const restoredLegacyPortable =
      await portableStore.ensureExact(
        "USB",
        legacyOriginalEnvelope,
      );

    assert(
      restoredLegacyPortable ===
        "WRITTEN" ||
      restoredLegacyPortable ===
        "ALREADY_MATCHED",
      "Legacy-bootstrap regression matrix failed to restore original Portable Auth.",
    );

    console.log(
      "PASS: legacy bootstrap regression matrix restored exact healthy fixture",
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