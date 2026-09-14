/* ============================================================
   FINORA BRANCH CREDENTIAL ENROLLMENT
   REAL DIFFERENT-VALID-SIGNER SELF TEST

   D4E4I5D2-C PROOF:

   - Establish Control Center signing key A.
   - Bootstrap recipient Branch Access under A.
   - Issue a valid Credential Enrollment Bundle under A.
   - Rotate real Control Center authority A -> B.
   - Issue the same credential lineage again under B.
   - Build one structurally valid mixed composition:
       BRANCH_ACCESS child signed by A
       portability child signed by B
   - Trust A as RETIRED for its historical issue window.
   - Trust B as ACTIVE.
   - Prove both children independently cryptographically verify.
   - Prove the unsigned wrapper is structurally valid.
   - Prove I5D exact-signer equivalence rejects the composition.
   - Prove the entire recipient Control Store is unchanged.

   No fake signer evidence.
   No unsafe cast.
   No private signing material leaves Control Center authority code.
============================================================ */

import {
  app,
} from "electron";

import {
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
  loadOrCreateFinoraControlCenterKeyVault,
} from "../control-center/finoraControlCenterKeyVault.js";

import {
  rotateFinoraControlCenterSigningKey,
} from "../control-center/finoraControlCenterSigningKeyRotationService.js";

import {
  issueFinoraBranchCredentialEnrollmentBundle,
} from "../control-center/finoraBranchCredentialEnrollmentBundleIssuer.js";

import {
  issueFinoraBranchAccessPackage,
} from "../control-center/finoraControlCenterIssuanceCoordinator.js";

import {
  FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,
} from "./finoraBranchAccessPackage.types.js";

import type {
  FinoraBranchAccessGrantPayload,
  FinoraBranchAccessPackageTarget,
  FinoraBranchCredentialEnrollmentAuthorization,
} from "./finoraBranchAccessPackage.types.js";

import {
  validateFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundle.js";

import {
  verifyFinoraSignedBranchPortabilityAuthorityPackage,
  verifyFinoraSignedControlPackageNative,
} from "./finoraSignedControlPackageVerifier.js";

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import type {
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

import {
  readFinoraControlStore,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import {
  applyFinoraSignedBranchAccessPackage,
} from "./finoraBranchAccessPackageApplyService.js";

import {
  applyFinoraBranchCredentialEnrollmentBundle,
} from "./finoraBranchCredentialEnrollmentBundleApplyService.js";

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

function verificationNow():
  Date {

  return new Date(
    Date.now() +
      5_000,
  );
}

async function readControlStoreJson():
  Promise<string> {

  const result =
    await readFinoraControlStore();

  assert(
    result.success &&
      result.data,
    result.error ??
      "Unable to read FINORA Control Store.",
  );

  return JSON.stringify(
    result.data,
  );
}

async function runSelfTest():
  Promise<void> {

  let temporaryUserData:
    string |
    undefined;

  try {
    // ========================================================
    // 1. ISOLATED ENVIRONMENT
    // ========================================================

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-i5d2-different-signer-",
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
    // 2. RECIPIENT NATIVE INSTALLATION
    // ========================================================

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    assert(
      nativeBinding.installationId.length >
        0 &&
      nativeBinding.bindingKeyId.length >
        0 &&
      nativeBinding.publicKeyFingerprint.length ===
        64,
      "Native installation binding is incomplete.",
    );

    console.log(
      "PASS: isolated native installation binding created",
    );

    const setupNow =
      new Date();

    const createdAt =
      new Date(
        setupNow.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const ownerId =
      "OWNER-I5D2-DIFFERENT-SIGNER";

    const businessId =
      "BUSINESS-I5D2-DIFFERENT-SIGNER";

    const branchId =
      "BRANCH-I5D2-DIFFERENT-SIGNER";

    const userId =
      "USER-I5D2-DIFFERENT-SIGNER";

    const grantId =
      "GRANT-I5D2-DIFFERENT-SIGNER";

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId,

        businessId,

        branchId,

        businessCode:
          "I5DS",

        branchCode:
          "B01",

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
      "isolated recipient installation identity persisted",
      installationResult,
    );

    const target:
      FinoraBranchAccessPackageTarget = {

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
    // 3. REAL CONTROL CENTER KEY A
    // ========================================================

    const vaultA =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      vaultA.issuerId.length >
        0 &&
      vaultA.signingKeyId.length >
        0 &&
      vaultA.publicKeySpkiDerBase64.length >
        0,
      "Initial Control Center signing key A is incomplete.",
    );

    console.log(
      "PASS: real Control Center signing key A established",
    );

    const trustedAActive:
      FinoraBranchTrustedControlPublicKey = {

        issuerId:
          vaultA.issuerId,

        signingKeyId:
          vaultA.signingKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          vaultA.publicKeySpkiDerBase64,

        status:
          "ACTIVE",

        validFrom:
          vaultA.createdAt,
      };

    // ========================================================
    // 4. ACTIVE REGISTERED ACCESS BOOTSTRAP UNDER A
    // ========================================================

    const accessGrant:
      FinoraBranchAccessGrantPayload = {

        grantId,

        userId,

        ownerId,

        businessId,

        branchId,

        storageMode:
          "LOCAL",

        accessType:
          "REGISTERED",

        administrativeStatus:
          "ACTIVE",

        validity: {
          validFrom:
            createdAt,

          validUntil:
            addDays(
              createdAt,
              365,
            ),
        },

        registrationPayment: {
          amount:
            2000,

          currency:
            "INR",

          paymentMode:
            "CASH",

          paidAt:
            createdAt,

          remarks:
            "FINORA I5D2 real different-signer proof.",

          refundable:
            false,
        },

        registrationCycle:
          1,

        createdAt,

        updatedAt:
          createdAt,

        schemaVersion:
          1,
      };

    const bootstrapPackage =
      await issueFinoraBranchAccessPackage({
        target,

        payload: {
          action:
            "ISSUE",

          accessGrant,

          schemaVersion:
            1,
        },
      });

    const bootstrapApply =
      await applyFinoraSignedBranchAccessPackage(
        bootstrapPackage,
        [
          trustedAActive,
        ],
        verificationNow(),
      );

    expectSuccess(
      "active REGISTERED Branch Access bootstrap signed by A applied",
      bootstrapApply,
    );

    // ========================================================
    // 5. EXACT CREDENTIAL LINEAGE
    // ========================================================

    const sourceAuthorization:
      FinoraBranchCredentialEnrollmentAuthorization = {

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I5D2-DIFFERENT-SIGNER-000001",

        userId,

        username:
          "branch.admin",

        fullName:
          "Branch Administrator",

        role:
          "ADMIN",

        ownerId,

        businessId,

        branchId,

        storageMode:
          "LOCAL",

        dataContext:
          "REAL",

        method:
          FINORA_BRANCH_ACCESS_CREDENTIAL_ENROLLMENT_METHOD,

        oneTime:
          true,

        schemaVersion:
          1,
      };

    // ========================================================
    // 6. VALID BUNDLE A — BOTH CHILDREN SIGNED BY A
    // ========================================================

    const bundleA =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,
        sourceAuthorization,
      });

    assert(
      bundleA.branchAccessPackage.issuer.signingKeyId ===
        vaultA.signingKeyId &&
      bundleA.branchPortabilityAuthorityPackage.issuer.signingKeyId ===
        vaultA.signingKeyId,
      "Bundle A was not completely signed by key A.",
    );

    console.log(
      "PASS: valid bundle A issued with both children signed by key A",
    );

    // ========================================================
    // 7. REAL A -> B KEY ROTATION
    // ========================================================

    const rotation =
      await rotateFinoraControlCenterSigningKey();

    if (!rotation.success) {
      throw new Error(
        rotation.error,
      );
    }

    assert(
      rotation.data.issuerId ===
        vaultA.issuerId &&
      rotation.data.previousSigningKeyId ===
        vaultA.signingKeyId &&
      rotation.data.newSigningKeyId !==
        vaultA.signingKeyId,
      "Real A-to-B signing-key rotation returned unexpected authority metadata.",
    );

    const vaultB =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      vaultB.issuerId ===
        vaultA.issuerId &&
      vaultB.signingKeyId ===
        rotation.data.newSigningKeyId &&
      vaultB.publicKeySpkiDerBase64 ===
        rotation.data.newPublicKeySpkiDerBase64 &&
      vaultB.retainedSigningKeys?.some(
        (
          item,
        ) =>
          item.signingKeyId ===
            vaultA.signingKeyId &&
          item.retiredAt ===
            rotation.data.rotatedAt,
      ) ===
        true,
      "A-to-B rotation did not preserve expected current/retained authority state.",
    );

    console.log(
      "PASS: real Control Center A-to-B rotation retained A and established B",
    );

    // ========================================================
    // 8. PRODUCTION-SEMANTIC TRUST SET
    //
    // A is RETIRED and valid only through rotatedAt.
    // B is ACTIVE from its authoritative creation time.
    //
    // Verifier checks package issuedAt against these windows.
    // ========================================================

    const trustedARetired:
      FinoraBranchTrustedControlPublicKey = {

        issuerId:
          vaultA.issuerId,

        signingKeyId:
          vaultA.signingKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          vaultA.publicKeySpkiDerBase64,

        status:
          "RETIRED",

        validFrom:
          vaultA.createdAt,

        validUntil:
          rotation.data.rotatedAt,
      };

    const trustedBActive:
      FinoraBranchTrustedControlPublicKey = {

        issuerId:
          vaultB.issuerId,

        signingKeyId:
          vaultB.signingKeyId,

        algorithm:
          "ECDSA_P256_SHA256",

        format:
          "SPKI_DER_BASE64",

        publicKey:
          vaultB.publicKeySpkiDerBase64,

        status:
          "ACTIVE",

        validFrom:
          vaultB.createdAt,
      };

    const trustedKeys:
      FinoraBranchTrustedControlPublicKey[] = [
        trustedARetired,
        trustedBActive,
      ];

    assert(
      Date.parse(
        bundleA.branchAccessPackage.issuedAt,
      ) <=
        Date.parse(
          rotation.data.rotatedAt,
        ),
      "A-signed child was not issued inside A retained validity window.",
    );

    console.log(
      "PASS: recipient trust set models A RETIRED historical validity and B ACTIVE current validity",
    );

    // ========================================================
    // 9. VALID BUNDLE B — SAME LINEAGE, BOTH CHILDREN SIGNED B
    // ========================================================

    const bundleB =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target,
        sourceAuthorization,
      });

    assert(
      bundleB.branchAccessPackage.issuer.signingKeyId ===
        vaultB.signingKeyId &&
      bundleB.branchPortabilityAuthorityPackage.issuer.signingKeyId ===
        vaultB.signingKeyId,
      "Bundle B was not completely signed by key B.",
    );

    assert(
      Date.parse(
        bundleB.branchPortabilityAuthorityPackage.issuedAt,
      ) >=
        Date.parse(
          vaultB.createdAt,
        ),
      "B-signed portability child predates B validity.",
    );

    console.log(
      "PASS: valid bundle B issued for identical credential lineage with key B",
    );

    // ========================================================
    // 10. MIX A BRANCH_ACCESS + B PORTABILITY
    //
    // Wrapper correlates issuer identity / branch / credential
    // lineage, but intentionally does not trust signingKeyId.
    // Crypto-level exact signer equality is an I5D concern.
    // ========================================================

    const mixedBundle = {
      bundleFormat:
        bundleA.bundleFormat,

      branchAccessPackage:
        bundleA.branchAccessPackage,

      branchPortabilityAuthorityPackage:
        bundleB.branchPortabilityAuthorityPackage,

      schemaVersion:
        1 as const,
    };

    const composition =
      validateFinoraBranchCredentialEnrollmentBundle(
        mixedBundle,
      );

    if (!composition.valid) {
      throw new Error(
        `Mixed A/B bundle was not structurally valid: ${composition.error}`,
      );
    }

    console.log(
      "PASS: mixed A/B composition is structurally valid with exact issuer/scope/credential lineage",
    );

    // ========================================================
    // 11. BOTH MIXED CHILDREN INDEPENDENTLY VERIFY
    // ========================================================

    const verifyNow =
      verificationNow();

    const branchVerification =
      verifyFinoraSignedControlPackageNative(
        mixedBundle.branchAccessPackage,
        trustedKeys,
        target,
        verifyNow,
      );

    if (!branchVerification.valid) {
      throw new Error(
        `A-signed BRANCH_ACCESS child failed independent verification: ${branchVerification.reason}: ${branchVerification.error}`,
      );
    }

    assert(
      branchVerification.verifiedTrustedKey.signingKeyId ===
        vaultA.signingKeyId &&
      branchVerification.verifiedTrustedKey.status ===
        "RETIRED",
      "A-signed child did not resolve to exact retained trusted key A.",
    );

    console.log(
      "PASS: A-signed BRANCH_ACCESS child independently cryptographically verifies with RETIRED key A",
    );

    const portabilityVerification =
      verifyFinoraSignedBranchPortabilityAuthorityPackage(
        mixedBundle.branchPortabilityAuthorityPackage,
        trustedKeys,
        {
          ownerId,
          businessId,
          branchId,
        },
        verifyNow,
      );

    if (!portabilityVerification.valid) {
      throw new Error(
        `B-signed portability child failed independent verification: ${portabilityVerification.reason}: ${portabilityVerification.error}`,
      );
    }

    assert(
      portabilityVerification.verifiedTrustedKey.signingKeyId ===
        vaultB.signingKeyId &&
      portabilityVerification.verifiedTrustedKey.status ===
        "ACTIVE",
      "B-signed child did not resolve to exact active trusted key B.",
    );

    assert(
      branchVerification.verifiedTrustedKey.signingKeyId !==
        portabilityVerification.verifiedTrustedKey.signingKeyId,
      "Different-signer fixture unexpectedly resolved both children to the same signing key.",
    );

    console.log(
      "PASS: B-signed portability child independently cryptographically verifies with ACTIVE key B",
    );

    console.log(
      "PASS: both mixed children are individually authentic but resolve to different trusted signing keys",
    );

    // ========================================================
    // 12. EXACT SIGNER GUARD MUST FAIL BEFORE MUTATION
    // ========================================================

    const beforeJson =
      await readControlStoreJson();

    const applyResult =
      await applyFinoraBranchCredentialEnrollmentBundle(
        mixedBundle,
        trustedKeys,
        verifyNow,
      );

    assert(
      !applyResult.success,
      "Different-valid-signer composition was unexpectedly accepted.",
    );

    assert(
      applyResult.error?.includes(
        "exact same trusted Control Center signing key",
      ),
      `Different-valid-signer composition reached unexpected guard: ${applyResult.error ?? ""}`,
    );

    console.log(
      "PASS: exact signer-equivalence guard rejected authentic A/B mixed composition",
    );

    const afterJson =
      await readControlStoreJson();

    assert(
      afterJson ===
        beforeJson,
      "Different-valid-signer rejection mutated authoritative recipient Control Store state.",
    );

    console.log(
      "PASS: different-valid-signer rejection left entire Control Store unchanged",
    );

    // ========================================================
    // 13. NO REJECTED AUTHORITY/REPLAY RESIDUE
    // ========================================================

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
        finalStore.data,
      finalStore.error ??
        "Unable to read final different-signer Control Store.",
    );

    const rejectedAuthorization =
      finalStore.data.branchCredentialEnrollmentAuthorizations
        ?.find(
          (
            item,
          ) =>
            item.authorizationId ===
              sourceAuthorization.authorizationId,
        );

    const rejectedProvenance =
      finalStore.data.branchCredentialPortabilityAuthorities
        ?.find(
          (
            item,
          ) =>
            item.sourceAuthorizationId ===
              sourceAuthorization.authorizationId,
        );

    assert(
      rejectedAuthorization ===
        undefined,
      "Rejected different-signer composition persisted credential authorization.",
    );

    assert(
      rejectedProvenance ===
        undefined,
      "Rejected different-signer composition persisted portability provenance.",
    );

    const appliedPackagesJson =
      JSON.stringify(
        finalStore.data.appliedControlPackages ??
          [],
      );

    assert(
      !appliedPackagesJson.includes(
        bundleA.branchAccessPackage.packageId,
      ),
      "Rejected A-signed AUTHORIZE_CREDENTIAL child entered replay state.",
    );

    assert(
      !appliedPackagesJson.includes(
        bundleB.branchPortabilityAuthorityPackage.packageId,
      ),
      "Rejected B-signed portability child entered replay state.",
    );

    console.log(
      "PASS: rejected authentic mixed-signer composition left no credential, provenance, or replay residue",
    );

    console.log(
      "PASS: D4E4I5D2-C3 REAL DIFFERENT-VALID-SIGNER ZERO-MUTATION PROOF",
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
        "PASS: isolated temporary FINORA userData deleted",
      );
    }
  }
}

void runSelfTest()
  .then(
    () => {
      console.log(
        "PASS: different-valid-signer self-test process exiting with code 0",
      );

      app.quit();
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "SELF-TEST FAILED",
      );

      console.error(
        error,
      );

      process.exitCode =
        1;

      app.quit();
    },
  );