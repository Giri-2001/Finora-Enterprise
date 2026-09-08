/* ===========================================================
   FINORA ENTERPRISE OS™

   RECIPIENT TRUST AUTHORITY CONCURRENCY SELF TEST

   RESPONSIBILITY:

   - Prove authoritative Control Bundle apply fails closed when
     recipient trust is unbootstrapped
   - Prove Control Bundle apply and recipient trust transitions
     participate in one shared same-process serialization queue
   - Prove enqueue order determines which coherent trust state
     the bundle verification observes

   CASE 1:

   A1-signed bundle
   -> B1-signed REVOKE_RETIRED A1

   Expected:
   - bundle succeeds while A1 is still RETIRED and valid
   - revoke succeeds afterward
   - A1 ends REVOKED

   CASE 2:

   B2-signed REVOKE_RETIRED A2
   -> A2-signed bundle

   Expected:
   - revoke succeeds first
   - later bundle observes A2 REVOKED
   - bundle fails with SIGNING_KEY_REVOKED

   IMPORTANT:

   - Real Electron safeStorage.
   - Real native installation binding.
   - Real ECDSA P-256 signatures.
   - No renderer.
   - No IPC.
   - No BrowserWindow.
   - No native dialog.
   - No production Control Center key vault.
   - Same-process serialization proof only.
   - No cross-process CAS claim.
=========================================================== */

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
  canonicalizeFinoraControlCenterValue,
  createFinoraControlCenterPayloadDigest,
} from "../control-center/finoraControlCenterCanonicalization.js";

import {
  generateFinoraControlCenterSigningMaterial,
  signFinoraControlCenterCanonicalValue,
} from "../control-center/finoraControlCenterCrypto.js";

import {
  applyFinoraSignedControlBundleWithAuthoritativeRecipientTrust,
} from "./finoraAuthoritativeControlBundleApplyService.js";

import {
  ensureFinoraWindowsInstallationBinding,
} from "./finoraInstallationBindingService.js";

import {
  readFinoraControlStore,
  saveFinoraInstallationIdentity,
} from "./finoraControlStore.js";

import type {
  FinoraControlInstallationIdentity,
} from "./finoraControlStore.js";

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

import type {
  FinoraBranchTrustedControlPublicKey,
} from "./finoraSignedControlPackageVerifier.js";

// ============================================================
// TYPES
// ============================================================

type TestSigningMaterial =
  ReturnType<
    typeof generateFinoraControlCenterSigningMaterial
  >;

interface TestScope {
  ownerId:
    string;

  businessId:
    string;

  branchId:
    string;
}

interface TestBundleTarget extends TestScope {
  installationId:
    string;

  bindingKeyId:
    string;

  fingerprintAlgorithm:
    "SHA-256";

  publicKeyFingerprint:
    string;
}

// ============================================================
// ASSERT
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

// ============================================================
// TRUSTED KEYS
// ============================================================

function createActiveTrustedKey(
  issuerId:
    string,

  material:
    TestSigningMaterial,

  validFrom:
    string,
): FinoraBranchTrustedControlPublicKey {
  return {
    issuerId,

    signingKeyId:
      material.signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      material.publicKeySpkiDerBase64,

    status:
      "ACTIVE",

    validFrom,
  };
}

function createRetiredTrustedKey(
  issuerId:
    string,

  material:
    TestSigningMaterial,

  validFrom:
    string,

  validUntil:
    string,
): FinoraBranchTrustedControlPublicKey {
  return {
    issuerId,

    signingKeyId:
      material.signingKeyId,

    algorithm:
      "ECDSA_P256_SHA256",

    format:
      "SPKI_DER_BASE64",

    publicKey:
      material.publicKeySpkiDerBase64,

    status:
      "RETIRED",

    validFrom,

    validUntil,
  };
}

// ============================================================
// CONTROL PACKAGE SIGNING
// ============================================================

function createSignedControlPackage(
  input: {
    packageId:
      string;

    purpose:
      string;

    target:
      TestBundleTarget;

    issuedAt:
      string;

    sequence:
      number;

    payload:
      Record<string, unknown>;

    issuerId:
      string;

    material:
      TestSigningMaterial;
  },
) {
  const unsignedPackage = {
    packageId:
      input.packageId,

    purpose:
      input.purpose,

    issuer: {
      type:
        "FINORA_CONTROL_CENTER" as const,

      issuerId:
        input.issuerId,

      signingKeyId:
        input.material.signingKeyId,
    },

    target: {
      ...input.target,
    },

    issuedAt:
      input.issuedAt,

    sequence:
      input.sequence,

    payloadVersion:
      1,

    payload:
      input.payload,

    payloadDigest:
      createFinoraControlCenterPayloadDigest(
        input.payload,
      ),

    schemaVersion:
      1 as const,
  };

  const canonical =
    canonicalizeFinoraControlCenterValue(
      unsignedPackage,
    );

  const signature =
    signFinoraControlCenterCanonicalValue(
      canonical,
      input.material.privateKeyPkcs8DerBase64,
    );

  return {
    ...unsignedPackage,

    signature: {
      algorithm:
        "ECDSA_P256_SHA256" as const,

      encoding:
        "IEEE_P1363" as const,

      canonicalization:
        "FINORA_CANONICAL_JSON_V1" as const,

      signingKeyId:
        input.material.signingKeyId,

      value:
        signature,
    },
  };
}

// ============================================================
// CONTROL BUNDLE FIXTURE
// ============================================================

function createSignedPricingBundle(
  input: {
    fixtureId:
      string;

    issuerId:
      string;

    material:
      TestSigningMaterial;

    scope:
      TestScope;

    target:
      TestBundleTarget;

    issuedAt:
      string;
  },
) {
  const validFrom =
    "2026-09-07T00:00:00.000Z";

  const validUntil =
    "2026-12-31T23:59:59.000Z";

  const childPackageId =
    `FINORA-AU-${input.fixtureId}-PRICING`;

  const pricingPayload = {
    action:
      "REPLACE",

    overrideSet: {
      overrideSetId:
        `FINORA-AU-${input.fixtureId}-SET`,

      scope: {
        ownerId:
          input.scope.ownerId,

        businessId:
          input.scope.businessId,

        branchId:
          input.scope.branchId,
      },

      overrides: [
        {
          overrideId:
            `FINORA-AU-${input.fixtureId}-RULE`,

          chargeCode:
            "LOAN_DISBURSEMENT",

          model:
            "FIXED_PRICE_OVERRIDE",

          amount:
            7,

          currency:
            "INR",

          validity: {
            validFrom,

            validUntil,
          },

          schemaVersion:
            1,
        },
      ],

      schemaVersion:
        1,
    },

    installationBinding: {
      installationId:
        input.target.installationId,

      bindingKeyId:
        input.target.bindingKeyId,

      fingerprintAlgorithm:
        input.target.fingerprintAlgorithm,

      publicKeyFingerprint:
        input.target.publicKeyFingerprint,

      schemaVersion:
        1,
    },

    issuedAt:
      input.issuedAt,

    schemaVersion:
      1,
  };

  const childPackage =
    createSignedControlPackage({
      packageId:
        childPackageId,

      purpose:
        "PRICING_POLICY",

      target:
        input.target,

      issuedAt:
        input.issuedAt,

      sequence:
        1,

      payload:
        pricingPayload,

      issuerId:
        input.issuerId,

      material:
        input.material,
    });

  const bundlePayload = {
    bundleFormat:
      "FINORA_CONTROL_BUNDLE_V1",

    packages: [
      childPackage,
    ],

    issuedAt:
      input.issuedAt,

    schemaVersion:
      1,
  };

  const signedBundle =
    createSignedControlPackage({
      packageId:
        `FINORA-AU-${input.fixtureId}-OUTER`,

      purpose:
        "CONTROL_BUNDLE",

      target:
        input.target,

      issuedAt:
        input.issuedAt,

      sequence:
        1,

      payload:
        bundlePayload,

      issuerId:
        input.issuerId,

      material:
        input.material,
    });

  return {
    childPackageId,

    signedBundle,
  };
}

// ============================================================
// TRUST TRANSITION SIGNING
// ============================================================

function createSignedRevokeTransition(
  input: {
    packageId:
      string;

    issuerId:
      string;

    signer:
      TestSigningMaterial;

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
          input.signer.signingKeyId,
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
      input.signer.privateKeyPkcs8DerBase64,
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
        input.signer.signingKeyId,

      value:
        signature,
    },
  };
}

// ============================================================
// QUEUE BLOCKER
//
// Hold the shared authority queue while both public operations
// are synchronously enqueued. Releasing this blocker causes
// those operations to execute in their enqueue order.
// ============================================================

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
    "Unable to create shared queue blocker.",
  );

  return {
    blocker,

    release,
  };
}

// ============================================================
// SELF TEST
// ============================================================

async function runSelfTest():
  Promise<void> {
  const temporaryUserData =
    await mkdtemp(
      join(
        tmpdir(),
        "finora-recipient-trust-authority-concurrency-selftest-",
      ),
    );

  try {
    // --------------------------------------------------------
    // ISOLATED ELECTRON STATE
    // --------------------------------------------------------

    app.setPath(
      "userData",
      temporaryUserData,
    );

    await app.whenReady();

    console.log(
      "PASS: isolated Electron userData configured",
    );

    // --------------------------------------------------------
    // AUTHORITATIVE NATIVE INSTALLATION
    // --------------------------------------------------------

    const nativeBinding =
      await ensureFinoraWindowsInstallationBinding();

    const scope:
      TestScope = {
        ownerId:
          "OWNER-TRUST-AUTHORITY-CONCURRENCY-E2E",

        businessId:
          "BUSINESS-TRUST-AUTHORITY-CONCURRENCY-E2E",

        branchId:
          "BRANCH-TRUST-AUTHORITY-CONCURRENCY-E2E",
      };

    const installationCreatedAt =
      "2026-09-06T00:00:00.000Z";

    const installation:
      FinoraControlInstallationIdentity = {
        installationId:
          nativeBinding.installationId,

        ownerId:
          scope.ownerId,

        businessId:
          scope.businessId,

        branchId:
          scope.branchId,

        businessCode:
          "AU001",

        branchCode:
          "B01",

        createdAt:
          installationCreatedAt,

        updatedAt:
          installationCreatedAt,

        schemaVersion:
          1,
      };

    const saveInstallationResult =
      await saveFinoraInstallationIdentity(
        installation,
      );

    assert(
      saveInstallationResult.success,
      saveInstallationResult.error ??
        "Unable to persist concurrency-test installation identity.",
    );

    const bundleTarget:
      TestBundleTarget = {
        ...scope,

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
      "PASS: authoritative native + Control Store installation target configured",
    );

    // --------------------------------------------------------
    // UNBOOTSTRAPPED FAIL-CLOSED
    // --------------------------------------------------------

    const controlStoreBeforeUnbootstrapped =
      await readFinoraControlStore();

    assert(
      controlStoreBeforeUnbootstrapped.success &&
        controlStoreBeforeUnbootstrapped.data,
      controlStoreBeforeUnbootstrapped.error ??
        "Unable to snapshot Control Store before unbootstrapped test.",
    );

    const beforeUnbootstrappedSnapshot =
      JSON.stringify(
        controlStoreBeforeUnbootstrapped.data,
      );

    const unbootstrappedResult =
      await applyFinoraSignedControlBundleWithAuthoritativeRecipientTrust(
        {},
        new Date(
          "2026-09-07T12:00:00.000Z",
        ),
      );

    assert(
      !unbootstrappedResult.success &&
        unbootstrappedResult.error.includes(
          "recipient trust must be bootstrapped",
        ),
      unbootstrappedResult.success
        ? "Unbootstrapped authoritative bundle apply unexpectedly succeeded."
        : `Unexpected unbootstrapped error: ${unbootstrappedResult.error}`,
    );

    const controlStoreAfterUnbootstrapped =
      await readFinoraControlStore();

    assert(
      controlStoreAfterUnbootstrapped.success &&
        controlStoreAfterUnbootstrapped.data &&
        JSON.stringify(
          controlStoreAfterUnbootstrapped.data,
        ) ===
          beforeUnbootstrappedSnapshot,
      "Unbootstrapped authoritative bundle rejection mutated the Control Store.",
    );

    console.log(
      "PASS: unbootstrapped authoritative Control Bundle apply failed closed with zero Control Store mutation",
    );

    // --------------------------------------------------------
    // TWO INDEPENDENT ISSUER FIXTURES
    // --------------------------------------------------------

    const issuer1 =
      "FINORA-CC-AU-CONCURRENCY-ISSUER-1";

    const issuer2 =
      "FINORA-CC-AU-CONCURRENCY-ISSUER-2";

    const materialA1 =
      generateFinoraControlCenterSigningMaterial();

    const materialB1 =
      generateFinoraControlCenterSigningMaterial();

    const materialA2 =
      generateFinoraControlCenterSigningMaterial();

    const materialB2 =
      generateFinoraControlCenterSigningMaterial();

    const historicalValidFrom =
      "2026-09-07T00:00:00.000Z";

    const historicalValidUntil =
      "2026-09-07T10:30:00.000Z";

    const currentValidFrom =
      "2026-09-07T10:30:00.000Z";

    await persistFinoraRecipientTrustStore({
      schemaVersion:
        1,

      trustedKeys: [
        createRetiredTrustedKey(
          issuer1,
          materialA1,
          historicalValidFrom,
          historicalValidUntil,
        ),

        createActiveTrustedKey(
          issuer1,
          materialB1,
          currentValidFrom,
        ),

        createRetiredTrustedKey(
          issuer2,
          materialA2,
          historicalValidFrom,
          historicalValidUntil,
        ),

        createActiveTrustedKey(
          issuer2,
          materialB2,
          currentValidFrom,
        ),
      ],
    });

    const initialTrust =
      await loadFinoraRecipientTrustStore();

    assert(
      initialTrust !==
        undefined &&
      initialTrust.trustedKeys.length ===
        4,
      "Initial two-issuer recipient trust fixture was not persisted.",
    );

    console.log(
      "PASS: two-issuer recipient trust fixture persisted with RETIRED A + ACTIVE B for each issuer",
    );

    // --------------------------------------------------------
    // CASE 1
    //
    // BUNDLE FIRST -> REVOKE SECOND
    // --------------------------------------------------------

    const bundle1 =
      createSignedPricingBundle({
        fixtureId:
          "CASE1",

        issuerId:
          issuer1,

        material:
          materialA1,

        scope,

        target:
          bundleTarget,

        issuedAt:
          "2026-09-07T10:00:00.000Z",
      });

    const revoke1 =
      createSignedRevokeTransition({
        packageId:
          "FINORA-AU-CASE1-REVOKE-A1",

        issuerId:
          issuer1,

        signer:
          materialB1,

        revokedSigningKeyId:
          materialA1.signingKeyId,

        target:
          transitionTarget,

        issuedAt:
          "2026-09-07T11:00:00.000Z",

        sequence:
          1,
      });

    const case1Gate =
      createQueueBlocker();

    const case1BundlePromise =
      applyFinoraSignedControlBundleWithAuthoritativeRecipientTrust(
        bundle1.signedBundle,
        new Date(
          "2026-09-07T12:00:00.000Z",
        ),
      );

    const case1RevokePromise =
      applyFinoraSignedRecipientTrustTransition(
        revoke1,
        new Date(
          "2026-09-07T12:00:00.000Z",
        ),
      );

    case1Gate.release();

    await case1Gate.blocker;

    const [
      case1BundleResult,
      case1RevokeResult,
    ] =
      await Promise.all([
        case1BundlePromise,
        case1RevokePromise,
      ]);

    assert(
      case1BundleResult.success,
      case1BundleResult.success
        ? "Case 1 bundle unexpectedly failed."
        : case1BundleResult.error,
    );

    assert(
      case1RevokeResult.success &&
        case1RevokeResult.data.affectedSigningKeyId ===
          materialA1.signingKeyId &&
        case1RevokeResult.data.activeSigningKeyId ===
          materialB1.signingKeyId,
      case1RevokeResult.success
        ? "Case 1 revoke returned incorrect authority metadata."
        : case1RevokeResult.error,
    );

    const trustAfterCase1 =
      await loadFinoraRecipientTrustStore();

    const a1AfterCase1 =
      trustAfterCase1?.trustedKeys.find(
        (
          key,
        ) =>
          key.issuerId ===
            issuer1 &&
          key.signingKeyId ===
            materialA1.signingKeyId,
      );

    assert(
      a1AfterCase1?.status ===
        "REVOKED",
      "Case 1 did not revoke historical signer A1 after bundle application.",
    );

    console.log(
      "PASS: CASE 1 bundle-first ordering applied A1-signed bundle before B1 revoked A1",
    );

    // --------------------------------------------------------
    // CASE 2
    //
    // REVOKE FIRST -> BUNDLE SECOND
    // --------------------------------------------------------

    const bundle2 =
      createSignedPricingBundle({
        fixtureId:
          "CASE2",

        issuerId:
          issuer2,

        material:
          materialA2,

        scope,

        target:
          bundleTarget,

        issuedAt:
          "2026-09-07T10:00:00.000Z",
      });

    const revoke2 =
      createSignedRevokeTransition({
        packageId:
          "FINORA-AU-CASE2-REVOKE-A2",

        issuerId:
          issuer2,

        signer:
          materialB2,

        revokedSigningKeyId:
          materialA2.signingKeyId,

        target:
          transitionTarget,

        issuedAt:
          "2026-09-07T11:00:00.000Z",

        sequence:
          1,
      });

    const case2Gate =
      createQueueBlocker();

    const case2RevokePromise =
      applyFinoraSignedRecipientTrustTransition(
        revoke2,
        new Date(
          "2026-09-07T12:00:00.000Z",
        ),
      );

    const case2BundlePromise =
      applyFinoraSignedControlBundleWithAuthoritativeRecipientTrust(
        bundle2.signedBundle,
        new Date(
          "2026-09-07T12:00:00.000Z",
        ),
      );

    case2Gate.release();

    await case2Gate.blocker;

    const [
      case2RevokeResult,
      case2BundleResult,
    ] =
      await Promise.all([
        case2RevokePromise,
        case2BundlePromise,
      ]);

    assert(
      case2RevokeResult.success &&
        case2RevokeResult.data.affectedSigningKeyId ===
          materialA2.signingKeyId &&
        case2RevokeResult.data.activeSigningKeyId ===
          materialB2.signingKeyId,
      case2RevokeResult.success
        ? "Case 2 revoke returned incorrect authority metadata."
        : case2RevokeResult.error,
    );

    assert(
      !case2BundleResult.success &&
        case2BundleResult.error.includes(
          "SIGNING_KEY_REVOKED",
        ),
      case2BundleResult.success
        ? "Case 2 A2-signed bundle unexpectedly succeeded after A2 revocation."
        : `Case 2 returned unexpected bundle error: ${case2BundleResult.error}`,
    );

    const trustAfterCase2 =
      await loadFinoraRecipientTrustStore();

    const a2AfterCase2 =
      trustAfterCase2?.trustedKeys.find(
        (
          key,
        ) =>
          key.issuerId ===
            issuer2 &&
          key.signingKeyId ===
            materialA2.signingKeyId,
      );

    assert(
      a2AfterCase2?.status ===
        "REVOKED",
      "Case 2 did not persist A2 REVOKED.",
    );

    console.log(
      "PASS: CASE 2 revoke-first ordering caused later A2-signed bundle to fail with SIGNING_KEY_REVOKED",
    );

    // --------------------------------------------------------
    // FINAL CONTROL STORE PROOF
    // --------------------------------------------------------

    const finalControlStore =
      await readFinoraControlStore();

    assert(
      finalControlStore.success &&
        finalControlStore.data,
      finalControlStore.error ??
        "Unable to load final concurrency-test Control Store.",
    );

    const appliedPackages =
      finalControlStore.data.appliedControlPackages ??
        [];

    const case1ChildApplied =
      appliedPackages.some(
        (
          record,
        ) =>
          record.packageId ===
            bundle1.childPackageId,
      );

    const case2ChildApplied =
      appliedPackages.some(
        (
          record,
        ) =>
          record.packageId ===
            bundle2.childPackageId,
      );

    assert(
      case1ChildApplied &&
        !case2ChildApplied,
      "Final Control Store does not prove case-1 child applied and case-2 child remained unapplied.",
    );

    assert(
      trustAfterCase2?.appliedTrustTransitions?.length ===
        2 &&
      trustAfterCase2.trustTransitionSequences?.length ===
        2 &&
      trustAfterCase2.trustTransitionSequences.every(
        (
          state,
        ) =>
          state.lastSequence ===
            1,
      ),
      "Final recipient trust replay state does not contain both issuer-specific sequence-1 revocations.",
    );

    console.log(
      "PASS: final Control Store contains only the bundle-first child while both trust revocations persisted",
    );

    console.log(
      "============================================================",
    );

    console.log(
      "PASS: FINORA RECIPIENT TRUST AUTHORITY CONCURRENCY E2E SELFTEST",
    );

    console.log(
      "============================================================",
    );

  } finally {
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
      "PASS: isolated recipient-trust authority concurrency userData deleted",
    );
  }
}

// ============================================================
// ENTRY
// ============================================================

void runSelfTest()
  .then(
    () => {
      app.exit(
        0,
      );
    },
  )
  .catch(
    (
      error,
    ) => {
      console.error(
        "FAIL: FINORA RECIPIENT TRUST AUTHORITY CONCURRENCY E2E SELFTEST",
        error,
      );

      app.exit(
        1,
      );
    },
  );

// ============================================================
// END
// ============================================================