/* ============================================================
   FINORA BRANCH CREDENTIAL ENROLLMENT
   RECIPIENT TRUST CONCURRENCY E2E SELF TEST

   D4E4I5E-D3B

   PURPOSE:

   Prove the authoritative Credential Enrollment composition
   apply and signed Recipient Trust transitions share exactly
   one serialization boundary.

   REAL AUTHORITY FIXTURE:

   - Control Center key A signs two Credential Enrollment Bundles.
   - Control Center rotates A -> B.
   - Recipient Trust contains:
       A = RETIRED historical signer
       B = ACTIVE current signer
   - B signs REVOKE_RETIRED(A).

   CASE 1:

   Credential Enrollment Bundle 1 queued first
   -> REVOKE_RETIRED(A) queued second.

   Expected:
   - Bundle 1 verifies while A is still RETIRED and valid.
   - Credential authorization + portability provenance persist.
   - Revoke then marks A REVOKED.

   CASE 2:

   Independent trust fixture reset to A RETIRED + B ACTIVE.
   REVOKE_RETIRED(A) queued first
   -> Credential Enrollment Bundle 2 queued second.

   Expected:
   - Revoke persists first.
   - Bundle 2 reloads authoritative Recipient Trust afterward.
   - Bundle 2 fails specifically with SIGNING_KEY_REVOKED.
   - No stale pre-revocation trusted-key snapshot is used.
   - Entire Control Store remains unchanged by rejected Bundle 2.

   SECURITY:

   - Real P-256 Control Center keys.
   - Real signing-key rotation.
   - Real signed Branch Access + Portability children.
   - Real signed Recipient Trust transition.
   - No fake trusted signer result.
   - No unsafe authority cast.
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
  signFinoraControlCenterCanonicalValue,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  issueFinoraBranchAccessPackage,
} from "../control-center/finoraControlCenterIssuanceCoordinator.js";

import {
  issueFinoraBranchCredentialEnrollmentBundle,
} from "../control-center/finoraBranchCredentialEnrollmentBundleIssuer.js";

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
  applyFinoraBranchCredentialEnrollmentBundleWithAuthoritativeRecipientTrust,
} from "./finoraAuthoritativeBranchCredentialEnrollmentBundleApplyService.js";

import {
  runFinoraRecipientTrustAuthoritySerialized,
} from "./finoraRecipientTrustAuthorityQueue.js";

import {
  loadFinoraRecipientTrustStore,
  persistFinoraRecipientTrustStore,
} from "./finoraRecipientTrustStore.js";

import {
  applyFinoraSignedRecipientTrustTransition,
} from "./finoraRecipientTrustTransitionApplyService.js";

import {
  FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,
  FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,
  canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope,
  createFinoraRecipientTrustTransitionPayloadDigest,
} from "./finoraRecipientTrustTransitionContract.js";

import type {
  FinoraRecipientTrustRevokeRetiredPayload,
  FinoraRecipientTrustTransitionSignedEnvelope,
  FinoraRecipientTrustTransitionTarget,
  FinoraRecipientTrustTransitionUnsignedEnvelope,
} from "./finoraRecipientTrustTransitionContract.js";

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

function addMilliseconds(
  timestamp:
    string,

  milliseconds:
    number,
): string {

  return new Date(
    Date.parse(
      timestamp,
    ) +
      milliseconds,
  ).toISOString();
}

function createQueueBlocker() {
  let release:
    (() => void) |
    undefined;

  const gate =
    new Promise<void>(
      (
        resolve,
      ) => {
        release =
          resolve;
      },
    );

  const blocker =
    runFinoraRecipientTrustAuthoritySerialized(
      async () => {
        await gate;
      },
    );

  assert(
    release !==
      undefined,
    "Unable to create shared Recipient Trust queue blocker.",
  );

  return {
    blocker,
    release,
  };
}

function createSignedRevokeTransition(
  input: {
    packageId:
      string;

    issuerId:
      string;

    signingKeyId:
      string;

    privateKeyPkcs8DerBase64:
      string;

    revokedSigningKeyId:
      string;

    target:
      FinoraRecipientTrustTransitionTarget;

    issuedAt:
      string;

    sequence:
      number;
  },
): FinoraRecipientTrustTransitionSignedEnvelope {

  const payload:
    FinoraRecipientTrustRevokeRetiredPayload = {

      transitionFormat:
        FINORA_RECIPIENT_TRUST_TRANSITION_FORMAT,

      action:
        "REVOKE_RETIRED",

      revokedSigningKeyId:
        input.revokedSigningKeyId,

      issuedAt:
        input.issuedAt,

      schemaVersion:
        1,
    };

  const unsigned:
    FinoraRecipientTrustTransitionUnsignedEnvelope = {

      packageId:
        input.packageId,

      purpose:
        FINORA_RECIPIENT_TRUST_TRANSITION_PURPOSE,

      target: {
        ...input.target,
      },

      issuedAt:
        input.issuedAt,

      sequence:
        input.sequence,

      payloadVersion:
        1,

      payload,

      schemaVersion:
        1,

      issuer: {
        type:
          "FINORA_CONTROL_CENTER",

        issuerId:
          input.issuerId,

        signingKeyId:
          input.signingKeyId,
      },

      payloadDigest:
        createFinoraRecipientTrustTransitionPayloadDigest(
          payload,
        ),
    };

  const canonical =
    canonicalizeFinoraRecipientTrustTransitionUnsignedEnvelope(
      unsigned,
    );

  const signature =
    signFinoraControlCenterCanonicalValue(
      canonical,
      input.privateKeyPkcs8DerBase64,
    );

  return {
    ...unsigned,

    signature: {
      algorithm:
        "ECDSA_P256_SHA256",

      encoding:
        "IEEE_P1363",

      canonicalization:
        "FINORA_CANONICAL_JSON_V1",

      signingKeyId:
        input.signingKeyId,

      value:
        signature,
    },
  };
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
    // 1. ISOLATED ELECTRON STATE
    // ========================================================

    temporaryUserData =
      await mkdtemp(
        join(
          tmpdir(),
          "finora-i5e-trust-concurrency-",
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
    // 2. AUTHORITATIVE NATIVE INSTALLATION
    // ========================================================

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    const ownerId =
      "OWNER-I5E-TRUST-CONCURRENCY";

    const businessId =
      "BUSINESS-I5E-TRUST-CONCURRENCY";

    const branchId =
      "BRANCH-I5E-TRUST-CONCURRENCY";

    const userId =
      "USER-I5E-TRUST-CONCURRENCY";

    const grantId =
      "GRANT-I5E-TRUST-CONCURRENCY";

    const setupNow =
      new Date();

    const createdAt =
      new Date(
        setupNow.getTime() -
          60 *
            60 *
            1000,
      ).toISOString();

    const installation:
      FinoraControlInstallationIdentity = {

        installationId:
          nativeBinding.installationId,

        ownerId,

        businessId,

        branchId,

        businessCode:
          "I5EC",

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
      "authoritative Control Store installation persisted",
      installationResult,
    );

    const branchTarget:
      FinoraBranchAccessPackageTarget = {

        ownerId,

        businessId,

        branchId,

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          nativeBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      };

    const transitionTarget:
      FinoraRecipientTrustTransitionTarget = {

        installationId:
          nativeBinding.installationId,

        bindingKeyId:
          nativeBinding.bindingKeyId,

        fingerprintAlgorithm:
          nativeBinding.fingerprintAlgorithm,

        publicKeyFingerprint:
          nativeBinding.publicKeyFingerprint,
      };

    console.log(
      "PASS: native installation + branch/transition targets configured",
    );

    // ========================================================
    // 3. REAL CONTROL CENTER KEY A
    // ========================================================

    const vaultA =
      await loadOrCreateFinoraControlCenterKeyVault();

    const activeA:
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

    console.log(
      "PASS: real Control Center signing key A established",
    );

    // ========================================================
    // 4. ACTIVE REGISTERED BRANCH ACCESS PREREQUISITE
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
            "FINORA I5E Recipient Trust concurrency proof.",

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

    const accessPackage =
      await issueFinoraBranchAccessPackage({
        target:
          branchTarget,

        payload: {
          action:
            "ISSUE",

          accessGrant,

          schemaVersion:
            1,
        },
      });

    const accessApply =
      await applyFinoraSignedBranchAccessPackage(
        accessPackage,
        [
          activeA,
        ],
        new Date(
          Date.now() +
            5_000,
        ),
      );

    expectSuccess(
      "active REGISTERED Branch Access prerequisite applied under key A",
      accessApply,
    );

    // ========================================================
    // 5. TWO REAL CREDENTIAL BUNDLES SIGNED BY A
    // ========================================================

    const sourceAuthorization1:
      FinoraBranchCredentialEnrollmentAuthorization = {

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I5E-RACE-000001",

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

    const sourceAuthorization2:
      FinoraBranchCredentialEnrollmentAuthorization = {

        ...sourceAuthorization1,

        authorizationId:
          "FINORA-CREDENTIAL-ENROLLMENT-I5E-RACE-000002",
      };

    const bundle1 =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target:
          branchTarget,

        sourceAuthorization:
          sourceAuthorization1,
      });

    const bundle2 =
      await issueFinoraBranchCredentialEnrollmentBundle({
        target:
          branchTarget,

        sourceAuthorization:
          sourceAuthorization2,
      });

    assert(
      bundle1.branchAccessPackage.issuer.signingKeyId ===
        vaultA.signingKeyId &&
      bundle1.branchPortabilityAuthorityPackage.issuer.signingKeyId ===
        vaultA.signingKeyId &&
      bundle2.branchAccessPackage.issuer.signingKeyId ===
        vaultA.signingKeyId &&
      bundle2.branchPortabilityAuthorityPackage.issuer.signingKeyId ===
        vaultA.signingKeyId,
      "Both race bundles were not completely signed by historical key A.",
    );

    console.log(
      "PASS: two independent real Credential Enrollment Bundles signed by key A",
    );

    // ========================================================
    // 6. REAL A -> B ROTATION
    // ========================================================

    const rotation =
      await rotateFinoraControlCenterSigningKey();

    if (!rotation.success) {
      throw new Error(
        rotation.error,
      );
    }

    const vaultB =
      await loadOrCreateFinoraControlCenterKeyVault();

    assert(
      rotation.data.issuerId ===
        vaultA.issuerId &&
      rotation.data.previousSigningKeyId ===
        vaultA.signingKeyId &&
      vaultB.signingKeyId ===
        rotation.data.newSigningKeyId &&
      vaultB.issuerId ===
        vaultA.issuerId &&
      vaultB.retainedSigningKeys?.some(
        (
          retained,
        ) =>
          retained.signingKeyId ===
            vaultA.signingKeyId &&
          retained.retiredAt ===
            rotation.data.rotatedAt,
      ) ===
        true,
      "Real A-to-B signing-key rotation state is invalid.",
    );

    console.log(
      "PASS: real A-to-B Control Center rotation retained A and established active B",
    );

    // ========================================================
    // 7. AUTHORITATIVE RECIPIENT TRUST FIXTURE
    //
    // This low-level persistence is test-fixture setup only.
    // Both race operations themselves use production authorities.
    // ========================================================

    const retiredA:
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

    const activeB:
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

    async function persistRaceTrustFixture():
      Promise<void> {

      await persistFinoraRecipientTrustStore({
        schemaVersion:
          1,

        trustedKeys: [
          {
            ...retiredA,
          },
          {
            ...activeB,
          },
        ],
      });
    }

    await persistRaceTrustFixture();

    const initialTrust =
      await loadFinoraRecipientTrustStore();

    assert(
      initialTrust !==
        undefined &&
      initialTrust.trustedKeys.length ===
        2 &&
      initialTrust.trustedKeys.some(
        (
          key,
        ) =>
          key.signingKeyId ===
            retiredA.signingKeyId &&
          key.status ===
            "RETIRED",
      ) &&
      initialTrust.trustedKeys.some(
        (
          key,
        ) =>
          key.signingKeyId ===
            activeB.signingKeyId &&
          key.status ===
            "ACTIVE",
      ),
      "Initial A RETIRED + B ACTIVE Recipient Trust fixture is invalid.",
    );

    console.log(
      "PASS: Recipient Trust fixture persisted with A RETIRED + B ACTIVE",
    );

    // ========================================================
    // 8. REAL B-SIGNED REVOKE TRANSITIONS
    // ========================================================

    const transitionIssuedAt1 =
      addMilliseconds(
        rotation.data.rotatedAt,
        1000,
      );

    const transitionIssuedAt2 =
      addMilliseconds(
        rotation.data.rotatedAt,
        2000,
      );

    const revoke1 =
      createSignedRevokeTransition({
        packageId:
          "FINORA-I5E-RACE-CASE1-REVOKE-A",

        issuerId:
          vaultB.issuerId,

        signingKeyId:
          vaultB.signingKeyId,

        privateKeyPkcs8DerBase64:
          vaultB.privateKeyPkcs8DerBase64,

        revokedSigningKeyId:
          vaultA.signingKeyId,

        target:
          transitionTarget,

        issuedAt:
          transitionIssuedAt1,

        sequence:
          1,
      });

    const revoke2 =
      createSignedRevokeTransition({
        packageId:
          "FINORA-I5E-RACE-CASE2-REVOKE-A",

        issuerId:
          vaultB.issuerId,

        signingKeyId:
          vaultB.signingKeyId,

        privateKeyPkcs8DerBase64:
          vaultB.privateKeyPkcs8DerBase64,

        revokedSigningKeyId:
          vaultA.signingKeyId,

        target:
          transitionTarget,

        issuedAt:
          transitionIssuedAt2,

        sequence:
          1,
      });

    const verificationNow1 =
      new Date(
        Date.parse(
          transitionIssuedAt1,
        ) +
          1000,
      );

    const verificationNow2 =
      new Date(
        Date.parse(
          transitionIssuedAt2,
        ) +
          1000,
      );

    console.log(
      "PASS: two real B-signed REVOKE_RETIRED(A) transition fixtures created",
    );

    // ========================================================
    // 9. CASE 1 — CREDENTIAL APPLY FIRST, REVOKE SECOND
    // ========================================================

    const case1Gate =
      createQueueBlocker();

    const case1CredentialPromise =
      applyFinoraBranchCredentialEnrollmentBundleWithAuthoritativeRecipientTrust(
        bundle1,
        verificationNow1,
      );

    const case1RevokePromise =
      applyFinoraSignedRecipientTrustTransition(
        revoke1,
        verificationNow1,
      );

    case1Gate.release();

    await case1Gate.blocker;

    const [
      case1CredentialResult,
      case1RevokeResult,
    ] =
      await Promise.all([
        case1CredentialPromise,
        case1RevokePromise,
      ]);

    assert(
      case1CredentialResult.success,
      case1CredentialResult.success
        ? "Case 1 credential composition unexpectedly failed."
        : (
            case1CredentialResult.error ??
            "Case 1 credential composition failed without an error message."
          ),
    );

    assert(
      case1RevokeResult.success &&
      case1RevokeResult.data.affectedSigningKeyId ===
        vaultA.signingKeyId &&
      case1RevokeResult.data.activeSigningKeyId ===
        vaultB.signingKeyId,
      case1RevokeResult.success
        ? "Case 1 revoke returned incorrect authority metadata."
        : case1RevokeResult.error,
    );

    const trustAfterCase1 =
      await loadFinoraRecipientTrustStore();

    const aAfterCase1 =
      trustAfterCase1?.trustedKeys.find(
        (
          key,
        ) =>
          key.signingKeyId ===
            vaultA.signingKeyId,
      );

    assert(
      aAfterCase1?.status ===
        "REVOKED",
      "Case 1 did not revoke A after successful credential application.",
    );

    console.log(
      "PASS: CASE 1 credential-first ordering applied A-signed composition before B revoked A",
    );

    // ========================================================
    // 10. CASE 1 CONTROL STORE PROOF
    // ========================================================

    const afterCase1Store =
      await readFinoraControlStore();

    assert(
      afterCase1Store.success &&
        afterCase1Store.data,
      afterCase1Store.error ??
        "Unable to read Control Store after Case 1.",
    );

    const case1Authorization =
      afterCase1Store.data.branchCredentialEnrollmentAuthorizations
        ?.find(
          (
            item,
          ) =>
            item.authorizationId ===
              sourceAuthorization1.authorizationId,
        );

    const case1Provenance =
      afterCase1Store.data.branchCredentialPortabilityAuthorities
        ?.find(
          (
            item,
          ) =>
            item.sourceAuthorizationId ===
              sourceAuthorization1.authorizationId,
        );

    assert(
      case1Authorization !==
        undefined &&
      case1Provenance?.signedPortabilityAuthorityPackage.packageId ===
        bundle1.branchPortabilityAuthorityPackage.packageId,
      "Case 1 successful composition did not persist credential/provenance state.",
    );

    console.log(
      "PASS: CASE 1 persisted credential authorization + portability provenance before revocation",
    );

    // ========================================================
    // 11. RESET ONLY RECIPIENT TRUST FOR INDEPENDENT CASE 2
    //
    // Control Store deliberately remains unchanged from Case 1.
    // This creates a fresh independent trust-ordering fixture.
    // ========================================================

    await persistRaceTrustFixture();

    const resetTrust =
      await loadFinoraRecipientTrustStore();

    assert(
      resetTrust !==
        undefined &&
      resetTrust.trustedKeys.length ===
        2 &&
      resetTrust.trustedKeys.find(
        (
          key,
        ) =>
          key.signingKeyId ===
            vaultA.signingKeyId,
      )?.status ===
        "RETIRED",
      "Independent Case 2 Recipient Trust fixture reset failed.",
    );

    console.log(
      "PASS: independent Case 2 trust fixture reset to A RETIRED + B ACTIVE",
    );

    // ========================================================
    // 12. CASE 2 — REVOKE FIRST, CREDENTIAL APPLY SECOND
    // ========================================================

    const beforeCase2ControlStore =
      await readControlStoreJson();

    const case2Gate =
      createQueueBlocker();

    const case2RevokePromise =
      applyFinoraSignedRecipientTrustTransition(
        revoke2,
        verificationNow2,
      );

    const case2CredentialPromise =
      applyFinoraBranchCredentialEnrollmentBundleWithAuthoritativeRecipientTrust(
        bundle2,
        verificationNow2,
      );

    case2Gate.release();

    await case2Gate.blocker;

    const [
      case2RevokeResult,
      case2CredentialResult,
    ] =
      await Promise.all([
        case2RevokePromise,
        case2CredentialPromise,
      ]);

    assert(
      case2RevokeResult.success &&
      case2RevokeResult.data.affectedSigningKeyId ===
        vaultA.signingKeyId &&
      case2RevokeResult.data.activeSigningKeyId ===
        vaultB.signingKeyId,
      case2RevokeResult.success
        ? "Case 2 revoke returned incorrect authority metadata."
        : case2RevokeResult.error,
    );

    const case2CredentialError =
      case2CredentialResult.success
        ? undefined
        : case2CredentialResult.error;

    assert(
      !case2CredentialResult.success &&
      typeof case2CredentialError ===
        "string" &&
      case2CredentialError.includes(
        "SIGNING_KEY_REVOKED",
      ),
      case2CredentialResult.success
        ? "Case 2 A-signed credential composition unexpectedly succeeded after A revocation."
        : `Case 2 returned unexpected credential error: ${case2CredentialError ?? "<missing error>"}`,
    );

    const afterCase2ControlStore =
      await readControlStoreJson();

    assert(
      afterCase2ControlStore ===
        beforeCase2ControlStore,
      "Case 2 revoked-signer credential rejection mutated the Control Store.",
    );

    const trustAfterCase2 =
      await loadFinoraRecipientTrustStore();

    const aAfterCase2 =
      trustAfterCase2?.trustedKeys.find(
        (
          key,
        ) =>
          key.signingKeyId ===
            vaultA.signingKeyId,
      );

    assert(
      aAfterCase2?.status ===
        "REVOKED",
      "Case 2 did not persist A REVOKED before credential verification.",
    );

    console.log(
      "PASS: CASE 2 revoke-first ordering caused later A-signed credential composition to fail with SIGNING_KEY_REVOKED",
    );

    console.log(
      "PASS: CASE 2 rejection left entire Control Store unchanged",
    );

    // ========================================================
    // 13. FINAL NO-STALE-SNAPSHOT / REPLAY PROOF
    // ========================================================

    const finalStore =
      await readFinoraControlStore();

    assert(
      finalStore.success &&
        finalStore.data,
      finalStore.error ??
        "Unable to read final concurrency Control Store.",
    );

    const finalAuthorization1 =
      finalStore.data.branchCredentialEnrollmentAuthorizations
        ?.find(
          (
            item,
          ) =>
            item.authorizationId ===
              sourceAuthorization1.authorizationId,
        );

    const finalAuthorization2 =
      finalStore.data.branchCredentialEnrollmentAuthorizations
        ?.find(
          (
            item,
          ) =>
            item.authorizationId ===
              sourceAuthorization2.authorizationId,
        );

    const finalProvenance1 =
      finalStore.data.branchCredentialPortabilityAuthorities
        ?.find(
          (
            item,
          ) =>
            item.sourceAuthorizationId ===
              sourceAuthorization1.authorizationId,
        );

    const finalProvenance2 =
      finalStore.data.branchCredentialPortabilityAuthorities
        ?.find(
          (
            item,
          ) =>
            item.sourceAuthorizationId ===
              sourceAuthorization2.authorizationId,
        );

    assert(
      finalAuthorization1 !==
        undefined &&
      finalProvenance1 !==
        undefined &&
      finalAuthorization2 ===
        undefined &&
      finalProvenance2 ===
        undefined,
      "Final Control Store does not prove Case 1 applied and Case 2 remained unapplied.",
    );

    const appliedPackages =
      finalStore.data.appliedControlPackages ??
        [];

    const case1BranchApplied =
      appliedPackages.some(
        (
          record,
        ) =>
          record.packageId ===
            bundle1.branchAccessPackage.packageId,
      );

    const case2BranchApplied =
      appliedPackages.some(
        (
          record,
        ) =>
          record.packageId ===
            bundle2.branchAccessPackage.packageId,
      );

    const portability1Applied =
      appliedPackages.some(
        (
          record,
        ) =>
          record.packageId ===
            bundle1.branchPortabilityAuthorityPackage.packageId,
      );

    const portability2Applied =
      appliedPackages.some(
        (
          record,
        ) =>
          record.packageId ===
            bundle2.branchPortabilityAuthorityPackage.packageId,
      );

    assert(
      case1BranchApplied &&
      !case2BranchApplied &&
      !portability1Applied &&
      !portability2Applied,
      "Final replay state violates credential-first/revoke-first or reusable portability semantics.",
    );

    assert(
      trustAfterCase2?.appliedTrustTransitions?.length ===
        1 &&
      trustAfterCase2.trustTransitionSequences?.length ===
        1 &&
      trustAfterCase2.trustTransitionSequences[0]?.lastSequence ===
        1,
      "Independent Case 2 trust-transition replay state is incorrect.",
    );

    console.log(
      "PASS: final Control Store contains only CASE 1 credential/provenance state",
    );

    console.log(
      "PASS: reusable portability authorities remain outside normal applied-package replay state",
    );

    console.log(
      "PASS: shared Recipient Trust queue prevents stale trusted-key snapshots across credential apply and trust transition",
    );

    console.log(
      "PASS: D4E4I5E-D3B CREDENTIAL-ENROLLMENT / TRUST-TRANSITION RACE PROOF",
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
        "PASS: isolated Recipient Trust concurrency state deleted",
      );
    }
  }
}

void runSelfTest()
  .then(
    () => {
      console.log(
        "PASS: I5E-D3B concurrency self-test process exiting with code 0",
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